import * as r0 from "@/local-api/action/route";
import * as r1 from "@/local-api/health/route";
import * as r2 from "@/local-api/open/route";
import * as r3 from "@/local-api/state/route";
import { initializeDatabase } from "@/db";
type Handler = (request:Request, context:{params:Promise<{id:string}>}) => Promise<Response>;
const routes: Array<[string, Record<string,unknown>]> = [
  ["/api/action", r0],
  ["/api/health", r1],
  ["/api/open", r2],
  ["/api/state", r3],
];
let queue:Promise<unknown>=Promise.resolve();
// Serialize operations so rapid clicks cannot double-spend or create duplicate records.
export function localFetch(url:string,init:RequestInit={}) : Promise<Response> {
 const execute=async()=>{
   await initializeDatabase();
   const parsed=new URL(url,location.origin);
   for(const [pattern,handlers] of routes){
     const match=parsed.pathname.match(new RegExp("^"+pattern.replace("[id]","([^/]+)")+"$"));
     if(!match)continue;
     const handler=handlers[(init.method??"GET").toUpperCase()] as Handler | undefined;
     if(!handler)return Response.json({error:"Method not allowed"},{status:405});
     return handler(new Request(parsed,init),{params:Promise.resolve({id:match[1]??""})});
   }
   return Response.json({error:"Not found"},{status:404});
 };
 const result=queue.then(execute); queue=result.catch(()=>{}); return result;
}
