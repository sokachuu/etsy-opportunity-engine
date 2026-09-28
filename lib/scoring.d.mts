export function clamp(n:number,min?:number,max?:number):number;
export function priceOf(l:any):number|null;
export function ageDaysOf(l:any):number|null;
export function enrichListing(l:any,keyword:string,keywordCount?:number):any;
export function summarizeKeyword(keyword:string,keywordCount:number,results:any[]):any;
export function seasonMeta():{name:string;daysRemaining:number;urgency:string};
export function aggregateKeywordTokens(results:any[]):{keyword:string;count:number}[];
