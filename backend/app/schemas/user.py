import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole, UserStatus

class RegisterRequest(BaseModel):
    """
    Payload dari form register OPD.
    SENGAJA tidak ada field 'role' atau 'status' di sini walau
    frontend dimodifikasi atau seseorang menembak API langsung, tidak ada cara mengirim nilai role/status lewat endpoint ini.
    Backend yang menentukan.
    """
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    opd_id: uuid.UUID

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password harus mengandung setidaknya satu angka.")
        return value

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OPDOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    opd_id: uuid.UUID | None = None

    class Config:
        from_attributes = True

class UserApprovalAction(BaseModel):
    action: str = Field(pattern="^(approve|reject)$", description="Action yang diambil: 'approve' atau 'reject'")
