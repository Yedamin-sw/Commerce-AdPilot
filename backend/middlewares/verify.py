from fastapi import HTTPException, HTTPException
from fastapi import Header
from backend.database import supabase_admin as supabase
from altair import Header

async def verify_token(authorization: str = Header(None)) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user.user:
        raise HTTPException(status_code=401)
    return user.user.id  # user_id 반환