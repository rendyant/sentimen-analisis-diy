import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.user import UserRole, UserStatus

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    opd_id: uuid.UUID
    password: str = Field(min_length=8, max_length=100)
    konfirmasi_password: str = Field(min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password harus mengandung setidaknya satu angka.")
        return value

    @model_validator(mode="after")
    def validate_konfirmasi_passwords(self):
        if self.password != self.konfirmasi_password:
            raise ValueError("Password dan konfirmasi password tidak cocok.")
        return self

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

class UserRoleAction(BaseModel):
    new_role: str = Field(pattern="^(admin|opd)$",description="Role baru: 'admin' atau 'opd'")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if not any(c.isdigit() for c in value):
            raise ValueError("Password harus mengandung setidaknya satu angka.")
        return value
