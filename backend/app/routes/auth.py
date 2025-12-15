from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models import Book, User
from ..schemas import (
    BookResponse,
    UserCreate,
    UserResponse,
    Token,
    RefreshTokenRequest,
    UserUpdate
)
from ..security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    SECRET_KEY,
    ALGORITHM
)
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Почта уже зарегистрирована"
        )
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя пользователя уже занято"
        )
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        city=user_data.city,
        about=user_data.about
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": db_user.username, "user_id": db_user.id}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильно введено имя пользователя или пароль"
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token_data = jwt.decode(
            payload.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        if token_data.get("token_type") != "refresh":
            raise credentials_exception

        username: str = token_data.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/profile/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Можно убрать эту зависимость для публичного доступа
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/profile/{user_id}/books", response_model=List[BookResponse])
def get_user_books(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Можно убрать эту зависимость для публичного доступа
):
    books = db.query(Book).filter(Book.owner_id == user_id, Book.status == "available").options(joinedload(Book.owner)).all()
    return books

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.city is not None:
        current_user.city = payload.city
    if payload.about is not None:
        current_user.about = payload.about

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
