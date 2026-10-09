const cors=(origin:string)=>({
  'Access-Control-Allow-Origin':origin||'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'
});
const json=(body:any,status=200,origin='*')=>new Response(JSON.stringify(body),{status,headers:cors(origin)});
const env=(k:string)=>Deno.env.get(k)||'';
const branch=()=>env('GITHUB_BRANCH')||'main';
const safeId=(v:any)=>{const s=String(v||'').trim();if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(s))throw new Error('Invalid id. Use lowercase letters, numbers and hyphens only.');return s};
const filePath=(type:string,id:string)=>({book:`books/${id}.mjs`,post:`posts/${id}.mjs`,article:`articles/${id}.mjs`,publication:`publications/${id}.mjs`,update:`updates/${id}.mjs`}[type]||'');
const manifests:any={
  book:{dir:'books',path:'books-manifest.js',variable:'window.ahmadAliBookDetails',banner:'/* AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.\n   Add/edit files in /books instead.\n   Generated directly by the private admin publisher. */\n'},
  post:{dir:'posts',path:'posts-manifest.js',variable:'window.windowOfTimePosts',banner:'/* AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.\n   Add/edit files in /posts instead.\n   Generated directly by the private admin publisher. */\n'},
  article:{dir:'articles',path:'selected-articles-manifest.js',variable:'window.ahmadAliSelectedArticles',banner:'/* AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.\n   Add/edit files in /articles instead.\n   Generated directly by the private admin publisher. */\n'},
  publication:{dir:'publications',path:'publications-manifest.js',variable:'window.ahmadAliPublications',banner:'/* AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.\n   Add/edit files in /publications instead.\n   Generated directly by the private admin publisher. */\n'},
  update:{dir:'updates',path:'updates-manifest.js',variable:'window.ahmadAliUpdates',banner:'/* AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.\n   Add/edit files in /updates instead.\n   Generated directly by the private admin publisher. */\n'}
};
function utf8b64(s:string){const b=new TextEncoder().encode(s);let x='';for(let i=0;i<b.length;i+=32768)x+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(x)}
function b64utf8(s:string){const x=atob(String(s||'').replace(/\n/g,''));const b=new Uint8Array(x.length);for(let i=0;i<x.length;i++)b[i]=x.charCodeAt(i);return new TextDecoder().decode(b)}
function ghHeaders(){return {'Authorization':`Bearer ${env('GITHUB_TOKEN')}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}}
function repoApi(path:string){return `https://api.github.com/repos/${env('GITHUB_OWNER')}/${env('GITHUB_REPO')}/${path}`}
function contentsUrl(path:string){return repoApi(`contents/${path.split('/').map(encodeURIComponent).join('/')}`)+`?ref=${encodeURIComponent(branch())}`}
async function gh(path:string,opt:any={}){const r=await fetch(repoApi(path),{...opt,headers:{...ghHeaders(),...(opt.headers||{})}});if(!r.ok)throw new Error(`GitHub API failed (${r.status}): ${await r.text()}`);return await r.json()}
async function getFile(path:string){const r=await fetch(contentsUrl(path),{headers:ghHeaders()});if(r.status===404)return null;if(!r.ok)throw new Error(`GitHub read failed (${r.status}): ${await r.text()}`);return await r.json()}
async function readText(path:string){const f=await getFile(path);if(!f)return null;return b64utf8(f.content||'')}
let topicSlugCache:Set<string>|null=null;
let topicSlugCacheAt=0;
const TOPIC_CACHE_MS=5*60*1000;
async function canonicalTopicSlugs(){
  const now=Date.now();
  if(topicSlugCache&&now-topicSlugCacheAt<TOPIC_CACHE_MS)return topicSlugCache;
  const text=await readText('topic-taxonomy.mjs');
  if(text==null)throw new Error('topic-taxonomy.mjs is missing.');
  let s=text.trim();
  const prefix='export default';
  if(!s.startsWith(prefix))throw new Error('Could not parse topic-taxonomy.mjs.');
  s=s.slice(prefix.length).trim();
  if(s.endsWith(';'))s=s.slice(0,-1).trim();
  let taxonomy:any;
  try{taxonomy=JSON.parse(s)}catch{throw new Error('topic-taxonomy.mjs must contain a JSON-compatible export default object.')}
  if(!taxonomy||typeof taxonomy!=='object'||Array.isArray(taxonomy))throw new Error('Invalid topic-taxonomy.mjs.');
  topicSlugCache=new Set(Object.keys(taxonomy));
  topicSlugCacheAt=now;
  return topicSlugCache;
}
function parseManifest(type:string,text:string){const c=manifests[type];if(!c)throw new Error('Unknown content type.');const marker=`${c.variable} =`;
  const i=text.indexOf(marker);if(i<0)throw new Error(`Could not parse ${c.path}.`);let s=text.slice(i+marker.length).trim();if(s.endsWith(';'))s=s.slice(0,-1).trim();const items=JSON.parse(s);if(!Array.isArray(items))throw new Error(`Invalid ${c.path}.`);return items}
function renderManifest(type:string,items:any[]){const c=manifests[type];return `${c.banner}${c.variable} = ${JSON.stringify(items,null,2)};\n`}
async function validate(type:string,item:any){if(!item||!item.id)throw new Error('Content id is required.');
  if(type==='book'){if(!item.bn?.title||!item.en?.title)throw new Error('Bengali and English book titles are required.');}
  if(type==='post'){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))throw new Error('Post date must use YYYY-MM-DD.');if(!item.bn?.title||!item.bn?.body||!item.en?.title||!item.en?.body)throw new Error('Both Bengali and English title/body are required.');const topics=await canonicalTopicSlugs();if(!topics.has(item.topic_slug))throw new Error(`Invalid topic: ${item.topic_slug||'(missing)'}.`);}
  if(type==='article'){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))throw new Error('Article date must use YYYY-MM-DD.');if(!item.bn?.title||!item.en?.title)throw new Error('Both Bengali and English titles are required.');const topics=await canonicalTopicSlugs();if(!topics.has(item.topic_slug))throw new Error(`Invalid topic: ${item.topic_slug||'(missing)'}.`);}
  if(type==='publication'){if(!item.type)throw new Error('Publication type is required.');if(!item.titleEn&&!item.titleBn&&!item.titleAr)throw new Error('At least one publication title is required.');}
  if(type==='update'){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))throw new Error('Update date must use YYYY-MM-DD.');if(!item.bn?.title||!item.en?.title)throw new Error('Both Bengali and English update titles are required.');}
}
function sortItems(type:string,items:any[]){const out=items.slice();if(type==='book'){const c=new Intl.Collator('bn-BD',{sensitivity:'base',numeric:true,ignorePunctuation:true});out.sort((a,b)=>c.compare(String(a?.bn?.title||a?.en?.originalTitle||a?.en?.title||'').trim(),String(b?.bn?.title||b?.en?.originalTitle||b?.en?.title||'').trim()));}
  else if(type==='publication')out.sort((a,b)=>(Number(a.order||9999)-Number(b.order||9999))||String(a.id).localeCompare(String(b.id)));
  else out.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(a.id).localeCompare(String(b.id)));
  return out}

