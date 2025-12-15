from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import ChatThread, ChatMessage, User, Book
from ..schemas import (
    ChatThreadResponse,
    ChatMessageResponse,
    ChatMessageRequest,
    ChatThreadCreate,
    ChatThreadByUsername,
    ChatThreadByBook
)
from ..security import get_current_user
from ..dependencies import get_socket_manager

router = APIRouter(prefix="/chat", tags=["chat"])


def _get_or_create_thread(db: Session, user_a: int, user_b: int) -> ChatThread:
    first, second = sorted([user_a, user_b])
    thread = db.query(ChatThread).filter(
        ChatThread.user_one_id == first,
        ChatThread.user_two_id == second
    ).first()
    if not thread:
        thread = ChatThread(user_one_id=first, user_two_id=second)
        db.add(thread)
        db.commit()
        db.refresh(thread)
    return thread


def _thread_to_response(db: Session, thread: ChatThread, current_user: User) -> ChatThreadResponse:
    partner = thread.user_two if thread.user_one_id == current_user.id else thread.user_one
    if not partner:
        raise HTTPException(status_code=404, detail="Участник чата не найден")

    unread_count = db.query(ChatMessage).filter(
        ChatMessage.thread_id == thread.id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read.is_(False)
    ).count()

    return ChatThreadResponse(
        id=thread.id,
        partner=partner,
        last_message=thread.last_message,
        last_message_at=thread.last_message_at,
        unread_count=unread_count
    )


def _ensure_membership(thread: ChatThread, current_user: User):
    if current_user.id not in (thread.user_one_id, thread.user_two_id):
        raise HTTPException(status_code=403, detail="Вы не участвуете в этом чате")


@router.get("/threads", response_model=List[ChatThreadResponse])
def get_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    threads = db.query(ChatThread).filter(
        or_(
            ChatThread.user_one_id == current_user.id,
            ChatThread.user_two_id == current_user.id
        )
    ).order_by(ChatThread.last_message_at.desc().nullslast()).all()

    return [_thread_to_response(db, thread, current_user) for thread in threads]


@router.post("/threads", response_model=ChatThreadResponse)
def create_thread(
    payload: ChatThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.partner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя начать чат с самим собой")

    partner = db.query(User).filter(User.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    thread = _get_or_create_thread(db, current_user.id, payload.partner_id)
    return _thread_to_response(db, thread, current_user)


@router.post("/threads/by-username", response_model=ChatThreadResponse)
def create_thread_by_username(
    payload: ChatThreadByUsername,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Имя пользователя не может быть пустым")

    partner = db.query(User).filter(User.username == username).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if partner.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя начать чат с самим собой")

    thread = _get_or_create_thread(db, current_user.id, partner.id)
    return _thread_to_response(db, thread, current_user)


@router.post("/threads/by-book", response_model=ChatThreadResponse)
def create_thread_by_book(
    payload: ChatThreadByBook,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Это ваша книга")

    thread = _get_or_create_thread(db, current_user.id, book.owner_id)
    return _thread_to_response(db, thread, current_user)


@router.get("/threads/{thread_id}/messages", response_model=List[ChatMessageResponse])
def get_thread_messages(
    thread_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    thread = db.query(ChatThread).filter(ChatThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Чат не найден")
    _ensure_membership(thread, current_user)

    messages = db.query(ChatMessage).filter(
        ChatMessage.thread_id == thread_id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()

    unread_messages = [
        message for message in messages
        if message.sender_id != current_user.id and not message.is_read
    ]
    if unread_messages:
        for message in unread_messages:
            message.is_read = True
            message.read_at = datetime.utcnow()
        db.commit()

    return messages


@router.post("/threads/{thread_id}/messages", response_model=ChatMessageResponse)
def send_message(
    thread_id: int,
    payload: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager=Depends(get_socket_manager)
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    thread = db.query(ChatThread).filter(ChatThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Чат не найден")
    _ensure_membership(thread, current_user)

    message = ChatMessage(
        thread_id=thread.id,
        sender_id=current_user.id,
        content=payload.content.strip()
    )
    db.add(message)

    thread.last_message = payload.content.strip()
    thread.last_sender_id = current_user.id
    thread.last_message_at = datetime.utcnow()

    db.commit()
    db.refresh(message)

    background_tasks.add_task(
        socket_manager.notify_chat_message,
        thread.id,
        message.id
    )

    return message
