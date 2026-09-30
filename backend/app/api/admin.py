from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.schemas.user import UserOut, UserApprovalAction, UserRoleAction, UserUpdate
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.core.deps import get_current_user
from app.core.mail import send_email
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/admin", tags=["admin"])

def verify_admin_role(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang dapat mengakses resource ini."
        )
    return current_user

@router.get("/users/pending", response_model=list[UserOut])
def get_pending_users(
    db: Session = Depends(get_db), 
    admin_user: User = Depends(verify_admin_role)
):
    pending_users = db.query(User).filter(User.status == UserStatus.PENDING).all()
    return pending_users

@router.patch("/users/{user_id}/approval", response_model=UserOut)
def approve_or_reject_user(
    user_id: str,
    payload: UserApprovalAction,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin_role)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )

    if payload.action == "approve":
        target_user.status = UserStatus.ACTIVE
        target_user.approved_at = datetime.now(timezone.utc)
        target_user.approved_by = admin_user.id
        email_subject = "Akun Anda Telah Disetujui"
        email_body = f"""
        <p>Halo {target_user.full_name},</p>
        <p>Selamat! Akun Anda pada sistem Suara DIY telah <strong>disetujui</strong> oleh admin.</p>
        <p>Anda sekarang dapat login menggunakan email dan password yang telah didaftarkan.</p>
        """

    elif payload.action == "reject":
        target_user.status = UserStatus.REJECTED
        email_subject = "Status Pendaftaran Akun"
        email_body = f"""
        <p>Halo {target_user.full_name},</p>
        <p>Mohon maaf, pendaftaran akun Anda pada sistem Suara DIY <strong>tidak dapat disetujui</strong> oleh admin.</p>
        <p>Jika Anda merasa ini adalah kesalahan, silakan hubungi admin instansi Anda.</p>
        """

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aksi tidak valid. Gunakan 'approve' atau 'reject'."
        )

    db.commit()
    db.refresh(target_user)

    background_tasks.add_task(
        send_email,
        to=target_user.email,
        subject=email_subject,
        body=email_body
    )

    return target_user

@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: str,
    payload: UserRoleAction,
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin_role)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan."
        )

    if str(target_user.id) == str(admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak dapat mengubah role akun Anda sendiri."
        )

    target_user.role = UserRole(payload.new_role)
    db.commit()
    db.refresh(target_user)

    return target_user

@router.get("/users", response_model=list[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin_role),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin_role),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    data = payload.model_dump(exclude_unset=True)

    if "full_name" in data and data["full_name"] is not None:
        target_user.full_name = data["full_name"].strip()

    if "email" in data and data["email"] is not None:
        new_email = str(data["email"]).strip().lower()
        duplicate = (
            db.query(User)
            .filter(User.email == new_email, User.id != target_user.id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="Email sudah digunakan user lain.")
        target_user.email = new_email

    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin_role),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if str(target_user.id) == str(admin_user.id):
        raise HTTPException(status_code=403, detail="Anda tidak dapat menghapus akun Anda sendiri.")

    if target_user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Akun admin tidak dapat dihapus lewat halaman ini.")

    try:
        db.delete(target_user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="User tidak bisa dihapus karena masih memiliki data terkait.",
        )