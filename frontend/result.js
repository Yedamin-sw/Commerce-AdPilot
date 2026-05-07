// 생성화면 인라인 편집 화면

"use client";
import {useState} from "react";
import {supabase} from "@/lib/supabase";

export default function Register(){
    //재생성1
    const [short, setShort] = useState("");
    //재생성2
    const [long, setLong]=useState("");

    const handleShort = async (e)=>{
        try{
            const res = await fetch("/api/regenerate",{
                method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({description:short})
            });
            const data = await res.json();
            if(data.success){
                //로딩 중인거 알려주기
                //실패시에 화면에 오류 알려주기
            }
        }
        catch(error){
            console.error(error);
            alert("content generation failed");
        }
    };

    const handleLong = async (e)=>{
        try{
            const res = await fetch("/api/regenerate",{
                method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({description:long})
            });
            const data = await res.json();
            if(data.success){
                //로딩 중인거 알려주기
                //실패시에 화면에 오류 알려주기
            }
        }
        catch(error){
            console.error(error);
            alert("content generation failed");
        }
    };
    const handleFull = async (e)=>{
        try{
            handleShort(e);
            handleLong(e);
        }
        catch(error){
            console.error(error);
            alert("content generation failed");
        }
    };
    
    //save to supabase
    const handleSave = async (e)=>{
        try{
            const res=await fetch("/api/history",{
                method:"POST",headers:{"Content-Type":"application/json"},
            })
        }
        catch(error){
            console.error(error);
            alert("saving failed");
        }
    };

    return(
        <>
        <div>
            <form onSubmit={handleFull}>
                <form onSubmit={handleShort}></form>
                <form onSubmit={handleLong}></form>
            </form>
        </div>
        </>
    )
}