function parseSourceRecord(text:string,path:string){let s=text.trim();const prefix='export default';if(!s.startsWith(prefix))throw new Error(`Could not parse ${path}.`);s=s.slice(prefix.length).trim();if(s.endsWith(';'))s=s.slice(0,-1).trim();const item=JSON.parse(s);if(!item||typeof item!=='object')throw new Error(`Invalid record in ${path}.`);return item}
async function readSourceRecords(type:string){const c=manifests[type];if(!c)throw new Error('Unknown content type.');const r=await fetch(contentsUrl(c.dir),{headers:ghHeaders()});if(!r.ok)throw new Error(`GitHub directory read failed (${r.status}): ${await r.text()}`);const entries=await r.json();if(!Array.isArray(entries))throw new Error(`Invalid ${c.dir} directory response.`);const records:any[]=[];const ids=new Set<string>();for(const e of entries){const name=String(e?.name||'');if(e?.type!=='file'||!name.endsWith('.mjs')||name.startsWith('_'))continue;const path=`${c.dir}/${name}`;const text=await readText(path);if(text==null)continue;const item=parseSourceRecord(text,path);const id=safeId(item.id||name.replace(/\.mjs$/i,''));if(ids.has(id))throw new Error(`Duplicate ${type} id: ${id}`);ids.add(id);item.id=id;await validate(type,item);records.push(item)}return sortItems(type,records)}

