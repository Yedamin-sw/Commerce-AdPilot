from fastapi import Header, HTTPException

from backend.database import supabase_admin as supabase


async def verify_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")

    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.user.id