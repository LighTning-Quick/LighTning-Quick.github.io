// Mount existing HTML applications under Hobbies without generating translation pages.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
function mount(output,baseurl=''){
const out=path.resolve(root,output);if(!['_site','preview'].some(d=>out===path.join(root,d)))throw Error('Output must be _site or preview');
const base=baseurl.replace(/\/$/,'');if(base&&!/^\/[\w/-]*$/.test(base))throw Error('Invalid base URL');
for(const [source,destination] of [['site','hobbies/iching'],['卦爻分析/taichi-S','hobbies/taiji']]){const src=path.join(root,source),dest=path.join(out,destination);fs.mkdirSync(dest,{recursive:true});fs.cpSync(src,dest,{recursive:true});
function visit(dir){for(const file of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,file.name);if(file.isDirectory()){visit(p);continue}if(!p.endsWith('.html'))continue;let html=fs.readFileSync(p,'utf8');if(source==='site')html=html.replace(/(href|src)="\/(?!\/)([^"]*)"/g,(_,attribute,value)=>attribute+'="'+base+'/hobbies/iching/'+value+'"').replace('new URL("/",location)','new URL("'+base+'/hobbies/iching/",location)');
html=html.replaceAll('https://lightning-quick.github.io/site/',base+'/hobbies/iching/');
if(source==='site')html=html.replace(/(<nav class="md-header__inner md-grid"[^>]*>)/,`$1\n<a class="md-header__button" href="${base}/zh/activities/" title="返回兴趣栏目" style="white-space:nowrap">兴趣</a>`);
else html=html.replace('<div class="brand">',`<div class="brand"><a href="${base}/zh/activities/" style="color:inherit;text-decoration:underline;white-space:nowrap" title="返回兴趣栏目">兴趣</a>`);
fs.writeFileSync(p,html)}}visit(dest)}
console.log('Mounted local I Ching HTML at /hobbies/iching/ and Taiji S at /hobbies/taiji/.');
}
module.exports={mount};if(require.main===module)mount(process.argv[2]||'_site',process.env.SITE_BASEURL||'');
