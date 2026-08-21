from datetime import date
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ResendVerificationIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SellIn(BaseModel):
    quantity: int = Field(default=1, ge=1)
    unit_price: float | None = Field(default=None, ge=0)


class RepairCreate(BaseModel):
    owner_name: str
    phone_number: str
    location: str = ""
    phone_model: str
    estimated_charge: float = Field(default=0, ge=0)
    advance_received: float = Field(default=0, ge=0)
    description: str = ""


class RepairUpdate(BaseModel):
    owner_name: str | None = None
    phone_number: str | None = None
    location: str | None = None
    phone_model: str | None = None
    estimated_charge: float | None = Field(default=None, ge=0)
    advance_received: float | None = Field(default=None, ge=0)
    description: str | None = None
    status: str | None = None


class DailyReportQuery(BaseModel):
    report_date: date
