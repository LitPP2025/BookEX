from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from .database import engine, Base
from .routes import auth, books, exchanges, chat, media
from .websockets import SocketManager  # Импортируем SocketManager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При запуске приложения
    print("🚀 Запуск приложения...")
    print("🔌 Инициализация вебсокет-сервера...")
    
    yield
    
    # При остановке приложения
    print("🛑 Остановка приложения...")
    if hasattr(socket_manager, 'sio'):
        print("🔌 Остановка вебсокет-сервера...")
        await socket_manager.sio.eio.shutdown()

app = FastAPI(title="Book Exchange API", version="1.0.0", lifespan=lifespan)

socket_manager = SocketManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "covers"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.state.socket_manager = socket_manager

app.mount("/ws", socket_manager.app)

app.mount("/uploads", StaticFiles(directory=BASE_DIR / "uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(exchanges.router)
app.include_router(chat.router)
app.include_router(media.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Book Exchange API"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "postgresql",
        "websockets": "enabled",
        "online_users": len(socket_manager.online_users)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
