"use client";
import { useEffect, useState, type ReactNode } from "react";
import { initializeDatabase } from "@/db";
export default function LocalApp({children}:{children:ReactNode}) {
 const [ready,setReady]=useState(false),[error,setError]=useState("");
 useEffect(()=>{let active=true; initializeDatabase().then(()=>{if(active)setReady(true)}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not open browser storage.")}); return()=>{active=false}},[]);
 return <><div role="note" style={{padding:"8px 16px",textAlign:"center",fontSize:12,background:"#17202c",color:"#fff",position:"relative",zIndex:60}}>Local simulation: purchases use pretend money. Progress is saved in this browser.</div>{error?<div role="alert" style={{padding:40}}><h1>Unable to open this workspace</h1><p>{error}</p><button onClick={()=>location.reload()}>Try again</button></div>:ready?children:<p role="status" style={{padding:40,textAlign:"center"}}>Opening your local workspace…</p>}</>;
}
