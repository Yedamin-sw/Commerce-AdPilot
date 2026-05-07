//탈퇴
//AI 사용량 제한, 멤버십 결제
//생성 이력
"use client";
import {useState, useEffect} from "react";
import {supabase} from "@/lib/supabase";

export default function profile(){
    //유저 탈퇴는 api활용

    return(
        <div>
        <p>로그인</p>
        <input type="email" placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        </div>
    );
}


//데이터 분석 기능