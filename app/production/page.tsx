"use client";

import {useEffect,useMemo,useState} from "react";

type Product={
  rank:number;
  name:string;
  keyword:string;
  title:string;
  priceUsd:number;
  tags:string[];
  artwork:{status:string;prompt:string;negativePrompt:string;printSpecs:string};
  garment:{blueprint:string;sizes:string[];colors:string[]};
  publication:{status:string};
};

export default function ProductionPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [selectedRank,setSelectedRank]=useState(1);
  const [status,setStatus]=useState("Preparing the six-product batch…");
  const [files,setFiles]=useState<Record<number,File|null>>({});
  const [previewUrls,setPreviewUrls]=useState<Record<number,string>>({});
  const [draftStatus,setDraftStatus]=useState<Record<number,string>>({});

  useEffect(()=>{
    fetch("/api/production",{cache:"no-store"})
      .then(r=>r.json())
      .then(d=>{
        if(!d.ok) throw new Error(d.error||"Batch failed");
        setProducts(d.products||[]);
        setStatus(String(d.count||0)+" products ready");
      })
      .catch(e=>setStatus(e.message));
  },[]);

  const selected=useMemo(
    ()=>products.find(p=>p.rank===selectedRank),
    [products,selectedRank]
  );

  function chooseFile(rank:number,file:File|null){
    setFiles(s=>({...s,[rank]:file}));
    if(file){
      const url=URL.createObjectURL(file);
      setPreviewUrls(s=>({...s,[rank]:url}));
    }else{
      setPreviewUrls(s=>({...s,[rank]:""}));
    }
  }

  async function createDraft(product:Product){
    const file=files[product.rank];

    if(!file){
      setDraftStatus(s=>({...s,[product.rank]:"Choose a PNG or JPG artwork first."}));
      return;
    }

    if(file.type!=="image/png" && file.type!=="image/jpeg"){
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
        [product.rank]:
          "✓ Draft created · Product ID: "+data.productId+
          " · "+data.selectedVariants+" variants · NOT published"
      }));
    }catch(error){
      setDraftStatus(s=>({
        ...s,
        [product.rank]:error instanceof Error?error.message:"Draft creation failed."
      }));
    }
  }

  return (
    <main style={{
      minHeight:"100vh",
      background:"#f5f7fb",
      color:"#182033",
      fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    }}>
      <header style={{
        background:"#172033",color:"#fff",padding:"18px 28px",
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:20
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:38,height:38,borderRadius:11,background:"#4f46e5",
            display:"grid",placeItems:"center",fontSize:20
          }}>✦</div>
          <div>
            <div style={{fontWeight:800,fontSize:18}}>Etsy Opportunity Engine</div>
            <div style={{fontSize:12,opacity:.65}}>Production</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#8ef0bd"}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:"#36d58a"}}/>
          Printify Draft Mode
        </div>
      </header>

      <div style={{maxWidth:1250,margin:"0 auto",padding:"28px 20px 60px"}}>
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"end",
          gap:20,marginBottom:22
        }}>
          <div>
            <div style={{fontSize:12,letterSpacing:2,color:"#6b7280",fontWeight:700}}>PRODUCTION QUEUE</div>
            <h1 style={{fontSize:34,margin:"7px 0"}}>Halloween 2026</h1>
            <p style={{margin:0,color:"#667085"}}>Research → artwork → Printify draft → review → publish</p>
          </div>
          <a href="/" style={{
            padding:"10px 14px",border:"1px solid #d6dae3",borderRadius:10,
            textDecoration:"none",color:"#182033",background:"#fff"
          }}>Dashboard</a>
        </div>

        <div style={{
          display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",
          gap:10,marginBottom:22
        }}>
          {products.map(p=>{
            const active=p.rank===selectedRank;
            const ready=Boolean(files[p.rank]);
            return (
              <button key={p.rank} type="button" onClick={()=>setSelectedRank(p.rank)} style={{
                textAlign:"left",padding:12,borderRadius:13,
                border:active?"2px solid #4f46e5":"1px solid #dfe3eb",
                background:"#fff",cursor:"pointer"
              }}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <b>#{p.rank}</b>
                  <span style={{
                    fontSize:10,padding:"3px 7px",borderRadius:20,
                    background:ready?"#dcfce7":"#eef1f6",
                    color:ready?"#166534":"#667085"
                  }}>{ready?"READY":"NOT STARTED"}</span>
                </div>
                <div style={{marginTop:8,fontWeight:700,fontSize:14}}>{p.name}</div>
                <div style={{fontSize:11,color:"#7a8495",marginTop:3}}>{p.keyword}</div>
              </button>
            );
          })}
        </div>

        {selected && (
          <section style={{
            display:"grid",
            gridTemplateColumns:"minmax(280px,1fr) minmax(300px,1.2fr) minmax(260px,.85fr)",
            gap:18
          }}>
            <div style={{
              background:"#172033",color:"#fff",borderRadius:18,padding:20
            }}>
              <div style={{fontSize:12,color:"#aeb8cb",fontWeight:700}}>1. ARTWORK</div>
              <h2 style={{margin:"7px 0 4px",fontSize:22}}>{selected.name}</h2>
              <p style={{fontSize:12,color:"#aeb8cb",marginTop:0}}>PNG veya JPG yükle</p>

              <label style={{
                display:"block",border:"1px dashed #66728a",borderRadius:14,
                padding:22,textAlign:"center",cursor:"pointer",marginTop:16
              }}>
                <div style={{fontSize:30}}>↥</div>
                <div style={{fontWeight:700}}>Görseli buraya yükle</div>
                <div style={{fontSize:11,color:"#aeb8cb",marginTop:5}}>PNG / JPG</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={e=>chooseFile(selected.rank,e.target.files?.[0]||null)}
                  style={{display:"none"}}
                />
              </label>

              {previewUrls[selected.rank] && (
                <div style={{marginTop:16,borderRadius:14,overflow:"hidden",background:"#fff",padding:10}}>
                  <img
                    src={previewUrls[selected.rank]}
                    alt="Uploaded artwork preview"
                    style={{display:"block",width:"100%",aspectRatio:"1",objectFit:"contain"}}
                  />
                  <div style={{color:"#667085",fontSize:11,marginTop:7,wordBreak:"break-word"}}>
                    {files[selected.rank]?.name}
                  </div>
                </div>
              )}

              <div style={{
                marginTop:16,padding:12,borderRadius:10,
                background:"rgba(255,255,255,.07)",fontSize:11,color:"#c5ccda"
              }}>
                <b>Print brief:</b><br/>{selected.artwork.printSpecs}
              </div>
            </div>

            <div style={{
              background:"#fff",border:"1px solid #e1e5ec",borderRadius:18,padding:20
            }}>
              <div style={{fontSize:12,color:"#4f46e5",fontWeight:800}}>2. ÜRÜN BİLGİLERİ</div>
              <h2 style={{margin:"7px 0 18px",fontSize:22}}>Hazır üretim paketi</h2>

              <label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:6}}>Ürün başlığı</label>
              <div style={{
                border:"1px solid #d9dee8",borderRadius:10,padding:12,
                fontSize:13,background:"#fafbfc"
              }}>{selected.title}</div>

              <label style={{display:"block",fontSize:12,fontWeight:700,margin:"16px 0 6px"}}>Etiketler</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {selected.tags.map(tag=>(
                  <span key={tag} style={{
                    background:"#eef0ff",color:"#3f3a9f",borderRadius:20,
                    padding:"5px 9px",fontSize:11
                  }}>{tag}</span>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:18}}>
                <div style={{border:"1px solid #e1e5ec",borderRadius:12,padding:14}}>
                  <div style={{fontSize:11,color:"#7a8495"}}>Fiyat</div>
                  <div style={{fontSize:24,fontWeight:800,marginTop:3}}>${selected.priceUsd.toFixed(2)}</div>
                </div>
                <div style={{border:"1px solid #e1e5ec",borderRadius:12,padding:14}}>
                  <div style={{fontSize:11,color:"#7a8495"}}>Model</div>
                  <div style={{fontWeight:800,marginTop:5}}>{selected.garment.blueprint}</div>
                </div>
              </div>

              <div style={{marginTop:18,fontSize:12,fontWeight:700}}>Renkler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:8}}>
                {selected.garment.colors.map(c=>(
                  <span key={c} style={{
                    border:"1px solid #d8dde6",borderRadius:9,
                    padding:"7px 10px",fontSize:11,background:"#fff"
                  }}>{c}</span>
                ))}
              </div>

              <div style={{marginTop:16,fontSize:12,fontWeight:700}}>Bedenler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:8}}>
                {selected.garment.sizes.map(s=>(
                  <span key={s} style={{
                    border:"1px solid #d8dde6",borderRadius:9,
                    padding:"7px 10px",fontSize:11,background:"#fff"
                  }}>{s}</span>
                ))}
              </div>
            </div>

            <div style={{
              background:"#fff",border:"1px solid #e1e5ec",borderRadius:18,padding:20
            }}>
              <div style={{fontSize:12,color:"#4f46e5",fontWeight:800}}>3. PRINTIFY</div>
              <h2 style={{margin:"7px 0 18px",fontSize:22}}>Draft ayarları</h2>

              <div style={{border:"1px solid #dfe3eb",borderRadius:14,padding:14}}>
                <div style={{fontSize:12,color:"#7a8495"}}>T-shirt</div>
                <div style={{fontWeight:800,marginTop:5}}>{selected.garment.blueprint}</div>
                <div style={{fontSize:11,color:"#667085",marginTop:3}}>Printify Choice</div>
              </div>

              <div style={{
                marginTop:14,padding:14,borderRadius:14,
                background:"#f4fdf8",border:"1px solid #c8efd9"
              }}>
                <div style={{fontWeight:800,color:"#167447"}}>Yayınlama kapalı</div>
                <div style={{fontSize:11,color:"#47715d",marginTop:5}}>
                  Bu işlem sadece Printify taslağı oluşturur. Etsy'ye yayın yapmaz.
                </div>
              </div>

              <button
                type="button"
                onClick={()=>createDraft(selected)}
                disabled={!files[selected.rank]}
                style={{
                  width:"100%",marginTop:18,padding:"14px 12px",
                  border:0,borderRadius:12,fontWeight:800,fontSize:14,
                  background:files[selected.rank]?"#4f46e5":"#d9dce5",
                  color:files[selected.rank]?"#fff":"#7b8190",
                  cursor:files[selected.rank]?"pointer":"not-allowed"
                }}
              >
                Create Printify Draft — Never Publish
              </button>

              <div style={{marginTop:12,fontSize:12,lineHeight:1.5,color:"#596274"}}>
                {draftStatus[selected.rank] || status}
              </div>
            </div>
          </section>
        )}

        <div style={{
          marginTop:18,padding:14,borderRadius:12,
          background:"#fff",border:"1px solid #e1e5ec",
          fontSize:12,color:"#667085"
        }}>
          <b>Güvenlik:</b> Ürün oluşturma yalnızca taslak modunda. Otomatik yayınlama şu anda kapalı.
        </div>
      </div>
    </main>
  );
}
