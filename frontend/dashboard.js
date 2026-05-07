// 로그인 후 대시보드 페이지

//여기서 profile로 이동가능
"use client";
import {useState, useEffect} from "react";
import {supabase} from "@/lib/supabase";

export default function Login(){
    const [user, setUser] = useState("");
    const getUser=async ()=>{
        const {data, error}=await supabase.auth.getUser();
        if(data.user){getList();}
    }//현재 로그인돼있는가?

    const [list, setList] = useState("");
    const [email, setEmail] = useState("");
    //생성된 jwt토큰을 이용해서 리스트 뽑아오기
    i=0;
    const getList = async ()=>{
            const {data, error} = await supabase.from("users").select("*").range(i, 5*i).order("created_at", {ascending: false}); i+=5;
            //테이블 명 정정 현재 5개씩 페이지네이션
            if(error){
                console.log(error.message);
            }
            else{
                setList(data);
            }
        }
    useEffect(()=>{
        getUser();
    },[]);
    
    //하단에 출력하기
    return(
        <>
        
        </>
    );
}