import mimetypes
import os
import uuid
from pathlib import Path

import httpx
from fastapi import HTTPException, UploadFile

from .config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _supabase_enabled() -> bool:
    return bool(
        settings.supabase_url.strip()
        and settings.supabase_secret_key.strip()
        and settings.supabase_storage_bucket.strip()
    )


def _storage_headers(content_type: str | None = None) -> dict[str, str]:
    key = settings.supabase_secret_key.strip()
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "x-upsert": "false",
        "cache-control": "3600",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


async def save_product_photo(photo: UploadFile | None) -> str | None:
    if not photo or not photo.filename:
        return None

    ext = Path(photo.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Photo must be JPG, PNG or WEBP")

    content = await photo.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Photo must be 5 MB or smaller")

    content_type = photo.content_type or mimetypes.guess_type(photo.filename)[0] or "application/octet-stream"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    filename = f"products/{uuid.uuid4().hex}{ext}"

    if _supabase_enabled():
        base = settings.supabase_url.rstrip("/")
        bucket = settings.supabase_storage_bucket.strip()
        upload_url = f"{base}/storage/v1/object/{bucket}/{filename}"

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    upload_url,
                    content=content,
                    headers=_storage_headers(content_type),
                )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Could not reach Supabase Storage: {exc}") from exc

        if response.status_code not in (200, 201):
            try:
                detail = response.json().get("message") or response.json().get("error")
            except Exception:
                detail = response.text
            raise HTTPException(
                status_code=502,
                detail=f"Supabase Storage upload failed: {detail or response.status_code}",
            )

        return f"{base}/storage/v1/object/public/{bucket}/{filename}"

    # Local-development fallback. Production on Render Free should configure Supabase Storage.
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    path = upload_dir / Path(filename).name
    path.write_bytes(content)
    return str(path)


async def delete_product_photo(photo_path: str | None) -> None:
    if not photo_path:
        return

    if photo_path.startswith("http://") or photo_path.startswith("https://"):
        if not _supabase_enabled():
            return

        base = settings.supabase_url.rstrip("/")
        bucket = settings.supabase_storage_bucket.strip()
        public_prefix = f"{base}/storage/v1/object/public/{bucket}/"
        if not photo_path.startswith(public_prefix):
            return

        object_path = photo_path[len(public_prefix):]
        delete_url = f"{base}/storage/v1/object/{bucket}"

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.request(
                    "DELETE",
                    delete_url,
                    json={"prefixes": [object_path]},
                    headers=_storage_headers("application/json"),
                )
            # Image cleanup should not make an otherwise valid inventory operation fail.
            if response.status_code not in (200, 204):
                return
        except httpx.RequestError:
            return
        return

    try:
        Path(photo_path).unlink(missing_ok=True)
    except OSError:
        pass
