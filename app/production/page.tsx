"use client";

import {useEffect,useState} from "react";

type Product={
  rank:number; name:string; keyword:string; title:string; priceUsd:number;
  tags:string[]; artwork:{status:string;prompt:string;negativePrompt:string;printSpecs:string};
  garment:{blueprint:string;sizes:string[];colors:string[]}; publication:{status:string};
};

export default function ProductionPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [status,setStatus]=useState("Preparing the six-product batch…");

  useEffect(()=>{
    fetch("/api/production",{cache:"no-store"})
      .then(r=>r.json())
      .then(d=>{
        if(!d.ok) throw new Error(d.error||"Batch failed");
        setProducts(d.products||[]);
        setStatus(`${d.count||0} production drafts prepared · artwork generation is the next gate.`);
      })
      .catch(e=>setStatus(e.message));
  },[]);

  return <main style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px",fontFamily:"system-ui"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",marginBottom:28}}>
      <div>
        <div style={{fontSize:12,letterSpacing:2,opacity:.65}}>PRODUCTION BATCH</div>
        <h1 style={{fontSize:36,margin:"8px 0"}}>Halloween 2026 · 6 Product Queue</h1>
        <p style={{opacity:.72}}>Research → original brief → artwork → Printify draft → approval → publish.</p>
      </div>
      <a href="/" style={{padding:"10px 14px",border:"1px solid #ccc",borderRadius:10,textDecoration:"none",color:"inherit"}}>Dashboard</a>
    </div>
    <div style={{padding:16,border:"1px solid #ddd",borderRadius:14,marginBottom:24}}>
      <b>{status}</b>
      <div style={{marginTop:8,opacity:.7}}>Publishing remains locked. No product is sent to Printify from this screen.</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:16}}>
      {products.map(p=><article key={p.rank} style={{border:"1px solid #ddd",borderRadius:16,padding:18}}>
        <div style={{fontSize:12,opacity:.55}}>#{p.rank} · {p.keyword}</div>
        <h2 style={{fontSize:21,margin:"7px 0"}}>{p.name}</h2>
        <div style={{fontSize:14,opacity:.78,lineHeight:1.5}}>{p.title}</div>
        <div style={{marginTop:14,fontSize:24,fontWeight:700}}>${p.priceUsd.toFixed(2)}</div>
        <div style={{marginTop:12,fontSize:12}}><b>Garment:</b> {p.garment.blueprint} · {p.garment.sizes.join(", ")}</div>
        <div style={{marginTop:8,fontSize:12}}><b>Colors:</b> {p.garment.colors.join(", ")}</div>
        <div style={{marginTop:14,padding:12,borderRadius:10,background:"#f6f6f6"}}>
          <b>Artwork</b>
          <div style={{marginTop:5,fontSize:12}}>Status: {p.artwork.status}</div>
          <details style={{marginTop:8}}>
            <summary>Generation brief</summary>
            <p style={{fontSize:12,lineHeight:1.5}}><b>Prompt:</b> {p.artwork.prompt}</p>
            <p style={{fontSize:12,lineHeight:1.5}}><b>Negative:</b> {p.artwork.negativePrompt}</p>
            <p style={{fontSize:12,lineHeight:1.5}}><b>Print:</b> {p.artwork.printSpecs}</p>
          </details>
        </div>
        <div style={{marginTop:14,fontSize:12}}><b>Tags:</b> {p.tags.join(" · ")}</div>
        <div style={{marginTop:14,padding:10,borderRadius:9,border:"1px solid #e2e2e2",fontSize:12}}>Publication: {p.publication.status.toUpperCase()}</div>
      </article>)}
    </div>
  </main>;
}