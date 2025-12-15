from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask
from minio.error import S3Error

from ..storage import get_minio_client, MINIO_BUCKET_COVERS

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{object_path:path}")
def serve_media(object_path: str):
    """
    Проксирует файлы из MinIO, чтобы фронтенд мог запрашивать их
    по относительному пути /media/<object_path>.
    """
    if not object_path or ".." in object_path:
        raise HTTPException(status_code=404, detail="Файл не найден")

    # Разрешаем отдавать только обложки книг.
    if not object_path.startswith("covers/"):
        raise HTTPException(status_code=404, detail="Файл не найден")

    client = get_minio_client()

    try:
        stat = client.stat_object(MINIO_BUCKET_COVERS, object_path)
        obj = client.get_object(MINIO_BUCKET_COVERS, object_path)
    except S3Error:
        raise HTTPException(status_code=404, detail="Файл не найден")

    background = BackgroundTask(lambda: obj.close())
    return StreamingResponse(
        obj,
        media_type=stat.content_type or "application/octet-stream",
        headers={"Content-Length": str(stat.size)},
        background=background,
    )
