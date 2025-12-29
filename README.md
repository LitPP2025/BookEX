# BookEX

BookEX — сервис обмена книгами: каталог, профили пользователей, предложения обмена, чат и уведомления.

## Стек

- Backend: Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT, Socket.IO
- Файлы: MinIO (S3) + Pillow (обработка обложек)
- Frontend: React + TypeScript, Vite, Axios, socket.io-client

## Запуск через Docker (рекомендуется)

Требования: установлен Docker Desktop и доступна команда `docker compose`.

### 1) Старт

```bash
docker compose up -d --build
```

### 2) Адреса

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000` (также доступен через прокси `http://localhost:3000/api/*`)
- MinIO API: `http://localhost:9100`
- MinIO Console: `http://localhost:9101` (логин/пароль `minioadmin/minioadmin`)
- Postgres: `localhost:5432` (user/pass `postgres/postgres`)

### 3) Как работает `/api` в Docker

Во фронтенде используется `VITE_API_URL=/api`. Nginx (в контейнере `frontend`) проксирует:
- `http://localhost:3000/api/*` → `backend:8000/*`
- `http://localhost:3000/api/socket.io/*` → `backend:8000/socket.io/*` (websocket)

Поэтому backend формирует ссылки на обложки как `/api/media/...` и `/api/uploads/...` (через `APP_BASE_URL=/api`).

### Логи / остановка

```bash
docker compose logs -f
docker compose down
```

## Перенос данных в Docker (книги/чаты)

В Docker поднимается отдельный Postgres, поэтому по умолчанию база пустая. Чтобы перенести ваши данные из локального Postgres в Docker Postgres:

1) Сделайте дамп локальной базы (пример: `postgres` / пароль `1234`):

```bash
PGPASSWORD=1234 pg_dump -h localhost -p 5432 -U postgres -d book_exchange -F c -f book_exchange.dump
```

2) Поднимите контейнеры:

```bash
docker compose up -d
```

3) Восстановите дамп в контейнерный Postgres:

```bash
docker compose exec -T postgres pg_restore -U postgres -d book_exchange --clean --if-exists < book_exchange.dump
```

## Обложки книг (фото)

Есть два источника обложек:

1) **Legacy‑обложки** (старый формат) лежат в `backend/uploads/covers/*`.
   В Docker эта папка примонтирована в контейнер backend, поэтому ссылки `/api/uploads/covers/...` работают.

2) **Новые обложки** хранятся в MinIO как ключи вида `covers/<uuid>.jpg` и выдаются через `/api/media/covers/...`.
   В Docker MinIO использует папку `./minio-data` (в корне проекта).

Если раньше MinIO был запущен у вас локально и данные лежали в другом каталоге, их нужно скопировать в `./minio-data` или просто перезагрузить обложки через UI.

## Локальный запуск без Docker (macOS)

### Требования

- Python 3.11
- Node.js 18+ (лучше 20)
- Postgres 14+
- MinIO (если хотите хранить обложки в MinIO)

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Файл `backend/.env` должен содержать как минимум:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/book_exchange
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

MINIO_ENDPOINT=localhost:9100
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_COVERS=bookex-covers
MINIO_SECURE=false
MINIO_PREFER_DIRECT_URL=false
APP_BASE_URL=http://localhost:8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

При локальном запуске можно (опционально) создать `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

## Частые проблемы

- **Docker не запускается**: проверь, что включён Docker Desktop.
- **Пустой каталог/чат в Docker**: нужно перенести базу через dump/restore (см. выше).
- **Не видно обложки**: проверь, что в API приходит `cover_url` и открывается `http://localhost:3000/api/media/...` или `.../api/uploads/...`.
