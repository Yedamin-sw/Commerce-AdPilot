//콘텐츠 생성화면
"use client";
import {useState} from "react";
import {supabase} from "@/lib/supabase";

export default function Register(){
    const [name, setName]=useState(""); //상품명
    const [category, setCategory]=useState("");//카테고리
    const [description, setDescription]=useState([], "");//주요 특징
    const [target, setTarget]=useState("");
    const [cost, setCost]=useState("");
    const [brandtone, setBrandtone]=useState("");
    const [ban, setBan]=useState("");

    const handleCreate = async (e)=>{
        try{
            const res = await fetch("/api/generate",{
                method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({name:name, category:category, description:description, target:target, cost:cost, brandtone: brandtone, ban:ban})
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

    
    return(
        <>
        <div>
            <form onSubmit={handleCreate}>
                <input type="text" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)}/>
                <input type="text" placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)}/>
                <input type="text" placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)}/>
                <input type="text" placeholder="Target" value={target} onChange={(e)=>setTarget(e.target.value)}/>
                <input type="text" placeholder="Cost" value={cost} onChange={(e)=>setCost(e.target.value)}/>
                <input type="text" placeholder="Brand Tone" value={brandtone} onChange={(e)=>setBrandtone(e.target.value)}/>
                <input type="text" placeholder="Banner Text" value={ban} onChange={(e)=>setBan(e.target.value)}/>
                <button type="submit">Generate Content</button>
            </form>
        </div>
        </>
    )
}