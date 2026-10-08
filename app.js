import {
  OWNER, STORAGE_KEY, PREF_KEY, STATUSES, STAGES, CATEGORIES, PRIORITIES, HEALTH,
  initialData, readJSON, writeJSON, normalize, fetchPublicRepos, mergePublicRepos, mergeImported
} from './data.js';

const data=initialData();
const state={
  projects:data.projects,
  lastSync:data.lastSync || null,
  view:'overview',query:'',statusFilter:'All',categoryFilter:'All',
  priorityFilter:'All',showArchived:readJSON(PREF_KEY,{showArchived:false}).showArchived,
  sort:'priority',refreshing:false
};
const ICONS={
  layout:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers:'<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>',
  columns:'<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chart:'<path d="M3 3v18h18M7 16l4-5 3 2 5-7"/>',
  repeat:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l.5 2.1 2.1.9 1.8-1.1 2.8 2.8-1.1 1.8.9 2.1L23 11v4l-2.1.5-.9 2.1 1.1 1.8-2.8 2.8-1.8-1.1-2.1.9L14 23h-4l-.5-2.1-2.1-.9-1.8 1.1-2.8-2.8 1.1-1.8-.9-2.1L1 15v-4l2.1-.5.9-2.1-1.1-1.8 2.8-2.8 1.8 1.1 2.1-.9z" transform="translate(0,-1) scale(1,.95)"/>',
  zap:'<path d="M13 2L3 14h8l-1 8 11-12h-8z"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.4 9a2.6 2.6 0 0 1 5.2 0c0 2-2.6 2.1-2.6 4M12 17h.01"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  alert:'<path d="M12 3 2 21h20L12 3zM12 10v4M12 17h.01"/>',
  code:'<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-12-2 16"/>',
  bolt:'<path d="M13 2 3 14h8l-1 8 11-12h-8z"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  upload:'<path d="M12 21V9m-5 5 5-5 5 5M4 7V3h16v4"/>',
  x:'<path d="M5 5l14 14M19 5 5 19"/>',
  github:'<path d="M9 19c-4 1-4-2-6-2m12 4v-3a3 3 0 0 0-.9-2.3c3-.4 6-1.3 6-6.6 0-1.5-.5-2.6-1.4-3.6.2-1 .2-2.1-.2-3.1 0 0-1.2-.4-3.8 1.5a13 13 0 0 0-7 0C5.1 2 4 2.4 4 2.4c-.4 1-.4 2.1-.2 3.1A5.3 5.3 0 0 0 2.4 9c0 5.3 3 6.2 6 6.6A3 3 0 0 0 7.5 18v3"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  sparkles:'<path d="m12 2 2 7 7 2-7 2-2 7-2-7-7-2 7-2zM19 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v7M12 7h.01"/>',
  trash:'<path d="M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15M10 10v8m4-8v8"/>'
};
const i=(name)=>'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[name]||ICONS.folder)+'</svg>';
const e=(value)=>String(value==null?'':value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=(s)=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-');
const safeUrl=(url)=>/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/(?:issues|pull|actions|tree|blob)\/[A-Za-z0-9_.\/-]+)?\/?$/.test(String(url||''))?url:'';
const shortDate=(str)=>{if(!str)return '—'; const d=new Date(str);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});};
const relativeDate=(str)=>{if(!str)return 'No activity'; const delta=Date.now()-new Date(str).getTime();if(!Number.isFinite(delta))return 'Unknown';const days=Math.max(0,Math.floor(delta/86400000));return days===0?'Today':days===1?'Yesterday':days<30?days+' days ago':shortDate(str);};
const logo=(p)=>{const n=(p.name||'P').split(/[\s-]+/).filter(Boolean);const letters=(n.length===1?n[0].slice(0,2):n[0][0]+n[1][0]).toUpperCase(); const tones=['purple','green','orange','blue','pink','navy']; let h=0; for(const c of p.name)h=(h*31+c.charCodeAt(0))>>>0;return '<span class="project-logo" data-tone="'+tones[h%tones.length]+'">'+e(letters)+'</span>';};
const tag=(status)=>'<span class="tag '+slug(status)+'">'+e(status)+'</span>';
const prio=(priority)=>'<span class="priority '+slug(priority)+'">'+e(priority)+'</span>';
const fullName=(p)=>p.full_name||'Local project';
const active=()=>state.projects.filter(p=>p.status==='In Progress');
const visible=()=>state.projects.filter(p=>state.showArchived||p.status!=='Archived');
const attention=()=>state.projects.filter(p=>p.status==='Inbox'||p.health==='Blocked'||p.health==='At risk'||(p.status==='In Progress'&&!p.next)).sort((a,b)=>priorityValue(a.priority)-priorityValue(b.priority));
const priorityValue=(s)=>({P0:0,P1:1,P2:2,P3:3,None:4}[s]??5);
const getProject=(id)=>state.projects.find(p=>p.id===String(id));
const countStatus=(name)=>state.projects.filter(p=>p.status===name).length;
function persist() {
  const ok=writeJSON(STORAGE_KEY,{version:1,lastSync:state.lastSync,projects:state.projects});
  if(!ok)toast('Could not save to browser storage. Export a backup.');
  document.getElementById('nav-project-count').textContent=String(state.projects.length);
  document.getElementById('focus-count').textContent=active().length+' / 3 active projects';
  document.getElementById('focus-progress').style.width=Math.min(100,Math.round(active().length/3*100))+'%';
  document.getElementById('footer-sync').textContent=state.lastSync?'Public GitHub synced '+relativeDate(state.lastSync):'Local data · GitHub sync pending';
}
let toastTimeout;
function toast(message) {
  const root=document.getElementById('toast-root');
  root.innerHTML='<div class="toast">'+i('check')+'<span>'+e(message)+'</span></div>';
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{root.innerHTML='';},4300);
}
function pageHeading(kicker,title,subtitle,actions) {
  return '<div class="page-heading"><div><div class="eyebrow">'+e(kicker)+'</div><h1>'+e(title)+'</h1><p>'+e(subtitle)+'</p></div><div class="heading-actions">'+(actions||'')+'</div></div>';
}
const newButton=()=>'<button class="btn btn-primary" data-action="new">'+i('plus')+' New project</button>';
const syncButton=()=>'<button class="btn" data-action="sync">'+i('refresh')+' Sync GitHub</button>';
function empty(title,subtitle,action) {
  return '<div class="empty"><span class="empty-icon">'+i('folder')+'</span><strong>'+e(title)+'</strong><p>'+e(subtitle)+'</p>'+(action||'')+'</div>';
}
function sortProjects(projects) {
  return projects.sort((a,b)=>{
    if(state.sort==='name')return a.name.localeCompare(b.name);
    if(state.sort==='recent')return new Date(b.pushedAt||b.updatedAt||0)-new Date(a.pushedAt||a.updatedAt||0);
    if(state.sort==='status')return STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);
    return priorityValue(a.priority)-priorityValue(b.priority)||a.name.localeCompare(b.name);
  });
}
function filtered() {
  const q=state.query.toLowerCase().trim();
  return sortProjects(visible().filter(p=>
    (state.statusFilter==='All'||p.status===state.statusFilter)&&
    (state.categoryFilter==='All'||p.category===state.categoryFilter)&&
    (state.priorityFilter==='All'||p.priority===state.priorityFilter)&&
    (!q||[p.name,p.full_name,p.description,p.next,p.category,p.milestone].some(v=>String(v||'').toLowerCase().includes(q)))));
}
function projectRow(p) {
  return '<div class="project-row" data-project="'+e(p.id)+'">'+logo(p)+'<div class="project-summary"><strong>'+e(p.name)+(p.private?' '+i('lock'):'')+'</strong><small>'+e(p.next||fullName(p))+'</small></div><div class="right-meta">'+prio(p.priority)+tag(p.status)+i('chevron')+'</div></div>';
}
function overview() {
  const total=state.projects.length, live=countStatus('Live'), inprog=active().length, reviews=attention().length;
  const stats=[
    {label:'Total projects',value:total,foot:'Across your portfolio',icon:'layers',color:'lavender'},
    {label:'In progress',value:inprog,foot:inprog>3?'Over your focus limit':'Your three-project focus',icon:'zap',color:'blue'},
    {label:'Shipped / live',value:live,foot:'Marked live in your workspace',icon:'check',color:'mint'},
    {label:'Needs attention',value:reviews,foot:'Inbox, risks and blockers',icon:'alert',color:'peach'}
  ];
  const categories=categoryCounts().slice(0,5),max=Math.max(1,...categories.map(x=>x.count));
  const recent=state.projects.slice().filter(p=>p.pushedAt).sort((a,b)=>new Date(b.pushedAt)-new Date(a.pushedAt)).slice(0,4);
  return pageHeading('YOUR WORKSPACE','Good to see you.','Here is everything happening across your projects, in one clear view.',syncButton()+newButton())+
    (inprog>3?'<div class="alert-strip">'+i('alert')+'<div><strong>Focus limit exceeded.</strong> You have '+inprog+' active projects; your recommended maximum is three.</div></div>':'')+
    '<div class="stats-grid">'+stats.map(s=>'<div class="stat-card"><div class="stat-head"><span>'+e(s.label)+'</span><span class="stat-icon '+s.color+'">'+i(s.icon)+'</span></div><div class="stat-value">'+s.value+'</div><div class="stat-foot">'+e(s.foot)+'</div></div>').join('')+'</div>'+
    '<div class="main-grid"><section><div class="section-heading"><h2>Currently in motion</h2><button data-view="portfolio">View all projects '+i('arrow')+'</button></div><div class="panel">'+(active().length?sortProjects(active().slice()).slice(0,6).map(projectRow).join(''):empty('A clean slate','Move a project into In Progress to begin.'))+'</div></section>'+
    '<section><div class="section-heading"><h2>Requires your attention</h2><button data-view="portfolio" data-action="needs-review">Review all '+i('arrow')+'</button></div><div class="panel"><div class="panel-body"><div class="attention-list">'+(attention().length?attention().slice(0,4).map(p=>'<div class="attention-item" data-project="'+e(p.id)+'"><span class="attention-icon">'+i(p.health==='Blocked'?'alert':'clock')+'</span><div><strong>'+e(p.name)+'</strong><small>'+e(p.health==='Blocked'?'Marked as blocked':p.status==='Inbox'?'Needs first review':p.health==='At risk'?'At risk · review next action':'Missing next action')+'</small></div></div>').join(''):empty('All clear','No projects currently require triage.'))+'</div><div class="insight-callout"><h4>'+i('sparkles')+' Your focus advantage</h4><p>Keep your three most important projects moving. Everything else stays safely organized for later.</p></div></div></div></section></div>'+
    '<div class="secondary-grid"><section class="panel"><div class="panel-body"><div class="panel-title"><h3>Portfolio composition</h3><span>By project type</span></div><div class="category-track">'+(categories.length?categories.map(v=>'<div class="category-row"><span>'+e(v.category)+'</span><span class="bar"><span style="width:'+Math.round(v.count/max*100)+'%"></span></span><span>'+v.count+'</span></div>').join(''):'<p class="small-muted">No projects available yet.</p>')+'</div></div></section>'+
    '<section class="panel"><div class="panel-body"><div class="panel-title"><h3>Latest repository activity</h3><span>Recent pushes</span></div>'+(recent.length?recent.map(p=>'<div class="activity-row" data-project="'+e(p.id)+'"><span class="activity-bullet"></span><div><strong>'+e(p.name)+'</strong><small>GitHub push · '+relativeDate(p.pushedAt)+'</small></div></div>').join(''):'<div class="small-muted">Sync GitHub to load repository activity.</div>')+'</div></section></div>';
}
function categoryCounts() {
  const map=new Map();
  for(const p of visible())map.set(p.category,(map.get(p.category)||0)+1);
  return [...map].map(([category,count])=>({category,count})).sort((a,b)=>b.count-a.count);
}
function portfolio() {
  const projects=filtered();
  const options=(items,current)=>items.map(x=>'<option value="'+e(x)+'"'+(x===current?' selected':'')+'>'+e(x)+'</option>').join('');
  return pageHeading('PROJECT DIRECTORY','All projects','Every repository and idea, connected to a next action.',newButton())+
    '<div class="toolbar"><input id="table-search" type="search" placeholder="Find a project, repository or milestone..." value="'+e(state.query)+'" aria-label="Filter projects">'+
    '<select id="status-filter" aria-label="Filter status">'+options(['All',...STATUSES],state.statusFilter)+'</select>'+
    '<select id="category-filter" aria-label="Filter category">'+options(['All',...CATEGORIES],state.categoryFilter)+'</select>'+
    '<select id="priority-filter" aria-label="Filter priority">'+options(['All',...PRIORITIES],state.priorityFilter)+'</select>'+
    '<select id="sort-filter" aria-label="Sort projects">'+options(['priority','recent','name','status'],state.sort)+'</select></div>'+
    '<section class="panel table-card"><table class="data-table"><thead><tr><th>Project</th><th>Status</th><th>Priority</th><th>Category</th><th>Last push</th><th>Next action</th></tr></thead><tbody>'+
    (projects.length?projects.map(p=>'<tr data-project="'+e(p.id)+'"><td><div class="project-cell">'+logo(p)+'<div><strong>'+e(p.name)+(p.private?' '+i('lock'):'')+'</strong><small>'+e(fullName(p))+'</small></div></div></td><td>'+tag(p.status)+'</td><td>'+prio(p.priority)+'</td><td><span class="type-pill">'+e(p.category)+'</span></td><td>'+relativeDate(p.pushedAt)+'</td><td>'+e((p.next||'Needs a next action').slice(0,70))+'</td></tr>').join(''):'<tr><td colspan="6">'+empty('Nothing matches','Try changing your filters or add a new project.')+'</td></tr>')+
    '</tbody></table></section><p class="small-muted" style="margin-top:15px">'+projects.length+' visible of '+state.projects.length+' saved projects. Changes are saved to this browser, not pushed to your repositories.</p>';
}
function board() {
  const list=filtered();
  return pageHeading('VISUAL WORKFLOW','Kanban board','Drag a card into another stage. The three-project limit protects your focus.',newButton())+
    '<div class="board-wrap"><div class="board-columns">'+STATUSES.filter(s=>s!=='Archived'||state.showArchived).map(s=>{
      const ps=list.filter(p=>p.status===s);
      return '<section class="board-column" data-drop-status="'+e(s)+'"><div class="board-col-head">'+tag(s)+'<span class="col-count">'+ps.length+'</span></div>'+
       (ps.length?ps.map(p=>'<div class="board-card" draggable="true" data-drag-id="'+e(p.id)+'" data-project="'+e(p.id)+'"><div class="card-head">'+logo(p)+prio(p.priority)+'</div><strong>'+e(p.name)+'</strong><p>'+e(p.next||'Set your next action')+'</p><div class="card-footer"><span class="small-muted">'+e(p.stage)+'</span><span class="small-muted">'+(p.private?'Private':'GitHub / local')+'</span></div></div>').join(''):'<div class="small-muted" style="text-align:center;padding:28px 8px">Drop a project here</div>')+'</section>';
    }).join('')+'</div></div>';
}
function roadmap() {
  const planned=filtered().filter(p=>p.target).sort((a,b)=>a.target.localeCompare(b.target));
  return pageHeading('WHAT IS NEXT','Project roadmap','Milestones and target dates across your portfolio.',newButton())+
    '<div class="panel"><div class="panel-header"><h3>Upcoming milestones</h3><span class="small-muted">'+planned.length+' scheduled</span></div>'+
    (planned.length?'<div class="table-card"><table class="roadmap-table"><thead><tr><th>Project / milestone</th><th>Target</th><th>Stage</th><th>Status</th></tr></thead><tbody>'+planned.map(p=>'<tr data-project="'+e(p.id)+'"><td><strong>'+e(p.name)+'</strong><br><span class="small-muted">'+e(p.milestone||'No milestone set')+'</span></td><td><span class="date-badge">'+i('calendar')+shortDate(p.target)+'</span></td><td>'+e(p.stage)+'</td><td>'+tag(p.status)+'</td></tr>').join('')+'</tbody></table></div>':empty('No target dates yet','Open any project, set a milestone and target date, and it will appear here.','<button class="btn btn-primary" data-view="portfolio">Browse projects</button>'))+'</div>'+
    '<div class="info-card" style="margin-top:19px">'+i('info')+' Your roadmap is a planning tool, not a promise of delivery. Only verified releases should be marked Live.</div>';
}
function insights() {
  const total=state.projects.length||1;
  const statuses=STATUSES.map(s=>({name:s,count:countStatus(s)})).filter(s=>s.count);
  const categorized=categoryCounts();
  const high=state.projects.filter(p=>['P0','P1'].includes(p.priority)).length;
  const withoutNext=state.projects.filter(p=>!p.next && ['In Progress','Review'].includes(p.status)).length;
  return pageHeading('PORTFOLIO INTELLIGENCE','Insights','A clearer picture of where your time and attention are going.',syncButton())+
    '<div class="stats-grid">'+[
      ['Completion rate',Math.round(countStatus('Live')/total*100)+'%','Projects marked live','mint'],
      ['High priority',high,'P0 and P1 projects','peach'],
      ['Needs next action',withoutNext,'Active work lacking clarity','lavender'],
      ['Public + local',state.projects.filter(p=>!p.private).length,'Visible in this browser','blue']
    ].map((v,index)=>'<div class="stat-card"><div class="stat-head"><span>'+e(v[0])+'</span><span class="stat-icon '+v[3]+'">'+i(['check','alert','clock','layers'][index])+'</span></div><div class="stat-value">'+v[1]+'</div><div class="stat-foot">'+e(v[2])+'</div></div>').join('')+'</div>'+
    '<div class="secondary-grid"><div class="panel"><div class="panel-body"><div class="panel-title"><h3>Distribution by status</h3><span>'+state.projects.length+' projects</span></div><div class="category-track">'+statuses.map(v=>'<div class="category-row"><span>'+e(v.name)+'</span><span class="bar"><span style="width:'+Math.round(v.count/total*100)+'%"></span></span><span>'+v.count+'</span></div>').join('')+'</div></div></div>'+
    '<div class="panel"><div class="panel-body"><div class="panel-title"><h3>Projects by category</h3><span>'+categorized.length+' categories</span></div><div class="category-track">'+categorized.map(v=>'<div class="category-row"><span>'+e(v.category)+'</span><span class="bar"><span style="width:'+Math.round(v.count/total*100)+'%"></span></span><span>'+v.count+'</span></div>').join('')+'</div></div></div></div>'+
    '<div class="panel" style="margin-top:22px"><div class="panel-body"><div class="panel-title"><h3>Portfolio health</h3><span>Based on your manual classifications</span></div>'+
    '<div class="flow">'+HEALTH.map(x=>'<div class="flow-card"><span>'+i(x==='Blocked'?'alert':x==='On track'?'check':'clock')+'</span><strong>'+e(x)+'</strong><div class="insight-number">'+state.projects.filter(p=>p.health===x).length+'</div></div>').join('')+'</div></div></div>';
}
function automation() {
  const last=state.lastSync?shortDate(state.lastSync):'Never';
  return pageHeading('SYNC & INTEGRATIONS','Automations','Keep new work from slipping through the cracks.',syncButton())+
   '<div class="main-grid"><div class="panel"><div class="panel-body"><div class="panel-title"><h3>GitHub public repository sync</h3>'+tag('Live')+'</div><p class="small-muted" style="line-height:1.9">The dashboard checks public GitHub repositories whenever you open it and approximately once per hour while the tab is open. It adds newly discovered repositories to Inbox without disturbing your project edits.</p>'+
   '<div class="detail-row"><span>GitHub owner</span><span>'+e(OWNER)+'</span></div><div class="detail-row"><span>Last browser sync</span><span>'+e(last)+'</span></div><div class="detail-row"><span>Repositories in this browser</span><span>'+state.projects.length+'</span></div><div class="detail-row"><span>Privacy</span><span>Public GitHub API · no stored token</span></div><div style="margin-top:24px"><button class="btn btn-primary" data-action="sync">'+i('refresh')+' Refresh now</button></div></div></div>'+
   '<div class="panel"><div class="panel-body"><div class="panel-title"><h3>Private portfolio automation</h3><span class="tag planned">GitHub Actions</span></div><p class="small-muted" style="line-height:1.9">Your private Sites repository runs a separate hourly GitHub Action that maintains the full portfolio register and private triage issues. Private discovery requires the read-only secret configured in its workflow settings.</p>'+
   '<div class="detail-row"><span>Private master register</span><span><a class="external" href="https://github.com/Sean-steve/Sites/issues/7" target="_blank" rel="noopener noreferrer">Open '+i('external')+'</a></span></div><div class="detail-row"><span>Workflow status</span><span>Check GitHub Actions run history</span></div><div class="detail-row"><span>Private repo discovery</span><span>Token setup required</span></div><div style="margin-top:23px"><a class="btn" target="_blank" rel="noopener noreferrer" href="https://github.com/Sean-steve/Sites/actions/workflows/portfolio-sync.yml">'+i('external')+' View workflow</a> <a class="btn" target="_blank" rel="noopener noreferrer" href="https://github.com/Sean-steve/Sites/blob/main/portfolio/README.md">Setup guide</a></div></div></div></div>'+
   '<div class="thin-divider"></div><div class="section-heading"><h2>How the two systems work together</h2></div>'+
   '<div class="flow"><div class="flow-card"><span>'+i('github')+'</span><strong>1. New repository</strong><p>Create or push a repository to GitHub under your account.</p></div><span class="flow-arrow">'+i('arrow')+'</span><div class="flow-card"><span>'+i('repeat')+'</span><strong>2. Sync detects it</strong><p>Public repos appear here. The private workflow registers private issues.</p></div><span class="flow-arrow">'+i('arrow')+'</span><div class="flow-card"><span>'+i('check')+'</span><strong>3. Review and prioritize</strong><p>Assign status, next action and milestone without losing track.</p></div></div>';
}
function settings() {
  return pageHeading('PERSONALIZATION','Settings','Control how your portfolio is organized and stored.', '')+
   '<div class="panel"><div class="panel-body"><div class="panel-title"><h3>Data & privacy</h3><span>Local-first</span></div>'+
   '<div class="settings-row"><div><strong>Import a portfolio JSON file</strong><p>Import a private GitHub register or an exported dashboard backup. Nothing is uploaded.</p></div><button class="btn" data-action="import">'+i('upload')+' Import JSON</button></div>'+
   '<div class="settings-row"><div><strong>Export all project records</strong><p>Back up your statuses, notes and milestones. This file may contain private details.</p></div><button class="btn" data-action="export">'+i('download')+' Export</button></div>'+
   '<div class="settings-row"><div><strong>Show archived projects</strong><p>Include archived projects in your tables and boards.</p></div><label><input id="archived-toggle" type="checkbox"'+(state.showArchived?' checked':'')+' aria-label="Show archived projects"> Include</label></div>'+
   '<div class="settings-row"><div><strong>Open the private GitHub hub</strong><p>Master portfolio inventory and private automated triage issues.</p></div><a class="btn" target="_blank" rel="noopener noreferrer" href="https://github.com/Sean-steve/Sites/issues/7">'+i('external')+' Open tracker</a></div>'+
   '<div class="settings-row"><div><strong>Local-only information</strong><p>Data is stored on this browser, not synchronized to other computers or cloud accounts.</p></div><span class="tag paused">Browser only</span></div></div></div>'+
   '<div class="alert-strip" style="margin-top:20px">'+i('lock')+'<div><strong>Privacy first.</strong> This application is hosted from a public repository. Private portfolio files are imported and processed only in your browser. On a shared device, exporting a backup and clearing browser storage is recommended.</div></div>';
}
function render() {
  const pages={overview,portfolio,board,roadmap,insights,automation,settings};
  const names={overview:'Overview',portfolio:'All projects',board:'Kanban board',roadmap:'Roadmap',insights:'Insights',automation:'Automations',settings:'Settings'};
  document.getElementById('content').innerHTML=(pages[state.view]||overview)();
  document.getElementById('current-page').textContent=names[state.view]||'Overview';
  document.querySelectorAll('[data-view]').forEach(el=>{if(el.classList.contains('nav-item'))el.classList.toggle('active',el.dataset.view===state.view);});
  hydrateIcons();
  persist();
}
function hydrateIcons() {
  document.querySelectorAll('[data-icon]').forEach(n=>{n.innerHTML=i(n.dataset.icon);});
}
function optionList(items,current) {return items.map(v=>'<option'+(current===v?' selected':'')+'>'+e(v)+'</option>').join('');}
function field(label,name,value,kind,options,extra) {
  let inp;
  if(kind==='select')inp='<select name="'+name+'">'+optionList(options,value)+'</select>';
  else if(kind==='textarea')inp='<textarea name="'+name+'" maxlength="5000" placeholder="Add useful notes...">'+e(value)+'</textarea>';
  else inp='<input name="'+name+'" type="'+(kind||'text')+'" value="'+e(value||'')+'" '+(kind==='date'?'':'maxlength="320"')+' '+(extra||'')+'>';
  return '<div class="field"><label for="f-'+name+'">'+e(label)+'</label>'+inp+'</div>';
}
function drawer(project) {
  const p=project;const isLocal=!p.full_name;
  const external=p.repoUrl&&safeUrl(p.repoUrl)?'<a class="btn" target="_blank" rel="noopener noreferrer" href="'+e(p.repoUrl)+'">'+i('github')+' Repository '+i('external')+'</a>':'';
  const issue=p.tracker&&safeUrl(p.tracker)?'<a class="btn" target="_blank" rel="noopener noreferrer" href="'+e(p.tracker)+'">'+i('list')+' Tracking issue '+i('external')+'</a>':'';
  document.getElementById('overlay-root').innerHTML='<div class="overlay"><section class="drawer" role="dialog" aria-modal="true" aria-label="Edit project"><div class="drawer-head"><div><div class="eyebrow">PROJECT DETAIL</div><h2>Edit '+e(p.name)+'</h2><p>'+e(fullName(p))+'</p></div><button class="icon-btn" data-action="close" aria-label="Close">'+i('x')+'</button></div><div class="drawer-content"><div class="drawer-topline">'+logo(p)+'<div><strong>'+e(p.name)+'</strong><small>'+(p.private?'Private repository':isLocal?'Local project · no repository':'Public repository')+'</small></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 23px">'+external+issue+'</div><form id="edit-form" data-id="'+e(p.id)+'"><div class="form-grid">'+
    field('Project name','name',p.name)+field('Status','status',p.status,'select',STATUSES)+
    field('Priority','priority',p.priority,'select',PRIORITIES)+field('Health','health',p.health,'select',HEALTH)+
    field('Stage','stage',p.stage,'select',STAGES)+field('Category','category',p.category,'select',CATEGORIES)+
    field('Target date','target',p.target,'date')+field('Milestone / deliverable','milestone',p.milestone)+
    '<div class="field full">'+field('Next concrete action','next',p.next)+'</div>'+
    '<div class="field full">'+field('Description','description',p.description,'textarea')+'</div>'+
    '<div class="field full">'+field('Notes','notes',p.notes,'textarea')+'</div></div>'+
    '<button class="btn btn-primary" type="submit">'+i('check')+' Save project updates</button>'+
    (isLocal?'<button class="btn btn-danger" type="button" data-action="delete-local" data-id="'+e(p.id)+'" style="margin-left:8px">'+i('trash')+' Remove</button>':'')+
    '</form><p class="small-muted" style="line-height:1.8;margin-top:20px">Last GitHub push: '+relativeDate(p.pushedAt)+'. Changes here are local and do not modify the GitHub repository or its issues.</p></div></section></div>';
  document.getElementById('edit-form').querySelector('[name="name"]').focus();
}
function newModal() {
  document.getElementById('overlay-root').innerHTML='<div class="overlay modal-center"><div class="modal" role="dialog" aria-modal="true" aria-label="Add a project"><div class="drawer-head"><div><div class="eyebrow">NEW PROJECT</div><h2>Make room for a new idea.</h2><p>Start tracking work before it becomes a GitHub repo.</p></div><button class="icon-btn" data-action="close" aria-label="Close">'+i('x')+'</button></div><div class="drawer-content"><form id="new-form"><div class="field"><label>Project name</label><input name="name" required maxlength="100" autofocus placeholder="e.g. Garage OS"></div><div class="field"><label>What are you building?</label><textarea name="description" maxlength="1000" placeholder="A short project description..."></textarea></div><div class="form-grid">'+field('Category','category','SaaS / Product','select',CATEGORIES)+field('Priority','priority','P3','select',PRIORITIES)+'</div><div style="display:flex;justify-content:flex-end;gap:9px"><button type="button" class="btn" data-action="close">Cancel</button><button class="btn btn-primary" type="submit">'+i('plus')+' Create project</button></div></form></div></div></div>';
  document.querySelector('#new-form [name="name"]').focus();
}
function closeOverlay(){document.getElementById('overlay-root').innerHTML='';}
function goto(view) {
  if(!['overview','portfolio','board','roadmap','insights','automation','settings'].includes(view))return;
  state.view=view;state.query='';state.statusFilter='All';state.categoryFilter='All';state.priorityFilter='All';
  document.getElementById('global-search').value='';
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobile-shade').classList.remove('show');
  render();document.getElementById('content').focus();
}
async function syncGithub(silent=false) {
  if(state.refreshing)return;
  state.refreshing=true;
  const btn=document.getElementById('sync-btn');btn.classList.add('spinner');
  try {
    const repos=await fetchPublicRepos();
    const merge=mergePublicRepos(state.projects,repos);
    state.projects=merge.projects;
    state.lastSync=new Date().toISOString();
    render();
    if(!silent)toast(merge.newCount?'Added '+merge.newCount+' new GitHub repos to Inbox.':'Sync complete. Your portfolio is up to date.');
  } catch(err) {
    if(!silent)toast(err.message||'Could not connect to GitHub.');
    document.getElementById('footer-sync').textContent='Offline or rate-limited · cached data available';
  } finally {state.refreshing=false;btn.classList.remove('spinner');}
}
function exportProjects() {
  const raw=JSON.stringify({exportedAt:new Date().toISOString(),owner:OWNER,projects:state.projects},null,2);
  const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='project-command-center-backup.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Portfolio backup exported.');
}
async function importProjects(file) {
  if(!file)return;
  if(file.size>5*1024*1024)throw new Error('Please import a JSON file smaller than 5 MB.');
  const text=await file.text();
  const obj=JSON.parse(text);
  const imported=mergeImported(state.projects,obj);
  if(obj.projects&&obj.projects.some(p=>p.private)||obj.repositories&&obj.repositories.some(p=>p.private)) {
    if(!confirm('This file includes private repository metadata. It will be saved to THIS browser only. Do not use this on a shared computer. Continue?'))return;
  }
  state.projects=imported.projects;
  render();
  toast('Imported '+imported.newCount+' new project records.');
}
function changeStatus(project,target) {
  if(!project||!STATUSES.includes(target)||project.status===target)return;
  if(target==='In Progress'&&active().length>=3){toast('Focus limit: maximum three projects In Progress. Pause one first.');return;}
  project.status=target;project.updatedAt=new Date().toISOString();render();toast(project.name+' moved to '+target+'.');
}
function onClick(event) {
  if(event.target.matches('.overlay')){closeOverlay();return;}
  const el=event.target.closest('[data-action],[data-view],[data-project]');
  if(!el)return;
  if(el.dataset.action) {
    const act=el.dataset.action;
    if(act==='new')newModal();
    else if(act==='close')closeOverlay();
    else if(act==='sync')syncGithub();
    else if(act==='export')exportProjects();
    else if(act==='import')document.getElementById('import-file').click();
    else if(act==='needs-review'){goto('portfolio');state.statusFilter='Inbox';render();}
    else if(act==='delete-local'){
      const p=getProject(el.dataset.id);
      if(p&&!p.full_name&&confirm('Remove '+p.name+' from this browser?')){state.projects=state.projects.filter(x=>x.id!==p.id);closeOverlay();render();toast('Local project removed.');}
    }
    return;
  }
  if(el.dataset.view){goto(el.dataset.view);return;}
  if(el.dataset.project&&event.target.closest('a')===null) {
    const p=getProject(el.dataset.project);if(p)drawer(p);
  }
}
function onSubmit(event) {
  if(event.target.id==='new-form'){
    event.preventDefault();const f=new FormData(event.target);
    const name=String(f.get('name')||'').trim();if(!name)return;
    const p=normalize({name,description:String(f.get('description')||''),category:String(f.get('category')||'Other'),priority:String(f.get('priority')||'P3'),status:'Inbox',source:'local'},true);
    state.projects.unshift(p);closeOverlay();goto('portfolio');toast(name+' added to Inbox.');
  }
  if(event.target.id==='edit-form'){
    event.preventDefault();const p=getProject(event.target.dataset.id);if(!p)return;
    const f=new FormData(event.target),status=String(f.get('status')||p.status);
    if(status==='In Progress'&&p.status!=='In Progress'&&active().length>=3){toast('Focus limit: pause an active project before starting another.');return;}
    for(const k of ['name','status','priority','health','stage','category','target','milestone','next','description','notes']){
      let val=String(f.get(k)||'').trim();
      if(k==='name'&&!val){toast('Project name is required.');return;}
      if(k==='status'&&!STATUSES.includes(val))continue;
      if(k==='priority'&&!PRIORITIES.includes(val))continue;
      if(k==='health'&&!HEALTH.includes(val))continue;
      if(k==='stage'&&!STAGES.includes(val))continue;
      if(k==='category'&&!CATEGORIES.includes(val))continue;
      p[k]=val.slice(0,k==='notes'?5000:1000);
    }
    p.manual=true;p.updatedAt=new Date().toISOString();closeOverlay();render();toast(p.name+' updated.');
  }
}
function onInput(event) {
  if(event.target.id==='table-search'){
    state.query=event.target.value;const offset=event.target.selectionStart;render();
    const input=document.getElementById('table-search');if(input){input.focus();input.setSelectionRange(offset,offset);}
  }
  if(event.target.id==='global-search'){
    state.view='portfolio';state.query=event.target.value;state.statusFilter='All';render();
  }
}
function onChange(event){
  const t=event.target;
  if(t.id==='status-filter'){state.statusFilter=t.value;render();}
  if(t.id==='category-filter'){state.categoryFilter=t.value;render();}
  if(t.id==='priority-filter'){state.priorityFilter=t.value;render();}
  if(t.id==='sort-filter'){state.sort=t.value;render();}
  if(t.id==='archived-toggle'){state.showArchived=t.checked;writeJSON(PREF_KEY,{showArchived:state.showArchived});render();}
  if(t.id==='import-file'){
    importProjects(t.files[0]).catch(err=>toast(err.message||'Import failed.')).finally(()=>{t.value='';});
  }
}
let draggedId='';
document.addEventListener('dragstart',ev=>{const el=ev.target.closest('[data-drag-id]');if(el){draggedId=el.dataset.dragId;ev.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',ev=>{const col=ev.target.closest('[data-drop-status]');if(col){ev.preventDefault();col.classList.add('dragover');}});
document.addEventListener('dragleave',ev=>{const col=ev.target.closest('[data-drop-status]');if(col&&!col.contains(ev.relatedTarget))col.classList.remove('dragover');});
document.addEventListener('drop',ev=>{const col=ev.target.closest('[data-drop-status]');if(col){ev.preventDefault();const p=getProject(draggedId);changeStatus(p,col.dataset.dropStatus);draggedId='';document.querySelectorAll('.dragover').forEach(x=>x.classList.remove('dragover'));}});
document.addEventListener('click',onClick);
document.addEventListener('submit',onSubmit);
document.addEventListener('input',onInput);
document.addEventListener('change',onChange);
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape')closeOverlay();
  if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='k'){
    ev.preventDefault();goto('portfolio');const inp=document.getElementById('table-search');if(inp)inp.focus();
  }
});
document.getElementById('menu-toggle').addEventListener('click',()=>{document.getElementById('sidebar').classList.toggle('open');document.getElementById('mobile-shade').classList.toggle('show');});
document.getElementById('mobile-shade').addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('open');document.getElementById('mobile-shade').classList.remove('show');});
hydrateIcons();render();
syncGithub(true);
setInterval(()=>syncGithub(true),60*60*1000);
