from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.opd import OPD
from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
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
        hashed_password=hash_password(payload.password),
        opd_id=opd.id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user  


@router.post("/login", response_model=UserOut)
@limiter.limit("20/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user