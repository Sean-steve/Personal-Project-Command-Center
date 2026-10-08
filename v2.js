import {DISCOVERY_KEY,CHECKPOINT_KEY,readChatFile,analyzeConversations,mergeDiscoveries,reconcileIdea,evidenceState} from './discovery.js';
const bridge=window.CommandCenterBridge;
const KEY='personal-command-center.v2.import-meta';
const read=(key,fallback)=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):fallback;}catch(_){return fallback;}};
const persist=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
let ideas=read(DISCOVERY_KEY,[]),checkpoints=read(CHECKPOINT_KEY,[]);
let preview=null,current=null,scope='all',view=null;
const el=document.getElementById('content');
const html=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>{const d=new Date(s||0);return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'—';};
const icon=(path)=>'<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
const bulb=icon('<path d="M9 18h6M10 21h4M9 14c-1-2-3-3-3-6a6 6 0 0 1 12 0c0 3-2 4-3 6l-1 2h-4z"/>');
const list=icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h9M8 13h9M8 17h5"/>');
const upload=icon('<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>');
const check=icon('<path d="m5 12 4 4L19 6"/>');
const plus=icon('<path d="M12 4v16M4 12h16"/>');
const link=icon('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>');
const download=icon('<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>');
const projectOptions=(selected)=>bridge.getProjects().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>'<option value="'+html(p.id)+'" '+(String(selected)===String(p.id)?'selected':'')+'>'+html(p.name)+(p.private?' (private)':'')+'</option>').join('');
const shell=(kicker,title,subtitle,actions)=>'<div class="page-heading"><div><div class="eyebrow">'+html(kicker)+'</div><h1>'+html(title)+'</h1><p>'+html(subtitle)+'</p></div><div class="heading-actions">'+(actions||'')+'</div></div>';
const button=(label,action,icon_,primary)=>'<button class="btn '+(primary?'btn-primary':'')+'" data-v2="'+action+'">'+(icon_||'')+html(label)+'</button>';
function nav(){
 const workspace=document.querySelector('#primary-nav');
 if(!workspace||workspace.querySelector('[data-v2-nav="discovery"]'))return;
 workspace.insertAdjacentHTML('beforeend',
 '<button class="nav-item" data-v2-nav="discovery">'+bulb+'Discovery <span class="nav-count" id="v2-new-count">—</span></button>'+
 '<button class="nav-item" data-v2-nav="checkpoints">'+list+'Checkpoints</button>');
}
function navState(){
 document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.v2Nav===view));
 document.getElementById('current-page').textContent=view==='discovery'?'Conversation discovery':'Development checkpoints';
 document.getElementById('v2-new-count').textContent=String(ideas.filter(x=>x.match?.status==='missing'&&x.status!=='dismissed').length);
}
function render(){
 if(!view)return;
 if(view==='discovery')renderDiscoveries();else renderCheckpoints();
 navState();
}
function go(next){
 window.dispatchEvent(new Event('commandcenter:v2-view'));
 view=next;preview=null;current=null;
 document.getElementById('sidebar').classList.remove('open');
 document.getElementById('mobile-shade').classList.remove('show');
 render();el.focus();
}
function totalStats(){
 const list=ideas.filter(x=>x.status!=='dismissed');
 return {total:list.length,missing:list.filter(x=>x.match?.status==='missing'&&!x.manualProjectId).length,
   linked:list.filter(x=>x.match?.status==='linked'||x.manualProjectId).length,
   reqs:list.reduce((n,i)=>n+(i.requirements?.length||0),0)};
}
function renderDiscoveries(){
 const stats=totalStats(),projects=bridge.getProjects();
 let shown=ideas.filter(x=>scope==='all'||scope==='missing'&&x.match?.status==='missing'&&!x.manualProjectId||
  scope==='linked'&&(x.match?.status==='linked'||x.manualProjectId)||scope==='review'&&x.match?.status==='review');
 shown=shown.filter(x=>x.status!=='dismissed');
 const bar=shell('PROJECT INTELLIGENCE','Conversation discovery',
  'Find product ideas and outstanding requests from your ChatGPT conversations.',
  button('Import ChatGPT export','choose-import',upload,true)+button('Export findings','export-findings',download,false));
 const warning='<div class="alert-strip">'+bulb+'<div><strong>Private by design.</strong> Your file is processed in this browser; raw conversations are not uploaded or saved. Only the summaries you explicitly approve are retained locally. Matching a GitHub repo does not verify that a feature was built.</div></div>';
 const nums='<div class="stats-grid">'+[['Ideas identified',stats.total,'All saved discussion topics'],['Missing repo match',stats.missing,'Possible unregistered projects'],['Linked projects',stats.linked,'Names matched or linked manually'],['Requests to verify',stats.reqs,'Implementation status not assumed']].map(([a,b,c],idx)=>'<div class="stat-card"><div class="stat-head"><span>'+a+'</span><span class="stat-icon '+['lavender','peach','mint','blue'][idx]+'">'+[bulb,plus,link,check][idx]+'</span></div><div class="stat-value">'+b+'</div><div class="stat-foot">'+c+'</div></div>').join('')+'</div>';
 const uploadPanel=preview?'<section class="panel" style="margin-bottom:23px"><div class="panel-body"><div class="panel-title"><h3>Review your import</h3><span>'+preview.totalConversations+' conversations examined</span></div><p class="small-muted" style="line-height:1.8">'+preview.projectRelated+' conversations looked project-related, producing '+preview.ideas.length+' possible project topics. Summaries can contain mistakes. Review before saving; no raw transcript is retained.</p><label style="display:block;margin:18px 0"><input id="v2-confirm" type="checkbox"> I authorize this browser to save project-topic summaries extracted from the export.</label><div style="display:flex;gap:9px;flex-wrap:wrap">'+button('Save '+preview.ideas.length+' findings','save-import',check,true)+button('Cancel','cancel-import',null,false)+'</div><div class="v2-preview-list">'+preview.ideas.slice(0,15).map(x=>'<span class="type-pill">'+html(x.topic)+'</span>').join('')+(preview.ideas.length>15?'<small>…and '+(preview.ideas.length-15)+' more</small>':'')+'</div></div></section>':'';
 const filters='<div class="toolbar"><label class="small-muted" for="v2-scope">Show</label><select id="v2-scope"><option value="all" '+(scope==='all'?'selected':'')+'>All findings</option><option value="missing" '+(scope==='missing'?'selected':'')+'>Missing from GitHub</option><option value="linked" '+(scope==='linked'?'selected':'')+'>Linked projects</option><option value="review" '+(scope==='review'?'selected':'')+'>Needs review</option></select><span class="small-muted">'+shown.length+' topics</span></div>';
 const cards=shown.length?'<div class="v2-cards">'+shown.slice(0,350).map(x=>{
  const match=x.manualProjectId?{...x.match,status:'linked',projectId:x.manualProjectId,projectName:projects.find(p=>p.id===x.manualProjectId)?.name||'Linked project'}:x.match;
  const stage=match?.status==='linked'?'Linked project':match?.status==='missing'?'No repository match':'Review match';
  const color=match?.status==='linked'?'live':match?.status==='missing'?'review':'planned';
  const req=(x.requirements||[]).slice(0,2).map(r=>'<li>'+html(r.text)+'</li>').join('');
  return '<article class="panel v2-discovery-card" data-v2-idea="'+html(x.id)+'"><div class="panel-body">'+
   '<div class="v2-card-head"><span class="tag '+color+'">'+html(stage)+'</span><small>'+x.conversationCount+' conversation'+(x.conversationCount===1?'':'s')+'</small></div>'+
   '<h3>'+html(x.topic)+'</h3><p class="small-muted">'+html(match?.evidence||'Needs review')+'</p>'+
   (req?'<ul>'+req+'</ul>':'<p class="small-muted">No actionable requirements could be reliably extracted.</p>')+
   '<div class="v2-card-footer"><button class="btn" data-v2="details" data-id="'+html(x.id)+'">Review requirements</button>'+
   (match?.status==='missing'?'<button class="btn btn-primary" data-v2="register" data-id="'+html(x.id)+'">'+plus+' Add to portfolio</button>':
     '<span class="small-muted">'+html(match?.projectName||'Unlinked')+'</span>')+'</div>'+
   '</div></article>';
 }).join('')+'</div>':empty('No discoveries to display',ideas.length?'Try another filter.':'Import your ChatGPT export to discover projects missing from GitHub.');
 return bar+warning+nums+uploadPanel+filters+cards+
  '<input hidden type="file" id="v2-file-input" accept=".json,.zip,application/json,application/zip">'+
  '<p class="small-muted" style="margin-top:18px">V2 currently analyzes imported exports, not a live ChatGPT account connection. Conversation titles, redacted requirement summaries, and project links remain on this browser until cloud storage is configured.</p>';
}
function empty(title,body){return '<div class="panel"><div class="empty"><strong>'+html(title)+'</strong><p>'+html(body)+'</p></div></div>';}
function details(id){
 const x=ideas.find(z=>z.id===id);if(!x)return;
 current=x.id;const p=bridge.getProjects().find(q=>q.id===(x.manualProjectId||x.match?.projectId));
 const req=x.requirements||[];
 const opts='<option value="">No linked project</option>'+projectOptions(p?.id||'');
 const rows=req.length?req.map((r,k)=>'<div class="v2-requirement"><div><b>'+html(r.text)+'</b><small>'+html(r.verification==='verified'?'Manually verified using linked evidence':'Implementation unverified — needs code/test evidence')+'</small>'+(r.evidenceUrl?'<a href="'+html(r.evidenceUrl)+'" target="_blank" rel="noopener noreferrer">View evidence ↗</a>':'')+'</div><button class="btn" data-v2="verify" data-id="'+html(x.id)+'" data-req="'+k+'">'+(r.verification==='verified'?'Edit evidence':'Add evidence')+'</button></div>').join(''):'<p class="small-muted">No feature requests found. This conversation can still be registered as an idea.</p>';
 document.getElementById('overlay-root').innerHTML='<div class="overlay"><div class="drawer" role="dialog" aria-modal="true" aria-label="Conversation findings"><div class="drawer-head"><div><div class="eyebrow">CONVERSATION RECONCILIATION</div><h2>'+html(x.topic)+'</h2><p>'+x.conversationCount+' conversation(s) · Imported summary</p></div><button class="icon-btn" data-v2="close">✕</button></div><div class="drawer-content"><div class="info-card">'+html(evidenceState(x,p))+'</div><div class="field" style="margin-top:22px"><label for="v2-link">Match this idea to a project</label><select id="v2-link" data-id="'+html(x.id)+'">'+opts+'</select></div><h3 style="margin:27px 0 13px">Requested features</h3>'+rows+'<h3 style="margin-top:26px">Conversation references</h3><div class="v2-session-list">'+(x.conversations||[]).map(c=>'<div><b>'+html(c.title)+'</b><small>Chat reference '+html(c.id)+' · '+date(c.created&&c.created<1000000000000?c.created*1000:c.created)+'</small></div>').join('')+'</div><div class="thin-divider"></div><button class="btn" data-v2="dismiss" data-id="'+html(x.id)+'">Dismiss finding</button></div></div></div>';
}
function renderCheckpoints(){
 const items=checkpoints.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 const projects=bridge.getProjects(),recent=items.slice(0,60);
 const stats='<div class="stats-grid">'+[
  ['Recorded checkpoints',items.length,'Persistent development notes'],
  ['Projects covered',new Set(items.map(c=>c.projectId)).size,'With a saved handoff'],
  ['Known blockers',items.filter(c=>c.blockers).length,'Need your attention'],
  ['Tests verified',items.filter(c=>c.tests==='pass').length,'Reported PASS checkpoints']
 ].map(([a,b,c],j)=>'<div class="stat-card"><div class="stat-head"><span>'+a+'</span><span class="stat-icon '+['lavender','blue','peach','mint'][j]+'">'+list+'</span></div><div class="stat-value">'+b+'</div><div class="stat-foot">'+c+'</div></div>').join('')+'</div>';
 const cards=recent.length?'<div class="v2-cards">'+recent.map(c=>{
  const p=projects.find(p=>p.id===c.projectId);
  return '<section class="panel"><div class="panel-body"><div class="v2-card-head"><span class="tag '+(c.tests==='pass'?'live':c.tests==='fail'?'review':'planned')+'">'+html(c.tests.toUpperCase())+'</span><small>'+date(c.createdAt)+'</small></div><h3>'+html(p?.name||c.projectName||'Unlinked project')+'</h3><p class="small-muted"><b>Completed:</b> '+html(c.completed||'No completed work noted')+'</p><p class="small-muted"><b>Next:</b> '+html(c.next||'Not recorded')+'</p>'+(c.blockers?'<p class="small-muted"><b>Blocker:</b> '+html(c.blockers)+'</p>':'')+'<div class="v2-card-footer"><span class="small-muted">'+html(c.branch||'Branch not provided')+'</span><button class="btn" data-v2="cp-detail" data-id="'+html(c.id)+'">Details</button></div></div></section>';
 }).join('')+'</div>':empty('No development checkpoints','Record where you stopped, what passed, and what to do when you return.');
 return shell('DEVELOPMENT MEMORY','Development checkpoints','A reliable handoff when switching between projects and coding agents.',button('Add checkpoint','new-checkpoint',plus,true)+button('Export checkpoints','export-checkpoints',download))+
  '<div class="alert-strip">'+list+'<div><strong>Evidence matters.</strong> These are manually recorded checkpoints. Test outcomes and commits are not independently verified by GitHub until a connected verification service is enabled.</div></div>'+
  stats+cards;
}
function checkpointForm(){
 const projects=bridge.getProjects();
 if(!projects.length){bridge.notify('Add a project first.');return;}
 document.getElementById('overlay-root').innerHTML='<div class="overlay modal-center"><div class="modal" role="dialog" aria-modal="true" aria-label="Development checkpoint"><div class="drawer-head"><div><div class="eyebrow">DEVELOPMENT MEMORY</div><h2>Save a checkpoint</h2><p>Make it easy to resume later.</p></div><button class="icon-btn" data-v2="close">✕</button></div><div class="drawer-content"><form id="v2-cp-form"><div class="field"><label>Project</label><select name="projectId">'+projectOptions('')+'</select></div><div class="form-grid"><div class="field"><label>Branch</label><input name="branch" placeholder="main or feature/..."></div><div class="field"><label>Test results</label><select name="tests"><option value="unknown">Not verified</option><option value="pass">Pass (self-reported)</option><option value="fail">Fail / blocked</option></select></div></div><div class="field"><label>Completed work</label><textarea name="completed" maxlength="1000" required placeholder="What was actually changed?"></textarea></div><div class="field"><label>Next action</label><textarea name="next" maxlength="1000" placeholder="One concrete action for the next session"></textarea></div><div class="field"><label>Blockers</label><textarea name="blockers" maxlength="1000"></textarea></div><div class="field"><label>Commit or PR evidence URL (optional)</label><input name="evidence" placeholder="https://github.com/owner/repo/commit/..."></div><button class="btn btn-primary" type="submit">Save checkpoint</button></form></div></div></div>';
}
function checkpointDetails(id){
 const c=checkpoints.find(x=>x.id===id);if(!c)return;
 const p=bridge.getProjects().find(x=>x.id===c.projectId);
 document.getElementById('overlay-root').innerHTML='<div class="overlay"><div class="drawer" role="dialog" aria-modal="true"><div class="drawer-head"><div><h2>'+html(p?.name||c.projectName||'Checkpoint')+'</h2><p>'+date(c.createdAt)+' · '+html(c.branch||'Branch not specified')+'</p></div><button class="icon-btn" data-v2="close">✕</button></div><div class="drawer-content"><h3>Completed</h3><p>'+html(c.completed)+'</p><h3>Next action</h3><p>'+html(c.next||'None recorded')+'</p><h3>Blockers</h3><p>'+html(c.blockers||'None recorded')+'</p><h3>Tests</h3><p>'+html(c.tests)+' (self-reported)</p>'+(c.evidence?'<a class="btn" rel="noopener noreferrer" target="_blank" href="'+html(c.evidence)+'">View GitHub evidence ↗</a>':'')+'</div></div></div>';
}
function notify(message){bridge.notify(message);}
function saveIdeas(list){ideas=list.slice(0,1500);if(!persist(DISCOVERY_KEY,ideas))notify('Browser storage is full. Export your findings.');}
function saveCheckpoint(list){checkpoints=list.slice(0,700);if(!persist(CHECKPOINT_KEY,checkpoints))notify('Storage full. Export your checkpoints.');}
function downloadJson(filename,obj){
 const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function isEvidenceURL(str){try{let u=new URL(str);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.split('/').filter(Boolean).length>=4;}catch(_){return false;}}
nav();
render();
document.addEventListener('click',event=>{
 const original=event.target.closest('[data-view]');
 if(original && !event.target.closest('[data-v2]') && view){view=null;return;}
 const navigation=event.target.closest('[data-v2-nav]');
 if(navigation){event.preventDefault();event.stopImmediatePropagation();go(navigation.dataset.v2Nav);return;}
 const btn=event.target.closest('[data-v2]');
 if(!btn)return;
 event.preventDefault();event.stopImmediatePropagation();
 const act=btn.dataset.v2,id=btn.dataset.id;
 if(act==='choose-import'){document.getElementById('v2-file-input')?.click();}
 if(act==='cancel-import'){preview=null;render();}
 if(act==='save-import'){
  if(!document.getElementById('v2-confirm')?.checked){notify('Please approve saving the extracted summaries.');return;}
  const res=mergeDiscoveries(ideas,preview?.ideas||[]);
  saveIdeas(res.ideas);preview=null;render();notify('Saved '+res.added+' new ideas; '+res.updated+' previously known ideas updated.');
 }
 if(act==='details')details(id);
 if(act==='close')document.getElementById('overlay-root').innerHTML='';
 if(act==='register'){
  const idea=ideas.find(x=>x.id===id);if(!idea)return;
  const project=bridge.createFromIdea(idea.topic,'Idea discovered from ChatGPT conversation(s). Requirements remain unverified.');
  idea.manualProjectId=project.id;idea.match={status:'linked',projectId:project.id,projectName:project.name,confidence:100,evidence:'Manually added to portfolio; no repository or implementation verified.'};
  saveIdeas(ideas);render();notify('Created '+project.name+' in Inbox.');
 }
 if(act==='dismiss'){const x=ideas.find(x=>x.id===id);if(x){x.status='dismissed';saveIdeas(ideas);document.getElementById('overlay-root').innerHTML='';render();}}
 if(act==='verify'){
  const idea=ideas.find(x=>x.id===id),req=idea?.requirements?.[Number(btn.dataset.req)];if(!req)return;
  const url=prompt('Paste a GitHub commit, PR, issue or file URL that supports this request. This is a manual verification; the app cannot prove the feature works.',req.evidenceUrl||'');
  if(url===null)return;
  if(!isEvidenceURL(url)){notify('A valid https://github.com/owner/repo/... evidence URL is required.');return;}
  req.evidenceUrl=url;req.verification='verified';saveIdeas(ideas);details(id);notify('Evidence recorded. Independently verify tests before release.');
 }
 if(act==='new-checkpoint')checkpointForm();
 if(act==='cp-detail')checkpointDetails(id);
 if(act==='export-findings'){downloadJson('project-discovery-private-backup.json',{version:2,ideas});notify('Private findings exported. Store securely.');}
 if(act==='export-checkpoints'){downloadJson('development-checkpoints-private-backup.json',{version:2,checkpoints});notify('Checkpoints exported.');}
},true);
document.addEventListener('change',async event=>{
 const target=event.target;
 if(target.id==='v2-scope'){scope=target.value;render();}
 if(target.id==='v2-link'){
  const idea=ideas.find(x=>x.id===target.dataset.id);if(!idea)return;
  idea.manualProjectId=target.value||null;
  idea.match=target.value?{status:'linked',projectId:target.value,projectName:bridge.getProjects().find(p=>p.id===target.value)?.name||'Linked',confidence:100,evidence:'Manually matched; implementation is not verified.'}:reconcileIdea(idea,bridge.getProjects());
  saveIdeas(ideas);document.getElementById('overlay-root').innerHTML='';render();notify('Project matching updated.');
 }
 if(target.id==='v2-file-input'){
  const file=target.files?.[0];if(!file)return;
  try{
   notify('Reading export locally. No data is uploaded.');
   const raw=await readChatFile(file);
   preview=analyzeConversations(raw,bridge.getProjects());
   if(preview.ideas.length>1500)preview.ideas=preview.ideas.slice(0,1500);
   render();notify('Found '+preview.ideas.length+' potential project topics. Review before saving.');
  }catch(err){notify(err.message||'Import failed.');}
  target.value='';
 }
},true);
document.addEventListener('submit',event=>{
 if(event.target.id!=='v2-cp-form')return;
 event.preventDefault();event.stopImmediatePropagation();
 const f=new FormData(event.target);
 const projectId=String(f.get('projectId')||''),project=bridge.getProjects().find(x=>x.id===projectId);
 if(!project){notify('Select a project.');return;}
 const evidence=String(f.get('evidence')||'').trim();
 if(evidence&&!isEvidenceURL(evidence)){notify('Evidence must be a valid GitHub URL.');return;}
 const c={id:'checkpoint-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),projectId,
  projectName:project.name,branch:String(f.get('branch')||'').slice(0,160),
  tests:String(f.get('tests')||'unknown'),completed:String(f.get('completed')||'').slice(0,1000),
  next:String(f.get('next')||'').slice(0,1000),blockers:String(f.get('blockers')||'').slice(0,1000),
  evidence,createdAt:new Date().toISOString()};
 checkpoints.unshift(c);saveCheckpoint(checkpoints);
 document.getElementById('overlay-root').innerHTML='';render();notify('Checkpoint saved for '+project.name+'.');
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.getElementById('overlay-root').innerHTML='';});
window.addEventListener('commandcenter:render',()=>{if(view)render();});
window.addEventListener('commandcenter:cloud-view',()=>{view=null;});
// Reconcile matches when public repositories refresh, but keep user-linked decisions.
window.setInterval(()=>{
 if(!view)return;
 let changed=false;
 for(const x of ideas)if(!x.manualProjectId){
  const next=reconcileIdea(x,bridge.getProjects());
  if(next.status!==x.match?.status||next.projectId!==x.match?.projectId){x.match=next;changed=true;}
 }
 if(changed){saveIdeas(ideas);render();}
},60*1000);
