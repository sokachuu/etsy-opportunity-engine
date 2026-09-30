"use client";

import {useEffect,useMemo,useState} from "react";

type R={listing_id?:number;title?:string;url?:string;num_favorers?:number|null;priceUsd?:number|null;ageDays?:number|null;signalScore?:number;signalLabel?:string;sourceKeyword?:string;tags?:string[];relevanceScore?:number;competitionScore?:number;recencyScore?:number};
type S={keyword:string;marketCount:number;sampled:number;averagePrice:number|null;medianPrice:number|null;averageSignal:number;highSignalCount?:number;action:string};
type A={sampleSize:number;highSignalCount:number;medianPrice:number|null;topTerms:{term:string;count:number}[];motifs:{name:string;count:number}[];directions:{title:string;brief:string}[];interpretation:string[];strongestKeywords:string[]};
type C={id:string;name:string;keyword:string;evidence:string;visual:string;layout:string;palette:string;typography:string;print:string;differentiation:string;imagePrompt:string;negativePrompt:string;printSpecs:string};
type Snapshot={generatedAt?:string|null;season?:{name?:string;targetDate?:string};summaries?:S[];topSignals?:R[];opportunityAnalysis?:A|null;designConcepts?:{concepts?:C[];count?:number}|null};

const seeds=["halloween shirt","vintage halloween shirt","funny halloween shirt","ghost shirt","pumpkin shirt","skeleton shirt","spooky shirt","halloween sweatshirt","retro halloween shirt","fall graphic tee","halloween dog shirt","halloween cat shirt"];
const nextSeasons=[["Halloween","Oct 31","ACTIVE"],["Thanksgiving","Nov 26","NEXT"],["Christmas","Dec 25","NEXT"],["Valentine’s Day","Feb 14","LATER"]] as const;

function Field({label,value,setValue}:{label:string;value:number;setValue:(n:number)=>void}){return <label className="field"><span>{label}</span><input type="number" step="0.01" value={value} onChange={e=>setValue(Number(e.target.value)||0)}/></label>;}

