import {NextResponse} from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(){
  try{
    const file=path.join(process.cwd(),"data","latest.json");
    const raw=await fs.readFile(file,"utf8");
    return NextResponse.json(JSON.parse(raw));
  }catch{
    return NextResponse.json({generatedAt:null,summaries:[],topSignals:[],season:{name:"Halloween 2026"}},{status:200});
  }
}