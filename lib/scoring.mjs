export function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}
export function priceOf(l){return l?.price?.amount!=null&&l?.price?.divisor?l.price.amount/l.price.divisor:null}
export function ageDaysOf(l){return l?.creation_timestamp?Math.max(1,(Date.now()-l.creation_timestamp*1000)/86400000):null}

export function enrichListing(l,keyword,keywordCount=0){
  const age=ageDaysOf(l);
  const price=priceOf(l);
  const favorers=Math.max(0,l?.num_favorers??0);
  const velocity=age?favorers/Math.max(1,age/30):0;
  const tokens=keyword.toLowerCase().split(/\s+/).filter(Boolean);
  const corpus=[l?.title??"",...(l?.tags??[])].join(" ").toLowerCase();
  const matched=tokens.filter(t=>corpus.includes(t)).length;
  const relevance=tokens.length?matched/tokens.length:0;
  const recency=age==null?50:age<=30?100:age<=90?85:age<=180?70:age<=365?55:40;
  const traction=clamp(Math.log10(velocity+1)*28);
  const competition=keywordCount?clamp(100-Math.log10(keywordCount+1)*18):50;
  const priceability=price==null?50:price>=20&&price<=35?100:price>=18&&price<=40?80:55;
  const score=Math.round(traction*.30+relevance*100*.25+recency*.15+competition*.15+priceability*.10+5);
  const confidence=(l?.num_favorers!=null&&l?.creation_timestamp!=null&&tokens.length>0)?"High":(l?.creation_timestamp!=null?"Medium":"Low");
  return {...l,sourceKeyword:keyword,priceUsd:price,ageDays:age==null?null:Math.round(age),favorersPer30Days:Math.round(velocity*10)/10,relevanceScore:Math.round(relevance*100),competitionScore:Math.round(competition),recencyScore:Math.round(recency),priceabilityScore:Math.round(priceability),signalScore:clamp(score),signalLabel:score>=75?"High":score>=55?"Medium":"Low",confidence}
}

export function summarizeKeyword(keyword,keywordCount,results){
  const prices=results.map(x=>x.priceUsd).filter(x=>typeof x==="number").sort((a,b)=>a-b);
  const median=prices.length?prices[Math.floor(prices.length/2)]:null;
  const avg=prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:null;
  const avgScore=results.length?results.reduce((s,x)=>s+(x.signalScore??0),0)/results.length:0;
  const high=results.filter(x=>x.signalLabel==="High").length;
  return {
    keyword,
    marketCount:keywordCount??0,
    sampled:results.length,
    averagePrice:avg==null?null:Math.round(avg*100)/100,
    medianPrice:median==null?null:Math.round(median*100)/100,
    averageSignal:Math.round(avgScore),
    highSignalCount:high,
    action:avgScore>=75?"TEST NOW":avgScore>=55?"WATCH":"SKIP"
  }
}

export function seasonMeta(){
  const target=new Date("2026-10-31T23:59:59Z").getTime();
  const days=Math.max(0,Math.ceil((target-Date.now())/86400000));
  return {name:"Halloween 2026",daysRemaining:days,urgency:days<=14?"Critical":days<=30?"High":"Normal"}
}

export function aggregateKeywordTokens(results){
  const counts=new Map();
  for(const r of results){
    for(const tag of (r.tags??[])){
      const k=String(tag).trim().toLowerCase();
      if(k) counts.set(k,(counts.get(k)||0)+1);
    }
    for(const token of String(r.title??"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)){
      counts.set(token,(counts.get(token)||0)+1);
    }
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([keyword,count])=>({keyword,count}));
}
