"""make creator nullable

Revision ID: 872eb2a3ba11
Revises: 4aa6672b3219
Create Date: 2024-03-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '872eb2a3ba11'
down_revision = '4aa6672b3219'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('tokens', 'creator',
               existing_type=sa.String(length=42),
               nullable=True)


def downgrade():
    op.alter_column('tokens', 'creator',
               existing_type=sa.String(length=42),
               nullable=False)
