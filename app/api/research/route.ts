import {NextRequest,NextResponse} from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import {aggregateKeywordTokens,enrichListing,summarizeKeyword,seasonMeta} from "../../../lib/scoring.mjs";
import {analyzeOpportunity} from "../../../lib/opportunity-analysis.mjs";
import {generateDesignConcepts} from "../../../lib/design-concepts.mjs";

type Listing={listing_id?:number;title?:string;description?:string;url?:string;price?:{amount?:number;divisor?:number};num_favorers?:number;creation_timestamp?:number;tags?:string[];materials?:string[]};
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const retries=3;

async function savedSnapshot(){
  try{
    const raw=await fs.readFile(path.join(process.cwd(),"data","latest.json"),"utf8");
    return JSON.parse(raw);
  }catch{return null;}
}

function retryWait(response:Response,attempt:number){
  const retryAfter=Number(response.headers.get("retry-after"));
  if(Number.isFinite(retryAfter)&&retryAfter>0)return Math.min(retryAfter*1000,30000);
  return Math.min(1500*Math.pow(2,attempt),30000);
}

async function etsySearch(keyword:string,limit:number){
  const key=process.env.ETSY_API_KEY;
  if(!key)return {keyword,ok:false,count:0,results:[]};

  const u=new URL("https://openapi.etsy.com/v3/application/listings/active");
  u.searchParams.set("keywords",keyword);u.searchParams.set("limit",String(limit));u.searchParams.set("sort_on","score");
  u.searchParams.set("sort_order","desc");u.searchParams.set("buyer_country","US");u.searchParams.set("is_safe","true");

  for(let attempt=0;attempt<=retries;attempt++){
    const res=await fetch(u,{headers:{"x-api-key":key,"accept":"application/json"},cache:"no-store"});
    if(res.ok){
      const data=await res.json() as {count?:number;results?:Listing[]};
      const count=data.count??0;const listings=data.results??[];
      return {keyword,ok:true,count,results:listings.map(x=>enrichListing(x,keyword,count))};
    }
    const retryable=res.status===429||res.status===408||res.status>=500;
    if(!retryable||attempt===retries)return {keyword,ok:false,count:0,results:[],error:"Etsy "+res.status};
    await sleep(retryWait(res,attempt));
  }
  return {keyword,ok:false,count:0,results:[]};
}

async function pinterestTrending(){
  const token=process.env.PINTEREST_ACCESS_TOKEN;
  if(!token)return {enabled:false,items:[]};
  try{
    const res=await fetch("https://api.pinterest.com/v5/trends/keywords/US/top/growing?limit=50",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
    if(!res.ok)return {enabled:false,items:[]};
    const data=await res.json() as {items?:unknown[]};
    return {enabled:true,items:data.items??[]};
  }catch{return {enabled:false,items:[]};}
}

export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get("keywords")||"halloween shirt";
  const limit=Math.max(5,Math.min(30,Number(req.nextUrl.searchParams.get("limit")||18)));
  const keywords=[...new Set(raw.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean))].slice(0,10);

  const etsyResults=[];
  for(let i=0;i<keywords.length;i++){
    etsyResults.push(await etsySearch(keywords[i],limit));
    if(i<keywords.length-1)await sleep(900);
  }

  const liveCount=etsyResults.filter(x=>x.ok).length;
  const snapshot=await savedSnapshot();

  if(liveCount===0&&snapshot){
    return NextResponse.json({
      ...snapshot,
      mode:"snapshot",
      generatedAt:snapshot.generatedAt||new Date().toISOString(),
      sources:{etsy:true,pinterest:false},
      notes:[...(snapshot.notes||[]),"Live server-side Etsy access is unavailable; showing the latest successful scheduled snapshot."]
    });
  }

  const pinterest=await pinterestTrending();
  const flat=etsyResults.flatMap(x=>x.results).sort((a,b)=>b.signalScore-a.signalScore);
  const summaries=etsyResults.map(x=>summarizeKeyword(x.keyword,x.count,x.results)).sort((a,b)=>b.averageSignal-a.averageSignal);
  const opportunityAnalysis=analyzeOpportunity(flat,summaries);

  return NextResponse.json({
    mode:"live",
    generatedAt:new Date().toISOString(),
    season:seasonMeta(),
    keywords,
    keywordSummaries:summaries,
    topSignals:flat.slice(0,60),
    keywordTokenSignals:aggregateKeywordTokens(flat),
    opportunityAnalysis,
    designConcepts:generateDesignConcepts(opportunityAnalysis,flat),
    sources:{etsy:liveCount>0,pinterest:pinterest.enabled},
    pinterest:pinterest.items,
    notes:[
      "Opportunity scores are research-priority proxies, not private sales numbers.",
      "Competitor sales, conversion, revenue, and profit are never inferred as facts.",
      "Etsy marketplace research uses the official API rather than page scraping."
    ]
  });
}
