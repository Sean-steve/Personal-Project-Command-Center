/* V2 project discovery. Processes ChatGPT exports locally. No raw transcripts persisted. */
const aliases={
 'sage auto':['sage auto','car hire os','carhire business','car hire business','car rental os'],
 'deetoo':['deetoo','deetoo rush','food delivery platform'],
 'mind os':['mind os','mindos','mental health platform'],
 'pet os':['pet os','pet care platform'],
 'kids4future':['kids4future','kids 4 future','street kids foundation'],
 'seancore':['seancore','sean core'],
 'human kernel os':['human kernel','human operating system','human execution engine','life os'],
 'garage os':['garage os','garage app concept','garage app'],
 'wealth os':['wealth os','wealth management'],
 'jarvis':['jarvis','home intelligence os','home ai assistant'],
 'fayeed':['fayeed'],
 'travel platform':['travel platform','travel platform insights','tours app','travel os'],
 'nflake':['nflake'], 'haven oasis':['haven oasis','urban oasis realty']
};
const topics=/\b(project|application|app|platform|website|system|dashboard|software|saas|sprint|blueprint|startup|business|developer|develop|build|design|engineering|architecture|plugin|agent|automation|marketplace|foundation|product|prototype|portal)\b/i;
const tasks=/\b(add|build|create|design|implement|include|integrate|develop|fix|improve|refine|redesign|support|connect|generate|enable|make|proceed|continue|plan|define|need|should|want|ensure|verify|test|deploy|publish|remove)\b/i;
export const DISCOVERY_KEY='personal-command-center.discovery.v2';
export const CHECKPOINT_KEY='personal-command-center.checkpoints.v2';
const cut=(s,n=200)=>String(s==null?'':s).trim().slice(0,n);
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>slug(s).split(/\s+/).filter(w=>w.length>2&&!['project','application','system','website','development','platform','frontend','backend','software'].includes(w));
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36)};
const redact=s=>String(s||'').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[email]')
 .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{12,}|sk-[A-Za-z0-9_-]{12,}|Bearer\s+\S+)\b/gi,'[credential]')
 .replace(/https?:\/\/[^\s)]+/g,'[link]').replace(/\+?\d[\d\s().-]{8,}\d/g,'[number]')
 .replace(/\s+/g,' ').trim();
