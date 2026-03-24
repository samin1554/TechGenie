from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.billing import CheckoutResponse, PortalResponse
from app.services.billing_service import BillingService

router = APIRouter()


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checkout_url = await BillingService.create_checkout_session(db, user)
    return CheckoutResponse(checkout_url=checkout_url)


@router.get("/portal", response_model=PortalResponse)
async def get_billing_portal(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")
    portal_url = await BillingService.create_portal_session(user.stripe_customer_id)
    return PortalResponse(portal_url=portal_url)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    await BillingService.handle_webhook(db, payload, sig_header)
    return {"received": True}
