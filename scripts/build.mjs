import {build} from 'esbuild';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
await mkdir(out,{recursive:true});
// No glob copying: private project records and unrelated files cannot enter the app.
await build({entryPoints:[path.join(root,'src/app.mjs')],outfile:path.join(out,'app.js'),bundle:true,format:'esm',platform:'browser',target:'es2022'});
const html=(await readFile(path.join(root,'index.html'),'utf8')).replace('src="src/app.mjs"','src="app.js"');
await writeFile(path.join(out,'index.html'),html);
await copyFile(path.join(root,'styles.css'),path.join(out,'styles.css'));
await copyFile(path.join(root,'THIRD_PARTY_NOTICES.txt'),path.join(out,'THIRD_PARTY_NOTICES.txt'));
console.log('Web assets built. Native SDK integration is a separate pending step.');
