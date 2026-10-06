import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";
export let db: PgliteDatabase<typeof schema>;
let ready: Promise<void> | undefined;
export function initializeDatabase() { return ready ??= initialize(); }
async function initialize() {
 if (typeof window === "undefined") throw new Error("This workspace needs a browser.");
 // Prevent simultaneous PGlite instances from overwriting the same IndexedDB files.
 if (navigator.locks) await new Promise<void>((resolve,reject)=>{
   void navigator.locks.request("high-engagement-monetization-app:database", {ifAvailable:true}, async lock=>{
     if(!lock){reject(new Error("This app is already open in another tab. Close that tab, then try again."));return;}
     resolve(); await new Promise<void>(()=>{});
   }).catch(reject);
 });
 const base=process.env.NEXT_PUBLIC_BASE_PATH ?? "";
 const resource=async(name:string)=>{const res=await fetch(base+"/db/"+name);if(!res.ok)throw new Error("Could not load workspace files. Please reload.");return res;};
 const [pgliteWasmModule,initdbWasmModule,fsBundle]=await Promise.all([
   resource("pglite.wasm").then(r=>r.arrayBuffer()).then(b=>WebAssembly.compile(b)),
   resource("initdb.wasm").then(r=>r.arrayBuffer()).then(b=>WebAssembly.compile(b)),
   resource("pglite.data").then(r=>r.blob())
 ]);
 const client=await PGlite.create("idb://high-engagement-monetization-app-v1",{pgliteWasmModule,initdbWasmModule,fsBundle});
 db=drizzle(client,{schema});
 await client.exec('CREATE TABLE IF NOT EXISTS _app_meta (key text primary key)');
 const existing=await client.query("SELECT key FROM _app_meta WHERE key='initialized-v1'");
 if(!existing.rows.length){
   const sql=await (await resource("schema.sql")).text();
   await client.exec("BEGIN");
   try {
   await client.exec(sql);

   await client.query("INSERT INTO _app_meta VALUES ('initialized-v1')");
   await client.exec("COMMIT");
   } catch(error) { await client.exec("ROLLBACK"); throw error; }
 }
}
