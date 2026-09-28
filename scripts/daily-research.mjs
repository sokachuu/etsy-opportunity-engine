import fs from "node:fs/promises";
import path from "node:path";

const API_KEY=process.env.ETSY_API_KEY;
if(!API_KEY) throw new Error("ETSY_API_KEY secret is required.");

const keywords=[
  "halloween shirt","vintage halloween shirt","funny halloween shirt","ghost shirt",
  "pumpkin shirt","skeleton shirt","spooky shirt","halloween sweatshirt",
  "retro halloween shirt","fall graphic tee","halloween dog shirt","halloween cat shirt"
];

const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const priceOf=l=>l?.price?.amount!=null&&l?.price?.divisor?l.price.amount/l.price.divisor:null;
const ageOf=l=>l?.creation_timestamp?Math.max(1,(Date.now()-l.creation_timestamp*1000)/86400000):null;

function enrich(l,k,count){
  const age=ageOf(l), price=priceOf(l), fav=Math.max(0,l?.num_favorers??0);
  const velocity=age?fav/Math.max(1,age/30):0;
  const tokens=k.split(/\s+/).filter(Boolean);
  const corpus=[l?.title??"",...(l?.tags??[])].join(" ").toLowerCase();
  const relevance=tokens.length?tokens.filter(t=>corpus.includes(t)).length/tokens.length:0;
  const recency=age==null?50:age<=30?100:age<=90?85:age<=180?70:age<=365?55:40;
  const traction=clamp(Math.log10(velocity+1)*28);
  const competition=count?clamp(100-Math.log10(count+1)*18):50;
  const priceability=price==null?50:price>=20&&price<=35?100:price>=18&&price<=40?80:55;
  const score=Math.round(traction*.30+relevance*100*.25+recency*.15+competition*.15+priceability*.10+5);
  return {
    listing_id:l.listing_id,title:l.title,url:l.url,sourceKeyword:k,tags:l.tags??[],
    priceUsd:price,num_favorers:l.num_favorers??null,ageDays:age==null?null:Math.round(age),
    relevanceScore:Math.round(relevance*100),competitionScore:Math.round(competition),
    recencyScore:Math.round(recency),signalScore:clamp(score)
  };
}

async function search(k){
  const u=new URL("https://openapi.etsy.com/v3/application/listings/active");
  u.searchParams.set("keywords",k);u.searchParams.set("limit","40");
  u.searchParams.set("sort_on","score");u.searchParams.set("sort_order","desc");
  u.searchParams.set("buyer_country","US");u.searchParams.set("is_safe","true");
  const r=await fetch(u,{headers:{"x-api-key":API_KEY}});
  if(!r.ok) throw new Error(`Etsy ${r.status} for ${k}`);
  const d=await r.json();
  return {keyword:k,count:d.count??0,results:(d.results??[]).map(x=>enrich(x,k,d.count??0))};
}

const results=await Promise.all(keywords.map(search));
const top=results.flatMap(x=>x.results).sort((a,b)=>b.signalScore-a.signalScore).slice(0,60);
const summaries=results.map(x=>{
  const p=x.results.map(r=>r.priceUsd).filter(v=>typeof v==="number").sort((a,b)=>a-b);
  const avg=p.length?p.reduce((a,b)=>a+b,0)/p.length:null;
  const med=p.length?p[Math.floor(p.length/2)]:null;
  const avgScore=x.results.length?x.results.reduce((s,r)=>s+r.signalScore,0)/x.results.length:0;
  return {keyword:x.keyword,marketCount:x.count,sampled:x.results.length,averagePrice:avg?Math.round(avg*100)/100:null,medianPrice:med?Math.round(med*100)/100:null,averageSignal:Math.round(avgScore),action:avgScore>=75?"TEST NOW":avgScore>=55?"WATCH":"SKIP"};
}).sort((a,b)=>b.averageSignal-a.averageSignal);

const report={
  generatedAt:new Date().toISOString(),
  season:{name:"Halloween 2026",targetDate:"2026-10-31"},
  keywords,
  summaries,
  topSignals:top,
  notes:[
    "Public market-signal research only; no private competitor sales or conversion data is inferred.",
    "Official Etsy API only; no Etsy page scraping.",
    "Use the output to create original designs rather than copying listings."
  ]
};

const root=process.cwd();
await fs.mkdir(path.join(root,"data","history"),{recursive:true});
await fs.writeFile(path.join(root,"data","latest.json"),JSON.stringify(report,null,2)+"\n");
const date=new Date().toISOString().slice(0,10);
await fs.writeFile(path.join(root,"data","history",date+".json"),JSON.stringify(report,null,2)+"\n");
console.log(`Saved ${top.length} signals for ${date}`);
