export function analyzeOpportunity(results, summaries){
  const tokenCounts=new Map();
  for(const r of results??[]){
    const terms=[...(r.tags??[]), ...String(r.title??"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>3)];
    for(const raw of terms){
      const t=String(raw).trim().toLowerCase();
      if(!t || ["halloween","shirt","tee","graphic","vintage","funny","retro"].includes(t)) continue;
      tokenCounts.set(t,(tokenCounts.get(t)||0)+1);
    }
  }
  const topTerms=[...tokenCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([term,count])=>({term,count}));
  const priced=(results??[]).map(x=>x.priceUsd).filter(x=>typeof x==="number").sort((a,b)=>a-b);
  const medianPrice=priced.length?priced[Math.floor(priced.length/2)]:null;
  const highSignals=(results??[]).filter(x=>(x.signalScore??0)>=75);
  const motifs=[
    {name:"Ghost-led",match:/ghost/i},{name:"Pumpkin-led",match:/pumpkin/i},{name:"Skeleton-led",match:/skeleton/i},
    {name:"Cat-led",match:/cat/i},{name:"Botanical",match:/botanical|floral|flower|herb/i},
    {name:"Back-print / collage",match:/back.?print|collage/i},{name:"Badge / collegiate",match:/badge|college|club|varsity/i}
  ].map(m=>({name:m.name,count:(results??[]).filter(r=>m.match.test(String(r.title??"")+" "+(r.tags??[]).join(" "))).length})).sort((a,b)=>b.count-a.count);
  const directions=[];
  if(motifs[0]?.count) directions.push({title:"Primary motif direction",brief:"Develop an original composition around the observed "+motifs[0].name.toLowerCase()+" motif, changing characters, wording, pose, layout and illustration language."});
  if(motifs.some(x=>x.name==="Botanical"&&x.count)) directions.push({title:"Vintage botanical variant",brief:"Combine an original seasonal subject with herbarium-style framing and restrained screen-print texture."});
  if(motifs.some(x=>x.name==="Back-print / collage"&&x.count)) directions.push({title:"Back-print variant",brief:"Build a strong rear graphic with a small front chest mark; keep the composition original rather than recreating any reference."});
  directions.push({title:"Thumbnail test",brief:"Create 3 distinct thumbnails from the same opportunity: centered hero, badge composition, and asymmetrical poster layout."});
  return {sampleSize:(results??[]).length,highSignalCount:highSignals.length,medianPrice:medianPrice==null?null:Math.round(medianPrice*100)/100,topTerms,motifs,directions,interpretation:[
    "These are observed patterns inside the sampled public listings, not private sales or conversion measurements.",
    "A repeated motif is a design research signal, not permission to reproduce another seller's artwork.",
    "Use price as a market reference only; final margin must use the actual Printify product, shipping and Etsy fee inputs."
  ],strongestKeywords:(summaries??[]).slice(0,5).map(x=>x.keyword)};
}
