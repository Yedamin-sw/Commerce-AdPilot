"use client";
import {useState, useEffect} from "react";
import {supabase} from "@/lib/supabase";

export default function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e)=>{
        const {data, error}=await supabase.auth.signInWithPassword({
            email, password,
        });
        if(error){
            alert(error.message);
        }
        else{
            alert("로그인 완료");
            console.log(data);
        }
    };

    return(
        <div>
        <p>로그인</p>
        <input type="email" placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        </div>
    );
}