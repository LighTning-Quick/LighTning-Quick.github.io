// Import only the requested, non-ignored public parts of the existing project.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const source=path.resolve(process.argv[2]||'E:/OneDrive/文档/八卦/3.释义/周易译注黎批/易经诠释');
const git=(args,options={})=>cp.execFileSync('git',['-c','safe.directory='+source.replaceAll('\\','/'),'-C',source,...args],{encoding:'utf8',...options});
const allowed=p=>p.startsWith('site/')||p.startsWith('卦爻翻译/')||p.startsWith('卦爻分析/taichi-S/');
const candidates=[...new Set(git(['ls-files','-z','--cached','--others','--exclude-standard','--','site','卦爻翻译','卦爻分析/taichi-S']).split('\0').filter(allowed))];
let ignored=[];try{ignored=git(['check-ignore','--no-index','-z','--stdin'],{input:candidates.join('\0')+'\0'}).split('\0').filter(Boolean)}catch(e){if(e.status!==1)throw e}
const ignoreSet=new Set(ignored);
// taichi-S is explicitly requested; the old ignore file ignores its parent too broadly.
const files=candidates.filter(p=>(!ignoreSet.has(p)||p.startsWith('卦爻分析/taichi-S/'))&&fs.existsSync(path.join(source,p)));
const write=(p,s)=>{const target=path.resolve(root,p);if(!target.startsWith(root+path.sep))throw Error('Invalid destination');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,s)};
const records=[];
for(const p of files){const from=path.resolve(source,p),to=path.resolve(root,p);if(!from.startsWith(source+path.sep)||!to.startsWith(root+path.sep))throw Error('Invalid import path');if(!fs.statSync(from).isFile())continue;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);records.push({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex')})}
const sha=git(['rev-parse','HEAD']).trim();write('.integration/iching-import.json',JSON.stringify({source,source_commit:sha,imported_at:new Date().toISOString(),files:records,skipped:ignored.filter(p=>!p.startsWith('卦爻分析/taichi-S/'))},null,2)+'\n');
console.log(JSON.stringify({imported:records.length,markdown_sources:files.filter(p=>p.endsWith(".md")&&p.startsWith("卦爻翻译/")).length,skipped:ignored.filter(p=>!p.startsWith('卦爻分析/taichi-S/')).length,source_commit:sha}));
