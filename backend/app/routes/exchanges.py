from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Exchange, Book, User
from ..schemas import ExchangeResponse, ExchangeCreate
from ..security import get_current_user
from ..dependencies import get_socket_manager
from ..storage import get_book_cover_url

router = APIRouter(prefix="/exchanges", tags=["exchanges"])

@router.post("/", response_model=ExchangeResponse)
def create_exchange(
    exchange: ExchangeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager=Depends(get_socket_manager)  # Получаем socket_manager через dependency injection
):
    # Проверяем, что книга существует
    book = db.query(Book).filter(Book.id == exchange.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Проверяем, что пользователь не пытается обменять свою же книгу
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot exchange your own book")
    
    # Проверяем, нет ли уже активного предложения обмена
    existing_exchange = db.query(Exchange).filter(
        Exchange.book_id == exchange.book_id,
        Exchange.status.in_(["pending", "accepted"])
    ).first()
    
    if existing_exchange:
        raise HTTPException(status_code=400, detail="There is already an active exchange proposal for this book")
    
    # Создаем новое предложение обмена
    db_exchange = Exchange(
        book_id=exchange.book_id,
        requester_id=current_user.id,
        owner_id=book.owner_id,
        status="pending"
    )
    db.add(db_exchange)
    db.commit()
    db.refresh(db_exchange)
    background_tasks.add_task(socket_manager.notify_new_exchange, db_exchange.id)
    return _attach_exchange_cover(db_exchange)

@router.get("/my-requests", response_model=list[ExchangeResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Получаем все предложения обмена, где текущий пользователь - запросивший
    exchanges = db.query(Exchange).filter(Exchange.requester_id == current_user.id).all()
    return _attach_exchange_cover(exchanges)

@router.get("/my-offers", response_model=list[ExchangeResponse])
def get_my_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Получаем все предложения обмена, где текущий пользователь - владелец книги
    exchanges = db.query(Exchange).filter(Exchange.owner_id == current_user.id).all()
    return _attach_exchange_cover(exchanges)

@router.put("/{exchange_id}/accept", response_model=ExchangeResponse)
def accept_exchange(
    exchange_id: int,
    background_tasks: BackgroundTasks,  # Добавьте параметр background_tasks
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager = Depends(get_socket_manager)
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    
    # Проверяем, что текущий пользователь - владелец книги
    if exchange.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this exchange")
    
    # Проверяем, что обмен еще не обработан
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="This exchange has already been processed")
    
    # Принимаем обмен
    exchange.status = "accepted"
    
    # Обновляем статус книги
    book = db.query(Book).filter(Book.id == exchange.book_id).first()
    if book:
        book.status = "exchanged"
    
    db.commit()
    db.refresh(exchange)
    background_tasks.add_task(socket_manager.notify_exchange_status_update, exchange.id, "accepted")
    return _attach_exchange_cover(exchange)

@router.put("/{exchange_id}/reject", response_model=ExchangeResponse)
def reject_exchange(
    exchange_id: int,
    background_tasks: BackgroundTasks,  # Добавьте параметр background_tasks
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager = Depends(get_socket_manager)
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    
    # Проверяем, что текущий пользователь - владелец книги
    if exchange.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this exchange")
    
    # Проверяем, что обмен еще не обработан
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="This exchange has already been processed")
    
    # Отклоняем обмен
    exchange.status = "rejected"
    db.commit()
    db.refresh(exchange)
    background_tasks.add_task(socket_manager.notify_exchange_status_update, exchange.id, "rejected")
    return _attach_exchange_cover(exchange)

@router.delete("/{exchange_id}/cancel")
def cancel_exchange(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    
    # Проверяем, что текущий пользователь - запросивший обмен
    if exchange.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this exchange")
    
    # Проверяем, что обмен еще не обработан
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="This exchange has already been processed")
    
    # Удаляем обмен
    db.delete(exchange)
    db.commit()
    return {"message": "Exchange cancelled successfully"}
def _attach_exchange_cover(exchange: Exchange):
    if isinstance(exchange, list):
        for item in exchange:
            if item.book:
                item.book.cover_url = get_book_cover_url(item.book.cover)
    else:
        if exchange.book:
            exchange.book.cover_url = get_book_cover_url(exchange.book.cover)
    return exchange
