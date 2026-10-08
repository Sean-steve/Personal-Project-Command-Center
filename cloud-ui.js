/* Optional V2 authenticated cloud backups. The static app still works offline. */
import {cloudConfig,configureCloud,getCloud,cloudUser,signInCloud,signOutCloud,loadCloud,saveCloud} from './cloud.js';
import {DISCOVERY_KEY,CHECKPOINT_KEY} from './discovery.js';
const bridge=window.CommandCenterBridge;
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(_){return d}};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(title,act,primary=false)=>'<button class="btn '+(primary?'btn-primary':'')+'" data-cloud="'+act+'">'+title+'</button>';
let active=false,user=null,revision=undefined,remote=null,busy=false;
function panel(){
 const c=cloudConfig();
 const isReady=!!c;
 return '<div class="page-heading"><div><div class="eyebrow">SECURE DATA</div><h1>Cloud workspace</h1><p>Optional authenticated backups across devices with revision-conflict protection.</p></div></div>'+
 '<div class="alert-strip"><span>◈</span><div><strong>Cloud is opt-in.</strong> Your browser never uploads ChatGPT exports or raw transcripts. Choosing Upload saves only current project records, derived conversation findings, and checkpoints. The current public site remains a local-first dashboard until you connect a dedicated database.</div></div>'+
 '<div class="main-grid"><section class="panel"><div class="panel-body"><div class="panel-title"><h3>Connection</h3><span class="tag '+(user?'live':'planned')+'">'+(user?'Signed in':isReady?'Configured':'Not configured')+'</span></div>'+
 '<form id="cloud-config-form"><div class="field"><label>Dedicated Supabase project URL</label><input name="url" type="url" placeholder="https://YOUR-REF.supabase.co" value="'+esc(c?.url||'')+'" required></div>'+
 '<div class="field"><label>Publishable key (NOT a secret key)</label><input name="publishableKey" type="password" autocomplete="off" placeholder="sb_publishable_..." value="'+esc(c?.publishableKey||'')+'" required></div>'+
 '<div class="flow" style="margin:18px 0">'+btn('Save connection','save-config',true)+'</div></form>'+
 '<p class="small-muted" style="line-height:1.8">Configure a separate database and run the included SQL migration. The publishable key can be used in a browser; secret or service-role keys are forbidden.</p>'+
 '<div class="thin-divider"></div><div class="panel-title"><h3>GitHub sign-in</h3><span class="small-muted">'+esc(user?.email||'Not signed in')+'</span></div>'+
 (user?btn('Sign out','logout'):isReady?btn('Sign in with GitHub','login',true):'<span class="small-muted">Save a valid connection first.</span>')+
 '</div></section><section class="panel"><div class="panel-body"><div class="panel-title"><h3>Authenticated portfolio backup</h3><span class="small-muted">Owner-only RLS</span></div>'+
 '<p class="small-muted" style="line-height:1.8">Download the most recent saved portfolio on another device, or upload your current browser data. If the cloud changed after your last download, the server rejects a stale overwrite.</p>'+
 '<div class="detail-row"><span>Cloud status</span><span>'+(!user?'Sign-in required':revision===undefined?'Not checked':remote?'Snapshot found':'No snapshot')+'</span></div>'+
 '<div class="detail-row"><span>Known revision</span><span>'+esc(revision==null?'—':revision)+'</span></div>'+
 '<div class="detail-row"><span>Remote projects</span><span>'+esc(remote?.document?.projects?.length??'Unknown')+'</span></div>'+
 '<div class="flow" style="margin-top:25px">'+btn('Check cloud','check-cloud')+btn('Download to browser','pull-cloud')+btn('Upload local snapshot','push-cloud',true)+'</div>'+
 '<p class="small-muted" style="line-height:1.8;margin-top:22px">Cloud backups may contain sensitive project titles and requirement summaries. Use a private account and a trusted computer. Do not share exported files publicly.</p>'+
 '</div></section></div>'+
 '<div class="panel" style="margin-top:22px"><div class="panel-body"><div class="panel-title"><h3>Setup required</h3></div><p class="small-muted" style="line-height:2">1. Create a dedicated Supabase project. 2. Apply <code>supabase/migrations/20261008155000_pcc_v2_snapshots.sql</code> using its SQL editor. 3. Enable GitHub in Authentication → Providers, configure the GitHub OAuth application and add this site to redirect URLs. 4. Paste only the project URL and publishable key above. 5. Sign in and explicitly upload your initial snapshot.</p><a target="_blank" rel="noopener noreferrer" href="https://github.com/Sean-steve/Personal-Project-Command-Center/blob/main/docs/CLOUD_SETUP.md" class="btn">Full setup guide ↗</a></div></div>';
}
function render(){
 if(!active)return;
 document.getElementById('content').innerHTML=panel();
 document.getElementById('current-page').textContent='Cloud workspace';
 document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',!!n.dataset.cloudNav));
}
function open(){
 active=true;
 window.dispatchEvent(new Event('commandcenter:cloud-view'));
 document.getElementById('sidebar').classList.remove('open');
 document.getElementById('mobile-shade').classList.remove('show');
 render();
 document.getElementById('content').focus();
}
function addNav(){
 const nav=document.querySelector('#primary-nav');if(!nav||nav.querySelector('[data-cloud-nav]'))return;
 nav.insertAdjacentHTML('beforeend','<button class="nav-item" data-cloud-nav="workspace"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>Cloud workspace</button>');
}
async function check(){
 const row=await loadCloud();remote=row;revision=row?.revision??null;
 user=await cloudUser();render();
 return row;
}
function payload(){
 return {version:2,updatedAt:new Date().toISOString(),
  projects:bridge.getProjects(),
  ideas:read(DISCOVERY_KEY,[]),checkpoints:read(CHECKPOINT_KEY,[])};
}
async function run(action){
 if(busy)return;busy=true;
 try{
  if(action==='login')return await signInCloud();
  if(action==='logout'){await signOutCloud();user=null;remote=null;revision=undefined;return render();}
  if(action==='check-cloud'){await check();return bridge.notify('Cloud status refreshed.');}
  if(action==='pull-cloud'){
   const row=await check();if(!row){bridge.notify('No cloud snapshot found. Upload your local data first.');return;}
   if(!Array.isArray(row.document?.projects))throw Error('Remote snapshot is missing project records.');
   if(!confirm('Replace this browser’s projects, findings and checkpoints with the cloud snapshot? Export your local backup first if needed.'))return;
   bridge.replaceProjects(row.document.projects);
   localStorage.setItem(DISCOVERY_KEY,JSON.stringify(row.document.ideas||[]));
   localStorage.setItem(CHECKPOINT_KEY,JSON.stringify(row.document.checkpoints||[]));
   bridge.notify('Restored cloud snapshot. Refresh this tab to reload discovery and checkpoints.');
  }
  if(action==='push-cloud'){
   if(revision===undefined){await check();bridge.notify('Cloud checked. Confirm upload again after reviewing its status.');return;}
   if(!confirm('Upload your current portfolio and private derived summaries to your authenticated cloud account?'))return;
   const rev=await saveCloud(payload(),revision);
   revision=rev;remote={revision:rev,document:payload()};render();bridge.notify('Cloud snapshot saved (revision '+rev+').');
  }
 }catch(error){bridge.notify(error.message||'Cloud operation failed.');}
 finally{busy=false;}
}
addNav();
window.addEventListener('commandcenter:render',()=>{if(active)render();});
document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-cloud-nav]');
 if(nav){event.preventDefault();event.stopImmediatePropagation();open();return;}
 const other=event.target.closest('[data-view],[data-v2-nav]');
 if(other){active=false;return;}
 const control=event.target.closest('[data-cloud]');
 if(!control)return;
 event.preventDefault();event.stopImmediatePropagation();
 run(control.dataset.cloud);
},true);
document.addEventListener('submit',async event=>{
 if(event.target.id!=='cloud-config-form')return;
 event.preventDefault();event.stopImmediatePropagation();
 if(busy)return;
 const f=new FormData(event.target);
 try{
  await configureCloud({url:String(f.get('url')||'').trim(),publishableKey:String(f.get('publishableKey')||'').trim()});
  user=await cloudUser();revision=undefined;remote=null;render();bridge.notify('Cloud connection saved.');
 }catch(error){bridge.notify(error.message||'Invalid connection.');}
},true);
if(cloudConfig())cloudUser().then(u=>{user=u;if(active)render();}).catch(()=>{});
