import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('public/db', {recursive:true});
for (const file of ['pglite.wasm','initdb.wasm','pglite.data']) await copyFile('node_modules/@electric-sql/pglite/dist/'+file, 'public/db/'+file);
const files = (await readdir('migrations')).filter(f=>f.endsWith('.sql')).sort();
await writeFile('public/db/schema.sql', (await Promise.all(files.map(f=>readFile('migrations/'+f,'utf8')))).join('\n'));
await writeFile('public/.nojekyll','');
