// Next.js on Windows can emit nested RSC segment files instead of dotted names.
// Keep identical working navigation for local exports and Linux Pages builds.
import {readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){
 const file=path.join(dir,e.name);
 if(e.isDirectory())await walk(file);
 else if(e.name.endsWith('.txt')){
  const pieces=file.split(path.sep);const at=pieces.findIndex(s=>s.startsWith('__next.'));
  if(at>=0&&at<pieces.length-1)await copyFile(file,path.join(...pieces.slice(0,at),pieces.slice(at).join('.')));
 }
}}
await walk('out');
