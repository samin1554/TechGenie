"""add_missing_indexes

Revision ID: a3f1b2c4d5e6
Revises: 2ed0e19c9743
Create Date: 2026-03-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a3f1b2c4d5e6'
down_revision: Union[str, None] = '2ed0e19c9743'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_user_analyses_analysis_id", "user_analyses", ["analysis_id"])
    op.create_index("ix_analyses_expires_at", "github_analyses", ["expires_at"])
    op.create_index("ix_analyses_created_at", "github_analyses", ["created_at"])
    op.create_index("ix_resumes_created_at", "resumes", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_resumes_created_at", table_name="resumes")
    op.drop_index("ix_analyses_created_at", table_name="github_analyses")
    op.drop_index("ix_analyses_expires_at", table_name="github_analyses")
    op.drop_index("ix_user_analyses_analysis_id", table_name="user_analyses")
