from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session
from sqlalchemy import or_
from math import ceil
from typing import List, Optional

from ..database import get_db
from ..models import Book, User
from ..schemas import BookResponse, PaginatedBookResponse
from ..security import get_current_user
from ..storage import upload_book_cover, delete_book_cover, get_book_cover_url

router = APIRouter(prefix="/books", tags=["books"])

def _attach_cover_url(book: Book):
    if isinstance(book, list):
        for item in book:
            item.cover_url = get_book_cover_url(item.cover)
    else:
        book.cover_url = get_book_cover_url(book.cover)
    return book


@router.post("/", response_model=BookResponse)
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cover_filename = None
    if cover:
        cover_filename = upload_book_cover(cover)
    
    db_book = Book(
        title=title,
        author=author,
        description=description,
        genre=genre,
        condition=condition,
        cover=cover_filename,
        owner_id=current_user.id
    )
    
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return _attach_cover_url(db_book)

@router.get("/", response_model=PaginatedBookResponse)
def get_books(
    page: int = 1,
    limit: int = 10,
    genre: Optional[str] = None,
    condition: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Book).filter(Book.status == "available")
    
    # Применяем фильтры
    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
    if condition:
        query = query.filter(Book.condition == condition)
    if search:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%"),
                Book.description.ilike(f"%{search}%")
            )
        )
    
    # Получаем общее количество
    total_count = query.count()
    
    # Вычисляем смещение
    skip = (page - 1) * limit
    
    # Получаем книги с загруженными владельцами
    books = query.options(joinedload(Book.owner)).offset(skip).limit(limit).all()
    
    # Вычисляем общее количество страниц
    total_pages = ceil(total_count / limit) if limit > 0 else 1
    
    books = query.options(joinedload(Book.owner)).offset(skip).limit(limit).all()
    _attach_cover_url(books)
    return {
        "books": books,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit
    }

@router.get("/my-books", response_model=List[BookResponse])
def get_my_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    books = db.query(Book).filter(Book.owner_id == current_user.id).all()
    return _attach_cover_url(books)

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    return _attach_cover_url(book)

@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Не достаточно прав")
    
    book.title = title
    book.author = author
    book.description = description
    book.genre = genre
    book.condition = condition
    
    if cover:
        if book.cover:
            delete_book_cover(book.cover)
        
        book.cover = upload_book_cover(cover)
    
    db.commit()
    db.refresh(book)
    return _attach_cover_url(book)

@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Не достаточно прав")
    
    if book.cover:
        delete_book_cover(book.cover)
    
    db.delete(book)
    db.commit()
    return {"message": "Книга успешно удалена"}
