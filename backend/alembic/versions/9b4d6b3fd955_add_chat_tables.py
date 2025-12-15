"""add chat tables

Revision ID: 9b4d6b3fd955
Revises: bb6c28fda0e0
Create Date: 2025-01-29 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b4d6b3fd955'
down_revision = 'bb6c28fda0e0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'chat_threads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_one_id', sa.Integer(), nullable=False),
        sa.Column('user_two_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_message', sa.Text(), nullable=True),
        sa.Column('last_sender_id', sa.Integer(), nullable=True),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['last_sender_id'], ['users.id']),
        sa.ForeignKeyConstraint(['user_one_id'], ['users.id']),
        sa.ForeignKeyConstraint(['user_two_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_threads_id', 'chat_threads', ['id'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('thread_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
        sa.ForeignKeyConstraint(['thread_id'], ['chat_threads.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'], unique=False)
    op.create_index('ix_chat_messages_thread_id', 'chat_messages', ['thread_id'], unique=False)


def downgrade():
    op.drop_index('ix_chat_messages_thread_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_id', table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index('ix_chat_threads_id', table_name='chat_threads')
    op.drop_table('chat_threads')