export function safeSummary(s,max=160){return cut(redact(s),max);}
const generic=/^(new chat|untitled|hello|hi|question|update|help|image|chat)$/i;
export function extractChats(input){
 const chats=Array.isArray(input)?input:Array.isArray(input?.conversations)?input.conversations:null;
 if(!chats)throw Error('Unsupported export. Select conversations.json from your ChatGPT export.');
 if(chats.length>40000)throw Error('Export too large for one import. Split the file.');
 return chats.map((c,index)=>{
  if(!c||typeof c!=='object')return null;
  const title=cut(c.title||c.name||'',150)||'Untitled';
  let nodes=[];
  if(c.mapping&&typeof c.mapping==='object')nodes=Object.values(c.mapping).map(n=>n?.message).filter(m=>m?.author?.role==='user');
  else if(Array.isArray(c.messages))nodes=c.messages.filter(m=>(m?.author?.role||m?.role)==='user');
  nodes.sort((a,b)=>(a.create_time||0)-(b.create_time||0));
  const messages=[];
  for(const m of nodes.slice(0,70)){
   let body='';const content=m.content;
   if(Array.isArray(content?.parts))body=content.parts.filter(p=>typeof p==='string').join(' ');
   else if(typeof content==='string')body=content;else if(typeof m.text==='string')body=m.text;
   if(body)messages.push(body.slice(0,2500));
  }
  return {sourceId:cut(c.id||c.conversation_id||'chat-'+index,160),title,created:c.create_time||null,messages};
 }).filter(Boolean);
}
export async function readChatFile(file){
 if(!file)throw Error('Choose a ChatGPT export.');
 if(file.size>150*1024*1024)throw Error('File exceeds 150 MB. Extract conversations.json separately.');
 if(/\.zip$/i.test(file.name))return JSON.parse(await unzipJson(new Uint8Array(await file.arrayBuffer())));
 if(!/\.json$/i.test(file.name))throw Error('Choose conversations.json or the ChatGPT export ZIP.');
 return JSON.parse(await file.text());
}
async function unzipJson(data){
 const v=new DataView(data.buffer,data.byteOffset,data.byteLength);let end=-1;
 for(let n=data.length-22;n>=Math.max(0,data.length-65558);n--)if(v.getUint32(n,true)===0x06054b50){end=n;break;}
 if(end<0)throw Error('Invalid ZIP. Extract conversations.json manually.');
 const count=v.getUint16(end+10,true);let pos=v.getUint32(end+16,true);const decoder=new TextDecoder();
 for(let idx=0;idx<count;idx++){
  if(pos+46>data.length||v.getUint32(pos,true)!==0x02014b50)throw Error('Invalid ZIP directory.');
  const method=v.getUint16(pos+10,true),compressed=v.getUint32(pos+20,true),uncompressed=v.getUint32(pos+24,true),
   nlen=v.getUint16(pos+28,true),elen=v.getUint16(pos+30,true),clen=v.getUint16(pos+32,true),loc=v.getUint32(pos+42,true);
  const filename=decoder.decode(data.slice(pos+46,pos+46+nlen));
  if(/(^|\/)conversations\.json$/i.test(filename)){
   if(uncompressed>100*1024*1024||compressed>100*1024*1024)throw Error('JSON file too large.');
   if(loc+30>data.length||v.getUint32(loc,true)!==0x04034b50)throw Error('Invalid ZIP local header.');
   const start=loc+30+v.getUint16(loc+26,true)+v.getUint16(loc+28,true);
   if(start+compressed>data.length)throw Error('ZIP entry truncated.');
   const content=data.slice(start,start+compressed);
   if(method===0)return decoder.decode(content);
   if(method===8){
    if(typeof DecompressionStream==='undefined')throw Error('Browser cannot extract ZIP. Import conversations.json instead.');
    try{
     const stream=new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
     const output=await new Response(stream).arrayBuffer();
     if(output.byteLength>100*1024*1024)throw Error('Decompressed file too large.');
     return decoder.decode(output);
    }catch(_){throw Error('ZIP decompression unavailable. Extract conversations.json manually.');}
   }
   throw Error('Unsupported ZIP compression. Extract conversations.json manually.');
  }
  pos+=46+nlen+elen+clen;
 }
 throw Error('No conversations.json inside this ZIP.');
}
function relevant(chat){
 if(topics.test(chat.title))return true;
 const name=slug(chat.title);
 if(Object.values(aliases).some(a=>a.some(term=>name.includes(slug(term)))))return true;
 if(generic.test(chat.title)||!chat.title)return chat.messages.slice(0,3).some(m=>topics.test(m)&&tasks.test(m));
 return chat.messages.slice(0,2).some(m=>topics.test(m)&&tasks.test(m)) && !/^(pregnancy|medicine|symptom|fever|pain)/i.test(chat.title);
}
function topicName(chat){
 if(!generic.test(chat.title))return safeSummary(chat.title,95);
 const m=chat.messages.find(x=>topics.test(x))||'Uncategorized discussion';
 return safeSummary(m.split(/[.!?\n]/)[0],80);
}
function matchTerm(title,term){const t=' '+slug(title)+' ',a=' '+slug(term)+' ';return a.trim().length>=5&&t.includes(a);}
function similarity(idea,project){
 const key=slug(project.name||''),full=slug(project.full_name?.split('/').pop()||'');
 const queryTitle=slug(idea.topic),query=slug(idea.topic+' '+(idea.sample||''));
 let score=0;
 if(key.length>=5&&matchTerm(queryTitle,key))score=97;
 if(full.length>=5&&matchTerm(queryTitle,full))score=Math.max(score,96);
 for(const term of (aliases[key]||aliases[full]||[]))if(matchTerm(queryTitle,term)||matchTerm(query,term))score=Math.max(score,91);
 const w=words(project.name);
 if(!score&&w.length>=2&&w.every(t=>words(queryTitle).includes(t)))score=80;
 return score;
}
export function reconcileIdea(idea,projects){
 const ranked=(projects||[]).map(p=>({id:String(p.id),name:p.name,score:similarity(idea,p)})).filter(x=>x.score>=80).sort((a,b)=>b.score-a.score);
 if(!ranked.length)return {status:'missing',projectId:null,projectName:null,confidence:0,evidence:'No strong portfolio/repository match. Local code may exist.'};
 if(ranked.length>1&&ranked[0].score-ranked[1].score<5)return {status:'review',projectId:null,projectName:null,confidence:ranked[0].score,evidence:'More than one potential project match.'};
 return {status:'linked',projectId:ranked[0].id,projectName:ranked[0].name,confidence:ranked[0].score,
  evidence:'Matched by project name. Feature implementation is NOT verified.'};
}
function requirements(chat){
 const result=[],seen=new Set();
 for(const m of chat.messages.slice(0,32)){
  for(const line of m.split(/[\n.!?]+/).slice(0,12)){
   const t=safeSummary(line.replace(/^[\s*#\d\-.)]+/,'').trim(),155);
   if(t.length<14||t.length>155||!tasks.test(t)||t.includes('[credential]'))continue;
   const k=slug(t);
   if(!seen.has(k)){result.push({id:hash(chat.sourceId+'|'+k),text:t,verification:'unverified',evidenceUrl:''});seen.add(k);}
   if(result.length>=7)return result;
  }
 }
 return result;
}
export function analyzeConversations(raw,projects,opts={}){
 const input=Array.isArray(raw)&&raw.length&&typeof raw[0]?.sourceId==='string'&&Array.isArray(raw[0]?.messages)?raw:extractChats(raw);
 const groups=new Map();let considered=0;
 for(const chat of input){
  if(!relevant(chat)&&opts.projectOnly!==false)continue;
  considered++;const topic=topicName(chat);
  if(!topic)continue;
  const key=slug(topic);
  const g=groups.get(key)||{id:'idea-'+hash(key),topic,source:'chatgpt-export',conversationCount:0,
   conversations:[],requirements:[],status:'unreviewed',manualProjectId:null,firstSeen:new Date().toISOString()};
  g.conversationCount++;
  if(g.conversations.length<20)g.conversations.push({id:'conv-'+hash(chat.sourceId),title:safeSummary(chat.title,120),created:chat.created});
  for(const req of requirements(chat))if(g.requirements.length<18&&!g.requirements.some(q=>slug(q.text)===slug(req.text)))g.requirements.push(req);
  groups.set(key,g);
 }
 const ideas=[...groups.values()].map(g=>({...g,match:reconcileIdea(g,projects)}));
 ideas.sort((a,b)=>a.match.status==='missing'&&b.match.status!=='missing'?-1:b.match.status==='missing'&&a.match.status!=='missing'?1:b.conversationCount-a.conversationCount);
 return {totalConversations:input.length,projectRelated:considered,ideas};
}
export function mergeDiscoveries(existing,incoming){
 const map=new Map((existing||[]).map(x=>[x.id,x]));let added=0,updated=0;
 for(const item of (incoming||[])){
  const before=map.get(item.id);
  if(before){
   const req=new Map((before.requirements||[]).map(r=>[slug(r.text),r]));
   for(const r of item.requirements||[])if(!req.has(slug(r.text)))req.set(slug(r.text),r);
   map.set(item.id,{...item,status:before.status,manualProjectId:before.manualProjectId||null,
    match:before.manualProjectId?before.match:item.match,requirements:[...req.values()].slice(0,30),firstSeen:before.firstSeen});updated++;
  }else{map.set(item.id,item);added++;}
 }
 return {ideas:[...map.values()],added,updated};
}
export function evidenceState(idea,project){
 if(!project)return 'No matched repository';
 const required=idea.requirements||[],verified=required.filter(r=>r.verification==='verified').length;
 return required.length?verified+'/'+required.length+' requests verified by evidence':'Matched project; implementation unverified';
}
