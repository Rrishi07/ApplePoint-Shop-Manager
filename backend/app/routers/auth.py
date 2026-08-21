from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..firebase_auth import (
    lookup_user,
    send_password_reset_email,
    send_verification_email,
    sign_in,
    sign_up,
    update_password,
)
from ..models import User
from ..schemas import ChangePasswordIn, ForgotIn, LoginIn, RegisterIn, ResendVerificationIn, TokenOut
from ..security import create_access_token
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/config")
def auth_config():
    return {
        "provider": settings.auth_provider,
        "verification": "email_link",
        "resend_cooldown_seconds": settings.verification_resend_cooldown_seconds,
    }


def _sync_local_user(db: Session, email: str, verified: bool) -> User:
    email = email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if user:
        # Passwords are managed by Firebase. Keep a non-secret marker only so
        # existing SQLite schemas remain compatible with the original project.
        user.password_hash = "firebase-managed"
        user.is_verified = verified
    else:
        user = User(email=email, password_hash="firebase-managed", is_verified=verified)
        db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    result = sign_up(email, data.password)
    id_token = result.get("idToken")
    if not id_token:
        raise HTTPException(status_code=502, detail="Firebase did not return an authentication token.")

    send_verification_email(id_token)
    _sync_local_user(db, email, verified=False)

    return {
        "message": "Account created. We sent a verification link to your email.",
        "email": email,
        "verification_method": "email_link",
        "resend_after_seconds": settings.verification_resend_cooldown_seconds,
    }


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationIn):
    email = data.email.lower().strip()
    result = sign_in(email, data.password)
    id_token = result.get("idToken")
    if not id_token:
        raise HTTPException(status_code=401, detail="Could not authenticate this account.")

    profile = lookup_user(id_token)
    if bool(profile.get("emailVerified")):
        return {"message": "This email is already verified. You can sign in."}

    send_verification_email(id_token)
    return {
        "message": "A new verification link was sent. Check your inbox and spam folder.",
        "resend_after_seconds": settings.verification_resend_cooldown_seconds,
    }


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    result = sign_in(email, data.password)
    id_token = result.get("idToken")
    if not id_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    profile = lookup_user(id_token)
    if not bool(profile.get("emailVerified")):
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Open the verification email, click the link, then sign in again.",
        )

    verified_email = str(profile.get("email") or email).lower().strip()
    user = _sync_local_user(db, verified_email, verified=True)
    return TokenOut(access_token=create_access_token(user.id, user.email))


@router.post("/forgot-password")
def forgot_password(data: ForgotIn):
    email = data.email.lower().strip()
    try:
        send_password_reset_email(email)
    except HTTPException as exc:
        # Do not reveal whether an account exists.
        if exc.status_code in {400, 401, 404}:
            pass
        else:
            raise
    return {
        "message": "If an account exists for that email, Firebase has sent a password-reset link."
    }


@router.post("/change-password")
def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user)):
    result = sign_in(user.email, data.current_password)
    id_token = result.get("idToken")
    if not id_token:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    update_password(id_token, data.new_password)
    return {"message": "Password changed successfully. Use your new password next time you sign in."}