async function readManifest(type:string){const c=manifests[type];if(!c)throw new Error('Unknown content type.');const text=await readText(c.path);if(text==null)throw new Error(`${c.path} is missing.`);return parseManifest(type,text)}
async function atomicCommit(changes:any[],message:string){const ref=await gh(`git/ref/heads/${encodeURIComponent(branch())}`);const parent=ref.object.sha;const commit=await gh(`git/commits/${parent}`);const treeEntries:any[]=[];
  for(const ch of changes){if(ch.delete){treeEntries.push({path:ch.path,mode:'100644',type:'blob',sha:null});continue;}const blob=await gh('git/blobs',{method:'POST',body:JSON.stringify({content:ch.content,encoding:ch.encoding||'utf-8'})});treeEntries.push({path:ch.path,mode:'100644',type:'blob',sha:blob.sha});}
  const tree=await gh('git/trees',{method:'POST',body:JSON.stringify({base_tree:commit.tree.sha,tree:treeEntries})});
  const created=await gh('git/commits',{method:'POST',body:JSON.stringify({message,tree:tree.sha,parents:[parent]})});
  const r=await fetch(repoApi(`git/refs/heads/${encodeURIComponent(branch())}`),{method:'PATCH',headers:ghHeaders(),body:JSON.stringify({sha:created.sha,force:false})});
  if(!r.ok)throw new Error(`GitHub publish failed (${r.status}). The repository changed while you were publishing. Please retry. ${await r.text()}`);return created.sha}
async function putAsset(path:string,base64:string,message:string){const old=await getFile(path);const u=contentsUrl(path).replace(/\?ref=.*$/,'');const body:any={message,content:base64,branch:branch()};if(old?.sha)body.sha=old.sha;const r=await fetch(u,{method:'PUT',headers:ghHeaders(),body:JSON.stringify(body)});if(!r.ok)throw new Error(`Asset upload failed (${r.status}): ${await r.text()}`);return await r.json()}
async function authUser(req:Request){const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))throw new Error('Not signed in.');const r=await fetch(`${env('SUPABASE_URL')}/auth/v1/user`,{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:auth}});if(!r.ok)throw new Error('Session expired.');const user=await r.json();const q=await fetch(`${env('SUPABASE_URL')}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,email`,{headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`}});const rows=await q.json();if(!Array.isArray(rows)||!rows.length)throw new Error('This account is not authorized as a website administrator.');return user}
Deno.serve(async(req)=>{const origin=req.headers.get('origin')||'*';if(req.method==='OPTIONS')return new Response('ok',{headers:cors(origin)});try{const user=await authUser(req);const p=await req.json();if(p.action==='whoami')return json({ok:true,email:user.email},200,origin);
if(p.action==='list'){const items=await readManifest(String(p.contentType||''));return json({ok:true,items},200,origin)}
if(p.action==='save'){const type=String(p.contentType||''),id=safeId(p.id),path=filePath(type,id);if(!path||!manifests[type])throw new Error('Unknown content type.');const data={...(p.data||{}),id};await validate(type,data);let items=await readManifest(type);const i=items.findIndex((x:any)=>x?.id===id);if(i>=0)items[i]=data;else items.push(data);items=sortItems(type,items);const source=`export default ${JSON.stringify(data,null,2)};\n`;const manifest=renderManifest(type,items);const sha=await atomicCommit([{path,content:source},{path:manifests[type].path,content:manifest}],`Admin: save ${type} ${id}`);return json({ok:true,path,items,commit:sha},200,origin)}
if(p.action==='delete'){const type=String(p.contentType||''),id=safeId(p.id),path=filePath(type,id);if(!path||!manifests[type])throw new Error('Unknown content type.');let items=await readManifest(type);items=sortItems(type,items.filter((x:any)=>x?.id!==id));const manifest=renderManifest(type,items);const exists=await getFile(path);const changes:any[]=[{path:manifests[type].path,content:manifest}];if(exists)changes.unshift({path,delete:true});const sha=await atomicCommit(changes,`Admin: delete ${type} ${id}`);return json({ok:true,items,commit:sha},200,origin)}
if(p.action==='upload'){const id=safeId(p.id);const ext=String(p.ext||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'bin';const kind=String(p.kind||'file').replace(/[^a-z0-9-]/gi,'').toLowerCase();if(!['cover','pdf','preview','audio'].includes(kind))throw new Error('Invalid asset kind.');const folder=p.contentType==='publication'?'publications':'books';const path=`media/${folder}/${id}/${kind}.${ext}`;await putAsset(path,String(p.base64||''),`Admin: upload ${kind} for ${id}`);return json({ok:true,path},200,origin)}
throw new Error('Unknown action.');}catch(e){return json({ok:false,error:String((e as any)?.message||e)},400,origin)}});
