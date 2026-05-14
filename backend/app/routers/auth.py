"""Authentication API routes."""

from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserCreate, UserResponse, TokenResponse, UserRole
from datetime import datetime
import uuid

router = APIRouter()

# In-memory store (replace with DB in production)
users_db: dict = {}


@router.post("/signup", response_model=TokenResponse)
async def signup(user: UserCreate):
    """Create a new user account."""
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "organization": user.organization,
        "created_at": datetime.utcnow(),
    }
    users_db[user.email] = {**user_data, "password": user.password}

    return TokenResponse(
        access_token=f"token_{user_id}",
        user=UserResponse(**user_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(email: str, password: str):
    """Authenticate user and return token."""
    user = users_db.get(email)
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        organization=user.get("organization"),
        created_at=user["created_at"],
    )

    return TokenResponse(
        access_token=f"token_{user['id']}",
        user=user_response,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current user profile."""
    # Simplified - in production, extract from JWT
    return UserResponse(
        id="1",
        email="admin@porygon.io",
        name="Admin",
        role=UserRole.FACTORY_OWNER,
        organization="Porygon Industries",
        created_at=datetime.utcnow(),
    )
