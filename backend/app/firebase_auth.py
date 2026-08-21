from typing import Any

import httpx
from fastapi import HTTPException

from .config import settings


BASE_URL = "https://identitytoolkit.googleapis.com/v1"


ERROR_MESSAGES = {
    "EMAIL_EXISTS": "An account with this email already exists.",
    "EMAIL_NOT_FOUND": "No account was found for this email.",
    "INVALID_PASSWORD": "Invalid email or password.",
    "INVALID_LOGIN_CREDENTIALS": "Invalid email or password.",
    "INVALID_EMAIL": "Enter a valid email address.",
    "MISSING_PASSWORD": "Enter your password.",
    "WEAK_PASSWORD": "Password must be at least 6 characters.",
    "OPERATION_NOT_ALLOWED": "Email/password sign-in is not enabled in Firebase Authentication.",
    "TOO_MANY_ATTEMPTS_TRY_LATER": "Too many attempts. Please wait a few minutes and try again.",
    "USER_DISABLED": "This account has been disabled.",
    "INVALID_ID_TOKEN": "Your authentication session expired. Please sign in again.",
    "USER_NOT_FOUND": "Account not found.",
}


def _require_config() -> None:
    if settings.auth_provider.strip().lower() != "firebase":
        raise HTTPException(status_code=500, detail="AUTH_PROVIDER must be firebase")
    key = settings.firebase_web_api_key.strip()
    if not key or key.upper().startswith("PASTE_") or key.upper().startswith("YOUR_"):
        raise HTTPException(
            status_code=500,
            detail=(
                "Firebase Authentication is not configured. Add FIREBASE_WEB_API_KEY to backend/.env "
                "and enable Email/Password sign-in in Firebase Authentication."
            ),
        )


def _firebase_error(response: httpx.Response) -> HTTPException:
    status_code = 400
    try:
        payload = response.json()
        raw = str(payload.get("error", {}).get("message", "FIREBASE_AUTH_ERROR"))
    except Exception:
        raw = "FIREBASE_AUTH_ERROR"

    # Some Firebase errors contain extra text after a colon.
    code = raw.split(" : ", 1)[0].split(":", 1)[0].strip()
    message = ERROR_MESSAGES.get(code, raw.replace("_", " ").title())

    if code in {"INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND"}:
        status_code = 401
    elif code == "EMAIL_EXISTS":
        status_code = 409
    elif code in {"TOO_MANY_ATTEMPTS_TRY_LATER"}:
        status_code = 429
    elif response.status_code >= 500:
        status_code = 502

    return HTTPException(status_code=status_code, detail=message)


def _post(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    _require_config()
    url = f"{BASE_URL}/{endpoint}?key={settings.firebase_web_api_key.strip()}"
    try:
        with httpx.Client(timeout=settings.firebase_timeout_seconds) as client:
            response = client.post(url, json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Firebase Authentication: {exc}")

    if not response.is_success:
        raise _firebase_error(response)
    return response.json()


def sign_up(email: str, password: str) -> dict[str, Any]:
    return _post(
        "accounts:signUp",
        {"email": email, "password": password, "returnSecureToken": True},
    )


def sign_in(email: str, password: str) -> dict[str, Any]:
    return _post(
        "accounts:signInWithPassword",
        {"email": email, "password": password, "returnSecureToken": True},
    )


def send_verification_email(id_token: str) -> dict[str, Any]:
    return _post(
        "accounts:sendOobCode",
        {"requestType": "VERIFY_EMAIL", "idToken": id_token},
    )


def send_password_reset_email(email: str) -> dict[str, Any]:
    return _post(
        "accounts:sendOobCode",
        {"requestType": "PASSWORD_RESET", "email": email},
    )


def lookup_user(id_token: str) -> dict[str, Any]:
    data = _post("accounts:lookup", {"idToken": id_token})
    users = data.get("users") or []
    if not users:
        raise HTTPException(status_code=401, detail="Account not found.")
    return users[0]


def update_password(id_token: str, new_password: str) -> dict[str, Any]:
    return _post(
        "accounts:update",
        {"idToken": id_token, "password": new_password, "returnSecureToken": True},
    )
