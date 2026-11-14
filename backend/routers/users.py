import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import UserAccount
from config import OPDS as INSTANSI_LIST

router = APIRouter()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return hmac.compare_digest(password, stored)
    salt, digest = stored.split("$", 1)
    check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return hmac.compare_digest(check, digest)


class LoginPayload(BaseModel):
    email: str
    password: str


class ApprovalPayload(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")


class RolePayload(BaseModel):
    new_role: str = Field(pattern="^(admin|opd)$")


class UserUpdatePayload(BaseModel):
    full_name: str | None = None
    email: str | None = None


def ensure_seed_users(db: Session):
    """Pastikan selalu ada akun default di tabel user_accounts untuk demo/manajemen user."""
    try:
        count = db.query(UserAccount).count()
        if count == 0:
            defaults = [
                UserAccount(
                    id="admin-001",
                    full_name="Super Admin Pemda DIY",
                    email="admin@jogjaprov.go.id",
                    hashed_password=hash_password("password123"),
                    role="admin",
                    status="active",
                    opd_id="sekda",
                    opd_name="Sekretariat Daerah DIY",
                    approved_at=datetime.now(timezone.utc),
                ),
                UserAccount(
                    id="user-001",
                    full_name="Admin Analis Dikpora DIY",
                    email="user@dikpora.go.id",
                    hashed_password=hash_password("password123"),
                    role="opd",
                    status="active",
                    opd_id="dikpora",
                    opd_name="Dinas Pendidikan, Pemuda dan Olahraga DIY",
                    approved_at=datetime.now(timezone.utc),
                ),
                UserAccount(
                    id="user-002",
                    full_name="Budi Santoso",
                    email="budi@dinkes.jogjaprov.go.id",
                    hashed_password=hash_password("password123"),
                    role="opd",
                    status="pending",
                    opd_id="dinkes",
                    opd_name="Dinas Kesehatan DIY",
                ),
                UserAccount(
                    id="user-003",
                    full_name="Siti Rahmawati",
                    email="siti@kominfo.jogjaprov.go.id",
                    hashed_password=hash_password("password123"),
                    role="opd",
                    status="pending",
                    opd_id="diskominfo",
                    opd_name="Dinas Komunikasi dan Informatika DIY",
                ),
            ]
            db.add_all(defaults)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Info seed user_accounts: {e}")


def serialize_user(u: UserAccount) -> dict:
    return {
        "id": str(u.id),
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "status": u.status,
        "opd_id": u.opd_id,
        "opd_name": u.opd_name,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "approved_at": u.approved_at.isoformat() if u.approved_at else None,
    }


@router.get("/opd", tags=["OPD & Auth"])
def list_opd():
    return [
        {"id": item["id"], "name": item["nama"], "slug": item["id"]}
        for item in INSTANSI_LIST
    ]


@router.post("/auth/login", tags=["OPD & Auth"])
def login_user(payload: LoginPayload, db: Session = Depends(get_db)):
    ensure_seed_users(db)
    user = db.query(UserAccount).filter(UserAccount.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email atau password salah.")
    if user.status == "pending":
        raise HTTPException(status_code=403, detail="Akun Anda masih menunggu persetujuan admin.")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="Registrasi Anda ditolak. Silakan hubungi admin.")

    token = secrets.token_urlsafe(32)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/admin/users", tags=["Admin Users"])
def get_all_users(db: Session = Depends(get_db)):
    ensure_seed_users(db)
    users = db.query(UserAccount).order_by(UserAccount.created_at.desc()).all()
    return [serialize_user(u) for u in users]


@router.get("/admin/users/pending", tags=["Admin Users"])
def get_pending_users(db: Session = Depends(get_db)):
    ensure_seed_users(db)
    users = db.query(UserAccount).filter(UserAccount.status == "pending").all()
    return [serialize_user(u) for u in users]


@router.patch("/admin/users/{user_id}/approval", tags=["Admin Users"])
def approve_or_reject_user(user_id: str, payload: ApprovalPayload, db: Session = Depends(get_db)):
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if payload.action == "approve":
        target.status = "active"
        target.approved_at = datetime.now(timezone.utc)
    else:
        target.status = "rejected"

    db.commit()
    db.refresh(target)
    return serialize_user(target)


@router.patch("/admin/users/{user_id}/role", tags=["Admin Users"])
def update_user_role(user_id: str, payload: RolePayload, db: Session = Depends(get_db)):
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    target.role = payload.new_role
    db.commit()
    db.refresh(target)
    return serialize_user(target)


@router.patch("/admin/users/{user_id}", tags=["Admin Users"])
def update_user(user_id: str, payload: UserUpdatePayload, db: Session = Depends(get_db)):
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if payload.full_name is not None:
        target.full_name = payload.full_name.strip()
    if payload.email is not None:
        new_email = payload.email.strip().lower()
        dup = db.query(UserAccount).filter(UserAccount.email == new_email, UserAccount.id != target.id).first()
        if dup:
            raise HTTPException(status_code=409, detail="Email sudah digunakan user lain.")
        target.email = new_email

    db.commit()
    db.refresh(target)
    return serialize_user(target)


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin Users"])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    target = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    db.delete(target)
    db.commit()
