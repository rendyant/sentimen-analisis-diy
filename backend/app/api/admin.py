from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.schemas.user import UserOut, UserApprovalAction, UserRoleAction
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.core.deps import get_current_user

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
    elif payload.action == "reject":
        target_user.status = UserStatus.REJECTED
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aksi tidak valid. Gunakan 'approve' atau 'reject'."
        )

    db.commit()
    db.refresh(target_user)
    
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