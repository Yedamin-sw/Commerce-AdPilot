# 사용자 계정 및 인증 (supabase-py v2 기준)

from fastapi import APIRouter, HTTPException, Header
from backend.database import supabase_admin as supabase
from pydantic import BaseModel

router = APIRouter()

class User(BaseModel):
    email: str
    password: str


# 회원가입
@router.post("/signup")
async def signup(user: User):
    try:
        response = supabase.auth.sign_up({"email": user.email, "password": user.password})
        if response.user is None:
            raise HTTPException(status_code=400, detail="회원가입 실패")
        return {"message": "User signed up successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 로그인
@router.post("/login")
async def login(user: User):
    try:
        response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        if response.session is None:
            raise HTTPException(status_code=401, detail="로그인 실패")
        return {
            "message": "User logged in successfully",
            "token": response.session.access_token,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# 로그아웃
@router.post("/logout")
async def logout(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")
    try:
        supabase.auth.sign_out()
        return {"message": "User logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 회원 탈퇴
@router.delete("/delete_account")
async def delete_account(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")
    token = authorization.replace("Bearer ", "")
    try:
        user_response = supabase.auth.get_user(token)
        if user_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = user_response.user.id
        supabase.auth.admin.delete_user(user_id)
        return {"message": "User account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))