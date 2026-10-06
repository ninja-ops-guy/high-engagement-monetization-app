import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out'), base='/high-engagement-monetization-app';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain'};
createServer(async(req,res)=>{try{
 let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(url===base){res.writeHead(302,{Location:base+'/'});res.end();return;}
 if(!url.startsWith(base+'/')){res.writeHead(404);res.end('Not found');return;}
 let file=path.resolve(root,'.'+url.slice(base.length));
 if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Serving '+base));
