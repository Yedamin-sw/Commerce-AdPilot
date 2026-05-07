"use client";
//회원가입, 이메일 인증, 이메일 재전송
import {useState} from "react";
import {supabase} from "@/lib/supabase";

export default function Register(){
    const [email, setEmail]=useState("");
    const [password, setPassword]=useState("");
    const [key, setKey]=useState("");

    const handleRegister = async (e)=>{
        const {data, error}=await supabase.auth.signUp({
            email, password,
        });
        
        if(error){
            alert(error);
        }
        else{
            //회원가입 가능하면 이메일 인증도 추가하기
            alert("회원가입 완료 - 이메일 인증을 완료해주세요.");
        }
    };

    const handleresend = async (e)=>{
        const {data, error}=await supabase.auth.resend({
            type:"signup", email:email
        });
        if(error){
            alert("재전송 실패");
        }
        else{
            alert("이메일이 재전송되었습니다.");
        }

    }
    return(
        <>
        <div>
            <input type="email" placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
            <input type="password" placeholder="password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
            <button onClick={handleRegister}>sign up</button>
            <button onClick={handleresend}>email resend</button>
        </div>
        </>
    )
}