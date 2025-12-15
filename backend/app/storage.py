import os
import logging
from io import BytesIO
from uuid import uuid4
from typing import Optional, Tuple

from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_COVERS = os.getenv("MINIO_BUCKET_COVERS", "bookex-covers")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL")
MINIO_PREFER_DIRECT_URL = os.getenv("MINIO_PREFER_DIRECT_URL", "false").lower() == "true"
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

TARGET_COVER_SIZE = (600, 900)

_minio_client: Optional[Minio] = None


def get_minio_client() -> Minio:
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            endpoint=MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE
        )
        try:
            if not _minio_client.bucket_exists(MINIO_BUCKET_COVERS):
                _minio_client.make_bucket(MINIO_BUCKET_COVERS)
                logger.info("Создан бакет MinIO %s", MINIO_BUCKET_COVERS)
        except S3Error as exc:
            logger.error("Не удалось проверить/создать бакет MinIO: %s", exc)
            raise
    return _minio_client


def _process_image(upload_file) -> Tuple[BytesIO, str]:
    upload_file.file.seek(0)
    buffer = BytesIO()
    content_type = upload_file.content_type or "image/jpeg"
    try:
        image = Image.open(upload_file.file)
        image = image.convert("RGB")
        width, height = image.size

        if width == 0 or height == 0:
            raise ValueError("Передан пустой файл")

        target_ratio = TARGET_COVER_SIZE[0] / TARGET_COVER_SIZE[1]
        current_ratio = width / height

        if current_ratio > target_ratio:
            new_width = int(target_ratio * height)
            offset = (width - new_width) // 2
            crop_box = (offset, 0, offset + new_width, height)
        else:
            new_height = int(width / target_ratio)
            offset = (height - new_height) // 2
            crop_box = (0, offset, width, offset + new_height)

        image = image.crop(crop_box)
        image = image.resize(TARGET_COVER_SIZE, Image.LANCZOS)
        image.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)
        content_type = "image/jpeg"
    except Exception as exc:
        logger.warning("Не удалось обработать изображение, загружаем оригинал: %s", exc)
        upload_file.file.seek(0)
        buffer = BytesIO(upload_file.file.read())
        buffer.seek(0)
    finally:
        upload_file.file.seek(0)
    return buffer, content_type


def upload_book_cover(upload_file) -> str:
    client = get_minio_client()
    object_name = f"covers/{uuid4().hex}.jpg"
    buffer, content_type = _process_image(upload_file)
    data = buffer.getvalue()

    try:
        client.put_object(
            bucket_name=MINIO_BUCKET_COVERS,
            object_name=object_name,
            data=BytesIO(data),
            length=len(data),
            content_type=content_type
        )
    except S3Error as exc:
        logger.error("Ошибка загрузки файла в MinIO: %s", exc)
        raise HTTPException(status_code=500, detail="Не удалось загрузить обложку")

    return object_name


def delete_book_cover(object_name: Optional[str]):
    if not object_name:
        return
    if "/" not in object_name:
        return
    client = get_minio_client()
    try:
        client.remove_object(MINIO_BUCKET_COVERS, object_name)
    except S3Error as exc:
        logger.warning("Не удалось удалить обложку %s: %s", object_name, exc)


def get_book_cover_url(object_name: Optional[str]) -> Optional[str]:
    if not object_name:
        return None
    # Старые файлы хранятся локально без структуры директорий
    if "/" not in object_name:
        base_app = APP_BASE_URL.rstrip("/")
        normalized = object_name.lstrip("/")
        return f"{base_app}/uploads/covers/{normalized}"
    if MINIO_PUBLIC_URL and MINIO_PREFER_DIRECT_URL:
        base = MINIO_PUBLIC_URL.rstrip("/")
        return f"{base}/{object_name}"
    base_app = APP_BASE_URL.rstrip("/")
    normalized_object = object_name.lstrip("/")
    return f"{base_app}/media/{normalized_object}"
