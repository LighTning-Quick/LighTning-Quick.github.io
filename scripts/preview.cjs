// Local preview uses the original Academic Pages layouts, fonts, Sass and Liquid templates.
// GitHub Pages still uses the official Jekyll build workflow.
const fs=require('fs'),path=require('path'),http=require('http');
const YAML=require('yaml'),sass=require('sass'),MarkdownIt=require('markdown-it'),{Liquid}=require('liquidjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'preview');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const markdown=new MarkdownIt({html:true,linkify:false});
const engine=new Liquid({root:path.join(root,'_includes'),extname:'',jekyllInclude:true,strictFilters:true});
engine.registerFilter('markdownify',text=>markdown.render(String(text||'')));
engine.registerFilter('relative_url',u=>String(u||''));
engine.registerFilter('absolute_url',u=>'http://localhost:4173'+String(u||''));
engine.registerFilter('jsonify',o=>JSON.stringify(o));
engine.registerFilter('date_to_xmlschema',d=>new Date(d).toISOString());
const parse=text=>{const m=text.match(/^---\r?\n([\s\S]*?)^---\r?\n/m);return m?{data:YAML.parse(m[1]),body:text.slice(m[0].length)}:{data:{},body:text}};
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
async function build(){
const config=YAML.parse(read('_config.yml'));
const site={...config,url:'',baseurl:'',github:{url:''},time:new Date(),posts:[],publications:[],teaching:[],talks:[],portfolio:[],data:{}};
for(const name of fs.readdirSync(path.join(root,'_data'))){if(name.endsWith('.json'))site.data[name.slice(0,-5)]=JSON.parse(read('_data/'+name));else if(name.endsWith('.yml'))site.data[name.slice(0,-4)]=YAML.parse(read('_data/'+name))}
fs.mkdirSync(out,{recursive:true});
for(const dir of ['assets','images','files'])if(fs.existsSync(path.join(root,dir)))fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
for(const name of fs.readdirSync(path.join(root,'assets/css')).filter(n=>n.endsWith('.scss'))){
const scss=await engine.parseAndRender(parse(read('assets/css/'+name)).body,{site});
const css=sass.compileString(scss,{loadPaths:[path.join(root,'_sass')],style:'compressed',logger:{warn(){},debug(){}}}).css;
fs.writeFileSync(path.join(out,'assets/css',name.replace(/\.scss$/,'.css')),css);
}
const layout=parse(read('_layouts/single.html')),shell=parse(read('_layouts/default.html'));
const pages=walk(path.join(root,'_pages')).filter(p=>p.endsWith('.html'));let rendered=0;
for(const file of pages){const source=parse(fs.readFileSync(file,'utf8'));const page={...source.data,url:source.data.permalink};if(!page.url)continue;
const context={site,page,layout:layout.data};let content=await engine.parseAndRender(source.body,context);
content=await engine.parseAndRender(layout.body,{...context,content});
let html=await engine.parseAndRender(shell.body,{...context,content});
if(/{%\s*(include|assign|if|for)\b/.test(html))throw Error('Unrendered template in '+file);
const destination=path.join(out,page.url.endsWith('/')?page.url.slice(1)+'index.html':page.url.slice(1));
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,html);rendered++;
}
require('./mount-hobbies.cjs').mount('preview');
console.log('Rendered '+rendered+' pages with the original Academic Pages theme; copied legacy web assets and Markdown sources.');
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.gz':'application/gzip'};
async function main(){await build();if(process.argv.includes('--build-only'))return;
http.createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let p=path.resolve(out,'.'+u);if(p!==out&&!p.startsWith(out+path.sep)){res.writeHead(403);return res.end('Forbidden')}if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(out,'404.html')))}res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res)}catch{res.writeHead(400);res.end('Bad request')}}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://localhost:4173'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
