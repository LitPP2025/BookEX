from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from typing import List

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    about: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserBasicResponse(BaseModel):
    id: int
    username: str
    city: Optional[str] = None
    
    class Config:
        orm_mode = True

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    genre: Optional[str] = None
    condition: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    owner_id: int
    owner: UserBasicResponse 
    cover: Optional[str] = None
    cover_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse

class PaginatedBookResponse(BaseModel):
    books: List[BookResponse]
    total_count: int
    total_pages: int
    current_page: int
    limit: int

class ExchangeBase(BaseModel):
    book_id: int
    requester_id: int
    owner_id: int
    status: Optional[str] = "pending"

class ExchangeCreate(ExchangeBase):
    pass

class ExchangeResponse(ExchangeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    book: BookResponse
    requester: UserResponse
    owner: UserResponse

    class Config:
        orm_mode = True


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChatMessageRequest(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_id: int
    content: str
    created_at: datetime
    is_read: bool

    class Config:
        orm_mode = True


class ChatThreadResponse(BaseModel):
    id: int
    partner: UserBasicResponse
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int

    class Config:
        orm_mode = True


class ChatThreadCreate(BaseModel):
    partner_id: int


class ChatThreadByUsername(BaseModel):
    username: str


class ChatThreadByBook(BaseModel):
    book_id: int
