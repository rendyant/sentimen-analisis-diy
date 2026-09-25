import enum
import uuid

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class UserRole(str, enum.Enum):
    """
    Role hanya boleh unya 2 nilai untuk sistem ini, yaitu admin dan opd.
    TIDAK ADA endpoint publik yang bisa membuat user dengan role 'admin'.
    Role 'admin' hanya di-set lewat seeding awal atau oleh admin lain yang sudah ada.
    """
    ADMIN = "admin"
    OPD = "opd"

class UserStatus(str, enum.Enum):
    """
    Status akun. User baru SELALU masuk sebagai PENDING, 
    tidak peduli apa yang dikirim di request body register.
    """
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"

class User(Base):
    __tablename__= "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    full_name: Mapped[str] = mapped_column(
        String(150), nullable=False
        )
    email: Mapped[str] = mapped_column(
        String(150), unique=True, nullable=False
        )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.OPD
    )

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"), 
        nullable=False, 
        default=UserStatus.PENDING,
    )

    opd_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opd.id"), nullable=True
    )

    opd = relationship("OPD", back_populates="users")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<User {self.full_name} ({self.email})>"