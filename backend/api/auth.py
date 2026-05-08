
# 사용자 계정 및 인증

#회원가입, 탈퇴
from fastapi import APIRouter, HTTPException, Depends
from backend.database import supabase_admin as supabase
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
router = APIRouter()

class User(BaseModel):
    email: str
    password:str

# 회원가입
@router.post("/signup")
async def signup(user: User):
    response = supabase.auth.sign_up(email=user.email, password=user.password)
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    return {"message": "User signed up successfully"}    

# 로그인
@router.post("/login")
async def login(user: User):
    response = supabase.auth.sign_in(email=user.email, password=user.password)
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    return {"message": "User logged in successfully", "token": response["data"]["access_token"]}

# 로그아웃
@router.post("/logout")
async def logout(token: str = Depends()):
    supabase.auth.api.sign_out(token)
    return {"message": "User logged out successfully"}

# 탈퇴
@router.post("/deleteUser")
async def delete_account(user: User):
    response = supabase.auth.sign_in(email=user.email, password=user.password)
    if response.get("error"):
        raise HTTPException(status_code=400, detail=response["error"]["message"])
    
    supabase.auth.api.delete_user(response["data"]["access_token"])
    return {"message": "User account deleted successfully"}
