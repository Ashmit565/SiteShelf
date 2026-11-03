from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class WebsiteCreate(BaseModel):
    url: HttpUrl


class WebsiteResponse(BaseModel):
    id: int
    url: str
    domain: str
    title: str | None
    description: str | None
    image_url: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