export default function Page(){
  const [kw,setKw]=useState(seeds.join(", "));
  const [rows,setRows]=useState<R[]>([]);
  const [summaries,setSummaries]=useState<S[]>([]);
  const [analysis,setAnalysis]=useState<A|null>(null);
  const [concepts,setConcepts]=useState<C[]>([]);
  const [selected,setSelected]=useState<R|null>(null);
  const [status,setStatus]=useState("Loading the latest Etsy research snapshot…");
  const [generatedAt,setGeneratedAt]=useState<string|null>(null);
  const [sources,setSources]=useState({etsy:false,pinterest:false});
  const [busy,setBusy]=useState(false);
  const [price,setPrice]=useState(26),[product,setProduct]=useState(12),[ship,setShip]=useState(4);
  const [tx,setTx]=useState(6.5),[reg,setReg]=useState(1.67),[pay,setPay]=useState(6.5);
  const [flatUsd,setFlatUsd]=useState(0.45),[listingFee,setListingFee]=useState(0.20);

  const profit=useMemo(()=>price-product-ship-price*((tx+reg+pay)/100)-flatUsd-listingFee,[price,product,ship,tx,reg,pay,flatUsd,listingFee]);
  const margin=price>0?profit/price*100:0;
  const sampleSize=analysis?.sampleSize??rows.length;
  const highSignal=analysis?.highSignalCount??rows.filter(r=>(r.signalScore||0)>=75).length;
  const medianPrice=analysis?.medianPrice??null;
  const topKeyword=analysis?.strongestKeywords?.[0]||summaries[0]?.keyword||"—";

  useEffect(()=>{
    fetch("/api/snapshot",{cache:"no-store"}).then(r=>r.json()).then((data:Snapshot)=>{
      const signals=data.topSignals||[];
      setRows(signals);setSummaries(data.summaries||[]);setAnalysis(data.opportunityAnalysis||null);
      setConcepts(data.designConcepts?.concepts||[]);setGeneratedAt(data.generatedAt||null);
      const live=signals.length>0;setSources({etsy:live,pinterest:false});
      setStatus(live?"Latest scheduled Etsy snapshot loaded":"No research snapshot is available yet");
      if(signals.length)setSelected(signals[0]);
    }).catch(()=>setStatus("Could not load the research snapshot."));
  },[]);

  async function research(){
    setBusy(true);setStatus("Running a live marketplace research pass…");
    try{
      const res=await fetch("/api/research?keywords="+encodeURIComponent(kw)+"&limit=18",{cache:"no-store"});
      const data=await res.json();if(!res.ok)throw new Error(data?.error||"research failed");
      setRows(data.topSignals||[]);setSummaries(data.keywordSummaries||data.summaries||[]);setAnalysis(data.opportunityAnalysis||null);
      setConcepts(data.designConcepts?.concepts||[]);setSources(data.sources||{etsy:false,pinterest:false});setGeneratedAt(data.generatedAt||null);
      if((data.topSignals||[]).length)setSelected(data.topSignals[0]);
      setStatus(data.mode==="live"?"Live Etsy scan complete · "+(data.topSignals?.length||0)+" signals":"Live key unavailable · saved snapshot retained");
    }catch{setStatus("Live research failed · saved snapshot remains available");}
    finally{setBusy(false);}
  }

  return <main className="shell">
    <header className="hero">
      <div><div className="eyebrow">US MARKET · DECISION ENGINE</div><h1>Etsy Opportunity Engine</h1><p>Seasonal demand signals → opportunity analysis → margin check → original design direction.</p></div>
      <div className="season"><span>ACTIVE CAMPAIGN</span><strong>Halloween 2026</strong><small>Target: Oct 31, 2026</small></div>
    </header>

    <section className="sourcebar">
      <span className={sources.etsy?"live":"off"}>● Etsy API {sources.etsy?"SNAPSHOT READY":"NOT CONNECTED"}</span>
      <span className={sources.pinterest?"live":"off"}>● Pinterest Trends {sources.pinterest?"LIVE":"OPTIONAL"}</span>
      <span className="rule">Public signals only · no private sales or conversion claims</span>
      {generatedAt?<span className="rule">Updated {new Date(generatedAt).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</span>:null}
    </section>

    <section className="metricgrid">
      <div className="metric"><span>Signals sampled</span><strong>{sampleSize}</strong><small>latest snapshot</small></div>
      <div className="metric"><span>High-signal rows</span><strong>{highSignal}</strong><small>score ≥ 75</small></div>
      <div className="metric"><span>Observed median</span><strong>{medianPrice==null?"—":"$"+medianPrice.toFixed(2)}</strong><small>sampled listings</small></div>
      <div className="metric"><span>Leading keyword</span><strong>{topKeyword}</strong><small>{summaries.length} keyword groups</small></div>
    </section>

    <section className="grid2">
      <div className="panel">
        <div className="head"><div><span className="kicker">01 · DEMAND SCAN</span><h2>Run a focused research pass</h2></div><button onClick={research} disabled={busy}>{busy?"Scanning…":"Run research"}</button></div>
        <label>Keywords</label><textarea value={kw} onChange={e=>setKw(e.target.value)}/>
        <div className="chips">{seeds.slice(0,10).map(x=><button className="chip" key={x} onClick={()=>setKw(v=>v.includes(x)?v:v+", "+x)}>+ {x}</button>)}</div>
        <div className="status">{status}</div>
        <p className="note"><b>Data rule:</b> public marketplace signals inform the score. Competitor sales, conversion and revenue are not inferred as facts.</p>
      </div>

      <div className="panel">
        <div className="head"><div><span className="kicker">02 · PROFIT GATE</span><h2>Stress-test the listing economics</h2></div><div className={"profit "+(profit>=0?"good":"bad")}>{"$"}{profit.toFixed(2)}</div></div>
        <div className="fields">
          <Field label="Retail price" value={price} setValue={setPrice}/><Field label="Product cost" value={product} setValue={setProduct}/><Field label="Shipping" value={ship} setValue={setShip}/>
          <Field label="Transaction %" value={tx} setValue={setTx}/><Field label="Regulatory %" value={reg} setValue={setReg}/><Field label="Payment %" value={pay} setValue={setPay}/>
          <Field label="Payment flat USD eq." value={flatUsd} setValue={setFlatUsd}/><Field label="Listing fee" value={listingFee} setValue={setListingFee}/>
        </div>
        <div className="gate"><span>Estimated gross margin</span><strong>{margin.toFixed(1)}%</strong><em className={margin>=30?"pass":"tight"}>{margin>=30?"PASS":"TIGHT"}</em></div>
        <p className="note">Türkiye baseline is modeled as 6.5% transaction + 1.67% regulatory operating + 6.5% payment processing, with the 14 TRY payment flat fee represented by the editable USD-equivalent input. Listing fee is $0.20. Verify the fee schedule before publishing.</p>
      </div>
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">03 · KEYWORD OPPORTUNITIES</span><h2>Compare the observed signal groups</h2></div>{summaries.length?<span className="badge">{summaries.length} groups</span>:null}</div>
      {summaries.length?<div className="summarygrid">{summaries.map(s=><div className="summarycard" key={s.keyword}><div className="summarytop"><b>{s.keyword}</b><span className={"action "+s.action.toLowerCase().replaceAll(" ","-")}>{s.action}</span></div><div className="bigscore">{s.averageSignal}</div><div className="summarymeta"><span>Market results <b>{s.marketCount||"—"}</b></span><span>Median price <b>{s.medianPrice==null?"—":"$"+s.medianPrice.toFixed(2)}</b></span><span>Sampled <b>{s.sampled||0}</b></span></div></div>)}</div>:<div className="empty compact"><span>Run or wait for the scheduled research snapshot.</span></div>}
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">04 · MARKET PATTERN ANALYSIS</span><h2>What repeats across the sample</h2></div></div>
      {analysis?<div className="analysisgrid">
        <div className="analysisbox"><span>Sample size</span><strong>{analysis.sampleSize}</strong></div>
        <div className="analysisbox"><span>High-signal rows</span><strong>{analysis.highSignalCount}</strong></div>
        <div className="analysisbox"><span>Observed median</span><strong>{analysis.medianPrice==null?"—":"$"+analysis.medianPrice.toFixed(2)}</strong></div>
        <div className="analysisbox"><span>Strongest keywords</span><div className="pills">{analysis.strongestKeywords.slice(0,5).map(k=><span key={k}>{k}</span>)}</div></div>
        <div className="analysisbox wide"><span>Recurring terms</span><div className="pills">{analysis.topTerms.slice(0,8).map(x=><span key={x.term}>{x.term} · {x.count}</span>)}</div></div>
        <div className="analysisbox wide"><span>Motifs</span><div className="pills">{analysis.motifs.slice(0,8).map(x=><span key={x.name}>{x.name} · {x.count}</span>)}</div></div>
        <div className="directions"><b>Interpretation</b>{analysis.interpretation.slice(0,4).map(x=><div className="direction" key={x}><strong>Signal</strong><span>{x}</span></div>)}</div>
      </div>:<div className="empty compact"><span>Pattern analysis appears with the research snapshot.</span></div>}
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">05 · LISTING SIGNALS</span><h2>Inspectable source rows</h2></div>{rows.length?<span className="badge">{rows.length} rows · click to inspect</span>:null}</div>
      <div className="tablewrap"><table><thead><tr><th>Signal</th><th>Keyword</th><th>Listing</th><th>Price</th><th>Relevance</th><th>Competition</th><th>Freshness</th><th>Score</th></tr></thead><tbody>
        {rows.map((r,i)=><tr key={(r.listing_id||i)+"-"+r.sourceKeyword} onClick={()=>setSelected(r)}>
          <td><span className={"signal "+((r.signalLabel||((r.signalScore||0)>=75?"High":(r.signalScore||0)>=55?"Medium":"Low")).toLowerCase())}>{r.signalLabel||((r.signalScore||0)>=75?"High":(r.signalScore||0)>=55?"Medium":"Low")}</span></td>
          <td>{r.sourceKeyword||"—"}</td><td className="title">{r.title||"Untitled"}</td><td>{r.priceUsd==null?"—":"$"+r.priceUsd.toFixed(2)}</td>
          <td>{r.relevanceScore==null?"—":r.relevanceScore}</td><td>{r.competitionScore==null?"—":r.competitionScore}</td><td>{r.recencyScore==null?"—":r.recencyScore}</td><td><b>{r.signalScore??"—"}</b></td>
        </tr>)}
      </tbody></table></div>
    </section>

    <section className="panel">
      <div className="head"><div><span className="kicker">06 · ORIGINAL DESIGN CONCEPTS</span><h2>Market-informed, independently created</h2></div>{concepts.length?<span className="badge">{concepts.length} concepts</span>:null}</div>
      {concepts.length?<div className="conceptgrid">{concepts.map(c=><article className="concept" key={c.id}><div className="concepttop"><span>{c.keyword}</span><b>{c.name}</b></div><p className="evidence">{c.evidence}</p><div className="conceptrows"><div><span>Visual</span><strong>{c.visual}</strong></div><div><span>Layout</span><strong>{c.layout}</strong></div><div><span>Palette</span><strong>{c.palette}</strong></div><div><span>Type</span><strong>{c.typography}</strong></div><div><span>Print</span><strong>{c.print}</strong></div><div><span>Differentiate</span><strong>{c.differentiation}</strong></div></div><details className="genpack"><summary>Generation package</summary><div><span>Image prompt</span><p>{c.imagePrompt}</p><span>Negative prompt</span><p>{c.negativePrompt}</p><span>Print specs</span><p>{c.printSpecs}</p></div></details></article>)}</div>:<div className="empty compact"><span>Design concepts appear after research analysis.</span></div>}
    </section>

    <section className="grid2">
      <div className="panel">
        <span className="kicker">07 · ORIGINALITY BRIEF</span><h2>{selected?"Convert one market signal into a new brief":"Select a listing signal"}</h2>
        {selected?<div className="brief"><b>{selected.sourceKeyword||"Seasonal concept"}</b><p>Use the market pattern as a constraint, not as artwork reference. Rebuild the concept from scratch.</p>
          <div className="row"><span>Input</span><strong>{selected.title||"Selected signal"}</strong></div>
          <div className="row"><span>Direction</span><strong>New wording, new character or subject, new pose, new composition and independent illustration language.</strong></div>
          <div className="row"><span>Thumbnail</span><strong>One dominant silhouette, high contrast, readable at small Etsy image size.</strong></div>
          <div className="row"><span>Production</span><strong>Transparent master, 300 DPI source, clean edges and print-safe detail density.</strong></div>
          {selected.url?<a href={selected.url} target="_blank" rel="noreferrer">Open permitted Etsy reference ↗</a>:null}
        </div>:<div className="empty compact"><span>Click any listing row above.</span></div>}
      </div>

      <div className="panel"><span className="kicker">08 · SEASON QUEUE</span><h2>Keep the research ahead of the calendar</h2>
        <div className="queue">{nextSeasons.map(x=><div className="q" key={x[0]}><div><b>{x[0]}</b><small>{x[1]}</small></div><span>{x[2]}</span></div>)}</div>
        <div className="decision"><b>Publication gate</b><span>1. A public-demand signal is visible</span><span>2. Margin survives actual Printify + Etsy costs</span><span>3. Artwork is independently created</span><span>4. Listing copy matches the real product</span></div>
      </div>
    </section>

    <section className="panel">
      <div className="head">
        <div><span className="kicker">09 · PUBLISH AUTOMATION</span><h2>Printify → Etsy automation</h2></div>
        <button onClick={async()=>{const r=await fetch("/api/automation",{cache:"no-store"});const d=await r.json();alert(d.connected?("Printify connected · Shop: "+(d.shopId||"auto-detect")+" · Auto-publish: "+(d.autoPublish?"ON":"OFF")):("Printify not connected: "+(d.message||"missing configuration")));}}>Check connection</button>
      </div>
      <div className="decision">
        <b>Target workflow</b>
        <span>1. Research engine finds an opportunity</span>
        <span>2. Design package supplies an original artwork URL</span>
        <span>3. Printify API uploads artwork and creates the product</span>
        <span>4. Variants and price are applied automatically</span>
        <span>5. Printify publishes to the connected Etsy sales channel when the safety gate is enabled</span>
      </div>
      <p className="note"><b>Current state:</b> the API layer is now in the repository. It is deliberately locked until the Printify token is configured and <code>AUTO_PUBLISH_PRODUCTS=true</code> is explicitly enabled after a test product.</p>
    </section>

    <footer><span>Etsy Opportunity Engine · research MVP</span><span>Official APIs · no Etsy page scraping · US buyer market</span></footer>
  </main>;
}
