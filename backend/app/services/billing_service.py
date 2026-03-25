import logging

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key


class BillingService:
    @staticmethod
    async def _ensure_stripe_customer(db: AsyncSession, user: User) -> str:
        """Get or create a valid Stripe customer for this user."""
        if user.stripe_customer_id:
            try:
                stripe.Customer.retrieve(user.stripe_customer_id)
                return user.stripe_customer_id
            except stripe.error.InvalidRequestError:
                # Customer doesn't exist (e.g. switched from test to live keys)
                logger.warning(
                    "Stripe customer %s not found, creating new one for user %s",
                    user.stripe_customer_id, user.id,
                )

        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )
        user.stripe_customer_id = customer.id
        await db.commit()
        return customer.id

    @staticmethod
    async def create_checkout_session(db: AsyncSession, user: User) -> str:
        customer_id = await BillingService._ensure_stripe_customer(db, user)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.frontend_url}/billing/success",
            cancel_url=f"{settings.frontend_url}/pricing",
        )
        return session.url

    @staticmethod
    async def create_portal_session(stripe_customer_id: str) -> str:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f"{settings.frontend_url}/dashboard",
        )
        return session.url

    @staticmethod
    async def handle_webhook(
        db: AsyncSession, payload: bytes, sig_header: str
    ) -> None:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except stripe.error.SignatureVerificationError:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            customer_id = session["customer"]
            subscription_id = session.get("subscription")

            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.is_premium = True
                user.stripe_sub_id = subscription_id
                user.stripe_status = "active"
                await db.commit()

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            customer_id = subscription["customer"]

            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.is_premium = False
                user.stripe_status = "canceled"
                await db.commit()

        elif event["type"] == "invoice.payment_failed":
            invoice = event["data"]["object"]
            customer_id = invoice["customer"]

            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.stripe_status = "past_due"
                await db.commit()
