from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from app.core.mail import send_email
from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.user import User, UserStatus
from app.core.security import (
    get_password_hash,
    verify_password,
    create_password_reset_token,
    verify_password_reset_token,
)

from app.core.limiter import limiter
from app.db.session import get_db
from app.models.opd import OPD
from app.core.jwt import create_access_token
from app.schemas.user import (
    RegisterRequest,
    LoginRequest,
    UserOut,
    LoginResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.core.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar."
        )

    opd = db.query(OPD).filter(OPD.id == payload.opd_id).first()
    if not opd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instansi yang dipilih tidak valid."
        )

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        opd_id=opd.id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=LoginResponse)
@limiter.limit("20/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == UserStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda masih menunggu persetujuan admin."
        )

    if user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registrasi Anda ditolak. Silakan hubungi admin."
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from app.core.mail import send_email

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    generic_message = "Jika email terdaftar, instruksi reset akan dikirim."

    if not user:
        return {"message": generic_message}

    reset_token = create_password_reset_token(user.email)

    email_body = f"""
    <p>Halo {user.full_name},</p>
    <p>Kami menerima permintaan reset password untuk akun Anda.</p>
    <p>Gunakan token berikut untuk reset password (berlaku 15 menit):</p>
    <p><strong>{reset_token}</strong></p>
    <p>Jika Anda tidak merasa meminta ini, abaikan email ini.</p>
    """

    background_tasks.add_task(
        send_email,
        to=user.email,
        subject="Reset Password - Suara DIY",
        body=email_body
    )

    return {"message": generic_message}

@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token reset password tidak valid atau sudah kedaluwarsa."
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Password berhasil diubah. Silakan login kembali."}