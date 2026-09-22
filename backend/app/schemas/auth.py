from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import UserRole
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: UserRole

    # Required only for HR accounts -- a candidate's profile fields are all
    # optional and can be filled in later from their profile page.
    company_name: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_role_specific_fields(self) -> "RegisterRequest":
        if self.role == UserRole.HR and not (self.company_name and self.company_name.strip()):
            raise ValueError("company_name is required when registering as HR")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
