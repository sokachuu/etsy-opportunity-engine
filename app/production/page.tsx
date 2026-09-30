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
  const [files,setFiles]=useState<Record<number,File|null>>({});
  const [draftStatus,setDraftStatus]=useState<Record<number,string>>({});

  useEffect(()=>{
    fetch("/api/production",{cache:"no-store"})
      .then(r=>r.json())
      .then(d=>{
        if(!d.ok) throw new Error(d.error||"Batch failed");
        setProducts(d.products||[]);
        setStatus(String(d.count||0)+" production drafts prepared · upload artwork to test the Printify draft gate.");
      })
      .catch(e=>setStatus(e.message));
  },[]);

  async function createDraft(product:Product){
    const file=files[product.rank];
    if(!file){
      setDraftStatus(s=>({...s,[product.rank]:"Choose a PNG or JPG artwork first."}));
      return;
    }
    if(!/^image\\/(png|jpe?g)$/i.test(file.type)){
      setDraftStatus(s=>({...s,[product.rank]:"Only PNG or JPG artwork is accepted."}));
      return;
    }

    setDraftStatus(s=>({...s,[product.rank]:"Uploading artwork and creating Printify draft…"}));
    try{
      const artworkBase64=await new Promise<string>((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(String(reader.result));
        reader.onerror=()=>reject(new Error("Could not read artwork file."));
        reader.readAsDataURL(file);
      });

      const response=await fetch("/api/production/draft",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          productIndex:product.rank-1,
          artworkBase64,
          fileName:file.name
        })
      });
      const data=await response.json();
      if(!response.ok || !data.ok) throw new Error(data.error||"Draft creation failed.");

      setDraftStatus(s=>({
        ...s,
        [product.rank]:"✓ Printify draft created · Product ID: "+data.productId+" · "+data.selectedVariants+" variants · NOT published"
      }));
    }catch(error){
      setDraftStatus(s=>({...s,[product.rank]:error instanceof Error?error.message:"Draft creation failed."}));
    }
  }

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
      <div style={{marginTop:8,opacity:.7}}>The draft button can create a Printify product only. Publishing is hard-locked.</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:16}}>
      {products.map(p=><article key={p.rank} style={{border:"1px solid #ddd",borderRadius:16,padding:18}}>
        <div style={{fontSize:12,opacity:.55}}>#{p.rank} · {p.keyword}</div>
        <h2 style={{fontSize:21,margin:"7px 0"}}>{p.name}</h2>
        <div style={{fontSize:14,opacity:.78,lineHeight:1.5}}>{p.title}</div>
        <div style={{marginTop:14,fontSize:24,fontWeight:700}}>{"$"}{p.priceUsd.toFixed(2)}</div>
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

        <div style={{marginTop:14,padding:12,borderRadius:10,border:"1px solid #ddd"}}>
          <div style={{fontSize:12,fontWeight:700}}>PRINTIFY DRAFT GATE</div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={e=>setFiles(s=>({...s,[p.rank]:e.target.files?.[0]||null}))}
            style={{marginTop:9,maxWidth:"100%"}}
          />
          <button
            type="button"
            onClick={()=>createDraft(p)}
            disabled={!files[p.rank]}
            style={{marginTop:10,width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #bbb",background:files[p.rank]?"#111":"#eee",color:files[p.rank]?"#fff":"#888",cursor:files[p.rank]?"pointer":"not-allowed"}}
          >
            Create Printify Draft — Never Publish
          </button>
          {draftStatus[p.rank]&&<div style={{marginTop:9,fontSize:12,lineHeight:1.45}}>{draftStatus[p.rank]}</div>}
        </div>

        <div style={{marginTop:12,padding:10,borderRadius:9,border:"1px solid #e2e2e2",fontSize:12}}>Publication: {p.publication.status.toUpperCase()}</div>
      </article>)}
    </div>
  </main>;
}
