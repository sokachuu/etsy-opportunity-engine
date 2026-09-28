"use client";

import {useEffect,useMemo,useState} from "react";

type R={
  listing_id?:number; title?:string; url?:string; num_favorers?:number; priceUsd?:number|null;
  ageDays?:number|null; favorersPer30Days?:number; signalScore?:number; signalLabel?:string;
  sourceKeyword?:string; tags?:string[]; relevanceScore?:number; competitionScore?:number;
  recencyScore?:number; priceabilityScore?:number; confidence?:string;
};
type S={keyword:string;marketCount:number;sampled:number;averagePrice:number|null;medianPrice:number|null;averageSignal:number;highSignalCount:number;action:string};
type A={sampleSize:number;highSignalCount:number;medianPrice:number|null;topTerms:{term:string;count:number}[];motifs:{name:string;count:number}[];directions:{title:string;brief:string}[];interpretation:string[];strongestKeywords:string[]};

const demoSignals:R[]=[
  {listing_id:9101,title:"Vintage Halloween Ghost Pumpkin Tee — retro seasonal collage",sourceKeyword:"vintage halloween shirt",priceUsd:22.4,signalScore:91,signalLabel:"High",tags:["vintage halloween","ghost shirt","pumpkin shirt"],confidence:"Illustrative"},
  {listing_id:9102,title:"Retro Halloween Comfort Colors Tee — ghost, cat, pumpkin stamp-art pattern",sourceKeyword:"halloween shirt",priceUsd:24.99,signalScore:89,signalLabel:"High",tags:["halloween shirt","ghost shirt","retro halloween"],confidence:"Illustrative"},
  {listing_id:9103,title:"Ghost Holding Pumpkin Balloon — vintage graveyard graphic pattern",sourceKeyword:"ghost shirt",priceUsd:15.75,signalScore:86,signalLabel:"High",tags:["ghost shirt","pumpkin shirt","spooky season"],confidence:"Illustrative"},
  {listing_id:9104,title:"Vintage Halloween Skeleton Botanical — floral illustrative pattern",sourceKeyword:"skeleton shirt",priceUsd:25,signalScore:78,signalLabel:"High",tags:["skeleton shirt","halloween shirt","floral"],confidence:"Illustrative"},
  {listing_id:9105,title:"Vintage Halloween Back-Print Collage — haunted house, cats, ravens, pumpkins",sourceKeyword:"halloween sweatshirt",priceUsd:28,signalScore:76,signalLabel:"High",tags:["halloween sweatshirt","vintage halloween","spooky season"],confidence:"Illustrative"},
  {listing_id:9106,title:"Funny Halloween Graphic Tee — compact phrase + single visual joke",sourceKeyword:"funny halloween shirt",priceUsd:22,signalScore:68,signalLabel:"Medium",tags:["funny halloween shirt","halloween tee"],confidence:"Illustrative"}
];

const seeds=[
  "halloween shirt","vintage halloween shirt","funny halloween shirt","ghost shirt",
  "pumpkin shirt","skeleton shirt","spooky shirt","halloween sweatshirt",
  "retro halloween shirt","fall graphic tee"
];

const nextSeasons=[
  ["Halloween","Oct 31","ACTIVE"],
  ["Thanksgiving","Nov 26","NEXT"],
  ["Christmas","Dec 25","NEXT"],
  ["Valentine’s Day","Feb 14","LATER"]
];

function designBrief(r:R){
  const t=((r.title||"")+" "+(r.sourceKeyword||"")).toLowerCase();
  const visual=t.includes("skeleton")
    ? "Original skeleton silhouette + botanical/herbarium composition; restrained vintage poster palette."
    : t.includes("ghost")
    ? "Original ghost characters + strong negative space + 2–4 ink colors; friendly but distinctive."
    : t.includes("pumpkin")
    ? "Original pumpkin cluster + autumn badge system + hand-drawn texture; clear focal hierarchy."
    : t.includes("funny")
    ? "Short original phrase + one visual joke + large readable type; built for thumbnail clarity."
    : "Original retro screen-print language, strong focal illustration, limited palette, wearable beyond one night.";
  const audience=(r.sourceKeyword||"halloween shirt").replaceAll(" shirt","").replaceAll(" sweatshirt","");
  return {
    audience,
    concept:"Build a new concept from the market pattern without tracing or reproducing any listing.",
    visual,
    layout:"Centered hero graphic, sparse secondary details, strong silhouette at Etsy thumbnail size.",
    production:"Transparent/vector master, 300 DPI source, clean edges and print-safe detail density.",
    differentiation:"New wording, characters, poses, arrangement and illustration language."
  };
}

