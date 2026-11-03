import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx
from bs4 import BeautifulSoup
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db
from models import User, Website
from schemas import AuthResponse, UserCreate, UserLogin, UserResponse, WebsiteCreate, WebsiteResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SiteShelf API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_public_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
        raise HTTPException(status_code=422, detail="Enter a valid HTTP or HTTPS website URL")
    try:
        addresses = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == "https" else 80))
        if not addresses or any(
            not ipaddress.ip_address(item[4][0]).is_global for item in addresses
        ):
            raise HTTPException(status_code=422, detail="This website address is not publicly accessible")
    except (OSError, ValueError):
        raise HTTPException(status_code=422, detail="The website address could not be resolved") from None
    return parts.hostname.lower()


def fetch_metadata(url: str) -> dict[str, str | None]:
    current_url = url
    for redirect_count in range(4):
        validate_public_url(current_url)
        with httpx.Client(
            timeout=httpx.Timeout(8.0, connect=4.0),
            follow_redirects=False,
            headers={"User-Agent": "SiteShelfPreview/1.0 (+website preview)"},
        ) as client:
            response = client.get(current_url)
        if response.is_redirect:
            location = response.headers.get("location")
            if not location or redirect_count == 3:
                break
            current_url = urljoin(current_url, location)
            continue
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        title_tag = soup.find("title")
        title = title_tag.get_text(" ", strip=True) if title_tag else None
        description = None
        image = None
        for tag in soup.find_all("meta"):
            key = (tag.get("property") or tag.get("name") or "").lower()
            content = (tag.get("content") or "").strip()
            if key in {"og:title", "twitter:title"} and content:
                title = content
            elif key in {"description", "og:description", "twitter:description"} and content:
                description = content
            elif key in {"og:image", "og:image:url", "twitter:image"} and content and not image:
                image = urljoin(current_url, content)
        if not description:
            description_tag = soup.find("meta", attrs={"name": "description"})
            if description_tag:
                description = description_tag.get("content")
        return {
            "title": title[:500] if title else None,
            "description": description[:2000] if description else None,
            "image_url": image,
        }
    return {"title": None, "description": None, "image_url": None}


def auth_response(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user.id), user=UserResponse.model_validate(user))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists") from None
    return auth_response(user)


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return auth_response(user)


@app.get("/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@app.post("/websites", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
def add_website(
    payload: WebsiteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    url = str(payload.url)
    if db.scalar(select(Website).where(Website.user_id == user.id, Website.url == url)):
        raise HTTPException(status_code=409, detail="You have already saved this website")
    domain = validate_public_url(url)
    try:
        metadata = fetch_metadata(url)
    except (httpx.HTTPError, OSError, ValueError):
        metadata = {"title": None, "description": None, "image_url": None}
    website = Website(user_id=user.id, url=url, domain=domain, **metadata)
    db.add(website)
    try:
        db.commit()
        db.refresh(website)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already saved this website") from None
    return website


@app.get("/websites", response_model=list[WebsiteResponse])
def list_websites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(
        db.scalars(
            select(Website).where(Website.user_id == user.id).order_by(Website.created_at.desc())
        )
    )


@app.delete("/websites/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(
    website_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    website = db.scalar(
        select(Website).where(Website.id == website_id, Website.user_id == user.id)
    )
    if website is None:
        raise HTTPException(status_code=404, detail="Website not found")
    db.delete(website)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
