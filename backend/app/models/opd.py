import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class OPD(Base):
    __tablename__ = "opd"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)

    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)

    users = relationship("User", back_populates="opd")

    def __repr__(self) -> str:
        return f"<OPD {self.name}>"