function Field({label,value,setValue}:{label:string;value:number;setValue:(n:number)=>void}){
  return <label className="field"><span>{label}</span><input type="number" step="0.01" value={value} onChange={e=>setValue(Number(e.target.value)||0)}/></label>;
}

export default function Page(){
  const [kw,setKw]=useState(seeds.join(", "));
  const [rows,setRows]=useState<R[]>(demoSignals);
  const [summaries,setSummaries]=useState<S[]>([]);
  const [analysis,setAnalysis]=useState<A|null>(null);
  const [selected,setSelected]=useState<R|null>(null);
  const [status,setStatus]=useState("Illustrative snapshot · connect Etsy for live data");
  const [sources,setSources]=useState({etsy:false,pinterest:false});
  const [price,setPrice]=useState(26);
  const [product,setProduct]=useState(12);
  const [ship,setShip]=useState(4);
  const [tx,setTx]=useState(6.5);
  const [pay,setPay]=useState(6.5);
  const [fixed,setFixed]=useState(0);

  const profit=useMemo(()=>price-product-ship-price*((tx+pay)/100)-fixed-0.2,[price,product,ship,tx,pay,fixed]);
  const margin=price>0?profit/price*100:0;
  const brief=selected?designBrief(selected):null;

  useEffect(()=>{
    fetch("/api/snapshot",{cache:"no-store"})
      .then(r=>r.json())
      .then(data=>{
        if((data.topSignals||[]).length){
          setRows(data.topSignals);
          setSummaries(data.summaries||[]);
          setAnalysis(data.opportunityAnalysis||null);
          setStatus("Latest scheduled research snapshot loaded");
        }
      })
      .catch(()=>{});
  },[]);

  async function research(){
    setStatus("Researching live marketplace signals…");
    setSelected(null);
    try{
      const res=await fetch("/api/research?keywords="+encodeURIComponent(kw)+"&limit=20",{cache:"no-store"});
      if(!res.ok)throw new Error("research failed");
      const data=await res.json();
      setRows(data.topSignals||[]);
      setSummaries(data.keywordSummaries||[]);
      setAnalysis(data.opportunityAnalysis||null);
      setSources(data.sources||{etsy:false,pinterest:false});
      setStatus(data.mode==="live"
        ? "Live Etsy scan complete · "+(data.topSignals?.length||0)+" signals"
        : "No live Etsy key yet · illustrative snapshot retained");
    }catch{
      setStatus("Research failed; check the server configuration.");
    }
  }

  return <main className="shell">
    <header className="hero">
      <div>
        <div className="eyebrow">US MARKET · DECISION ENGINE</div>
        <h1>Etsy Opportunity Engine</h1>
        <p>Find seasonal demand signals, quantify the opportunity, pressure-test the margin, and generate an original product direction.</p>
      </div>
      <div className="season">
        <span>ACTIVE CAMPAIGN</span><strong>Halloween 2026</strong><small>Sep 28 → Oct 31</small>
      </div>
    </header>

    <section className="sourcebar">
      <span className={sources.etsy?"live":"off"}>● Etsy API {sources.etsy?"LIVE":"NOT CONNECTED"}</span>
      <span className={sources.pinterest?"live":"off"}>● Pinterest Trends {sources.pinterest?"LIVE":"OPTIONAL"}</span>
      <span className="rule">Decision gate: high signal + workable margin + originality check</span>
    </section>

    <section className="grid2">
      <div className="panel">
        <div className="head"><div><span className="kicker">01 · DEMAND SCAN</span><h2>Run a focused research pass</h2></div><button onClick={research}>Run research</button></div>
        <label>Keywords</label>
        <textarea value={kw} onChange={e=>setKw(e.target.value)}/>
        <div className="chips">{seeds.slice(0,8).map(x=><button className="chip" key={x} onClick={()=>setKw(v=>v.includes(x)?v:v+", "+x)}>+ {x}</button>)}</div>
        <div className="status">{status}</div>
        <p className="note"><b>Rule:</b> public market signals inform the score; private competitor sales and conversion rates are never presented as facts.</p>
      </div>

      <div className="panel">
        <div className="head"><div><span className="kicker">02 · PROFIT GATE</span><h2>Can the product carry its costs?</h2></div><div className={profit>=0?"profit good":"profit bad"}>${`${profit.toFixed(2)}`}</div></div>
        <div className="fields">
          <Field label="Retail price" value={price} setValue={setPrice}/>
          <Field label="Product cost" value={product} setValue={setProduct}/>
          <Field label="Shipping" value={ship} setValue={setShip}/>
          <Field label="Transaction %" value={tx} setValue={setTx}/>
          <Field label="Payment %" value={pay} setValue={setPay}/>
          <Field label="Other fixed" value={fixed} setValue={setFixed}/>
        </div>
        <div className="gate"><span>Estimated gross margin</span><strong>{margin.toFixed(1)}%</strong><em>{margin>=30?"PASS":"TIGHT"}</em></div>
        <p className="note">Fee inputs are editable assumptions. Verify the final fee schedule before publishing.</p>
      </div>
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">03 · KEYWORD OPPORTUNITIES</span><h2>Where the engine sees the strongest signal</h2></div>{summaries.length?<span className="badge">{summaries.length} keyword groups</span>:null}</div>
      {summaries.length?<div className="summarygrid">{summaries.map(s=><div className="summarycard" key={s.keyword}><div className="summarytop"><b>{s.keyword}</b><span className={"action "+s.action.toLowerCase().replaceAll(" ","-")}>{s.action}</span></div><div className="bigscore">{s.averageSignal}</div><div className="summarymeta"><span>Market results <b>{s.marketCount||"—"}</b></span><span>Median price <b>{s.medianPrice==null?"—":"$"+s.medianPrice.toFixed(2)}</b></span></div></div>)}</div>:<div className="empty compact"><span>Live keyword summaries appear after the first connected Etsy scan.</span></div>}
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">04 · LISTING SIGNALS</span><h2>Inspect the strongest references</h2></div>{rows.length?<span className="badge">{rows.length} rows</span>:null}</div>
      <div className="tablewrap"><table><thead><tr><th>Signal</th><th>Keyword</th><th>Listing</th><th>Price</th><th>Relevance</th><th>Competition</th><th>Freshness</th><th>Score</th></tr></thead><tbody>
        {rows.map((r,i)=><tr key={(r.listing_id||i)+"-"+r.sourceKeyword} onClick={()=>setSelected(r)}>
          <td><span className={"signal "+(r.signalLabel||"Low").toLowerCase()}>{r.signalLabel||"Demo"}</span></td>
          <td>{r.sourceKeyword}</td><td className="title">{r.title||"Untitled"}</td><td>{r.priceUsd==null?"—":"$"+r.priceUsd.toFixed(2)}</td>
          <td>{r.relevanceScore==null?"—":r.relevanceScore}</td><td>{r.competitionScore==null?"—":r.competitionScore}</td><td>{r.recencyScore==null?"—":r.recencyScore}</td>
          <td><b>{r.signalScore??"—"}</b></td>
        </tr>)}
      </tbody></table></div>
    </section>

    <section className="grid2">
      <div className="panel">
        <span className="kicker">05 · ORIGINAL DESIGN BRIEF</span>
        <h2>{selected?"Turn the pattern into original art":"Select a reference signal"}</h2>
        {brief?<div className="brief"><b>{selected?.sourceKeyword} · design direction</b><p>{brief.concept}</p>
          {[["Audience cue",brief.audience],["Visual language",brief.visual],["Layout",brief.layout],["Production",brief.production],["Differentiation",brief.differentiation]].map(x=><div className="row" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></div>)}
          {selected?.url?<a href={selected.url} target="_blank" rel="noreferrer">Open permitted reference ↗</a>:null}
        </div>:<div className="empty compact"><span>Click a row above to generate an original design direction.</span></div>}
      </div>

      <div className="panel">
        <span className="kicker">06 · SEASON QUEUE</span>
        <h2>Research before the peak</h2>
        <div className="queue">{nextSeasons.map(x=><div className="q" key={x[0]}><div><b>{x[0]}</b><small>{x[1]}</small></div><span>{x[2]}</span></div>)}</div>
        <div className="decision"><b>Publication gate</b><span>1. Demand signal is strong enough</span><span>2. Margin survives realistic fees + shipping</span><span>3. Design is independently created</span><span>4. Listing copy matches the actual product</span></div>
      </div>
    </section>

    <footer><span>Etsy Opportunity Engine · MVP</span><span>Official APIs where available · no Etsy page scraping</span></footer>
  </main>;
}