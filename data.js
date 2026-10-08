// Data layer for the public, local-first Project Command Center.
// NO credentials, private repository names, or private portfolio content are bundled.
export const OWNER = 'Sean-steve';
export const STORAGE_KEY = 'personal-command-center.projects.v1';
export const PREF_KEY = 'personal-command-center.preferences.v1';
export const STATUSES = ['Inbox', 'Planned', 'In Progress', 'Review', 'Live', 'Maintenance', 'Paused', 'Archived'];
export const STAGES = ['Discovery', 'Architecture', 'Design', 'Development', 'Integration', 'QA', 'Deployment', 'Maintenance'];
export const CATEGORIES = ['SaaS / Product', 'Client Project', 'Website', 'AI / Automation', 'Foundation', 'Prototype', 'Library / Tool', 'Other'];
export const PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'None'];
export const HEALTH = ['Unknown', 'On track', 'At risk', 'Blocked'];
export const seed = [
  {id: 1402873453, full_name:'Sean-steve/Sage-Auto', name:'Sage Auto', category:'SaaS / Product', status:'In Progress', priority:'P1', stage:'Integration', health:'At risk', next:'Verify rental handover and return lifecycle', milestone:'Operational flows and owner settlements', tracker:'https://github.com/Sean-steve/Sage-Auto/issues/10'},
  {id: 1406023770, full_name:'Sean-steve/Deetoo-Rush', name:'Deetoo Rush', category:'SaaS / Product', status:'In Progress', priority:'P1', stage:'Integration', health:'At risk', next:'Stabilize PostgreSQL and local branch integration', milestone:'Multi-sided platform validation', tracker:'https://github.com/Sean-steve/Deetoo-Rush/issues/24'},
  {id: 1405417819, full_name:'Sean-steve/seancore', name:'SeanCore', category:'Client Project', status:'In Progress', priority:'P2', stage:'Design', health:'On track', next:'Verify the published website and refine portfolio content', milestone:'Website release', tracker:'https://github.com/Sean-steve/seancore/issues/1'},
  {id: 409879012, full_name:'Sean-steve/MentalHealth', name:'Mind OS', category:'SaaS / Product', status:'Planned', priority:'P2', stage:'Development', health:'At risk', next:'Reconcile Sprint 21 runtime and Sprint 22–23 work', milestone:'Baseline regression and integration', tracker:'https://github.com/Sean-steve/MentalHealth/issues/1'},
  {id: 1400809240, full_name:'Sean-steve/Pet-os', name:'Pet OS', category:'SaaS / Product', status:'Planned', priority:'P2', stage:'Development', health:'On track', next:'Prepare and scope Sprint 29', milestone:'Sprint 29', tracker:'https://github.com/Sean-steve/Pet-os/issues/6'},
  {id: 779199512, full_name:'Sean-steve/kids4future', name:'Kids4Future', category:'Foundation', status:'Planned', priority:'P3', stage:'Discovery', health:'Unknown', next:'Audit website and plan foundation content', milestone:'Website modernization', tracker:'https://github.com/Sean-steve/kids4future/issues/1'}
];

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) { return fallback; }
}
export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { return false; }
}
export function cleanText(value, max=320) {
  return String(value == null ? '' : value).slice(0, max).trim();
}
export function initialData() {
  const saved = readJSON(STORAGE_KEY, null);
  if (saved && Array.isArray(saved.projects)) return saved;
  return {version:1, lastSync:null, projects:seed.map(p=>normalize({...p, private:false, source:'seed', repoUrl:'https://github.com/'+p.full_name}, true))};
}
export function normalize(raw, trusted=false) {
  const fullname = cleanText(raw.full_name || '', 180);
  const id = String(raw.id == null ? ('local-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)) : raw.id);
  const display = cleanText(raw.name || (fullname ? fullname.split('/').pop() : 'Untitled project'), 100);
  const sourceUrl = 'https://github.com/' + fullname;
  return {
    id, name:display, full_name:fullname,
    repoUrl: fullname && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullname) ? sourceUrl : '',
    source: cleanText(raw.source || (fullname ? 'github' : 'local'), 30),
    private:Boolean(raw.private),
    status: STATUSES.includes(raw.status) ? raw.status : 'Inbox',
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'P3',
    stage: STAGES.includes(raw.stage) ? raw.stage : 'Discovery',
    health: HEALTH.includes(raw.health) ? raw.health : 'Unknown',
    category: CATEGORIES.includes(raw.category) ? raw.category : 'Other',
    next:cleanText(raw.next, 320),
    milestone:cleanText(raw.milestone, 200),
    description:cleanText(raw.description, 1000),
    notes:cleanText(raw.notes, 5000),
    target: /^\d{4}-\d{2}-\d{2}$/.test(raw.target || '') ? raw.target : '',
    pushedAt:raw.pushedAt || null, createdAt:raw.createdAt || null,
    firstSeen:raw.firstSeen || new Date().toISOString(),
    tracker:cleanText(raw.tracker, 300),
    updatedAt:raw.updatedAt || new Date().toISOString(),
    manual:trusted || Boolean(raw.manual)
  };
}
function guessCategory(repo) {
  const text=(repo.name + ' ' + (repo.description||'')).toLowerCase();
  if(/(template|component|library|icon|drawer|test)/.test(text)) return 'Library / Tool';
  if(/(clinic|gynae|construction|solar|roofing|landscap|interior|catering|portfolio|seancore|dantree|school)/.test(text)) return 'Client Project';
  if(/(ai-|generator|agent|auto-spec)/.test(text)) return 'AI / Automation';
  if(/(website|site|homepage)/.test(text)) return 'Website';
  return 'Other';
}
export function mergePublicRepos(projects, repos) {
  const byId=new Map(projects.map(p=>[String(p.id),p]));
  const byFull=new Map(projects.filter(p=>p.full_name).map(p=>[p.full_name.toLowerCase(),p]));
  const updated=projects.slice();
  let count=0;
  for(const repo of repos) {
    if(!repo || !repo.id || !repo.full_name || repo.owner?.login?.toLowerCase() !== OWNER.toLowerCase() || repo.private) continue;
    const project=byId.get(String(repo.id)) || byFull.get(repo.full_name.toLowerCase());
    if(project) {
      // Preserve manually managed fields and private statuses.
      project.full_name=repo.full_name;
      project.repoUrl=repo.html_url;
      project.pushedAt=repo.pushed_at || project.pushedAt;
      project.createdAt=repo.created_at || project.createdAt;
      if(!project.description && repo.description) project.description=cleanText(repo.description,1000);
      if(repo.archived && project.status==='Inbox') project.status='Archived';
    } else {
      const newRecord=normalize({
        id:repo.id, name:repo.name, full_name:repo.full_name,
        private:false, source:'github', status:repo.archived?'Archived':'Inbox',
        priority:'P3', category:guessCategory(repo),
        stage:'Discovery', health:'Unknown',
        description:repo.description || '',
        pushedAt:repo.pushed_at, createdAt:repo.created_at,
        firstSeen:new Date().toISOString()
      });
      updated.push(newRecord);
      byId.set(String(repo.id),newRecord);
      count++;
    }
  }
  return {projects:updated,newCount:count};
}
export async function fetchPublicRepos() {
  const all=[];
  for(let page=1;page<=12;page++) {
    const url='https://api.github.com/users/'+encodeURIComponent(OWNER)+'/repos?type=owner&sort=updated&per_page=100&page='+page;
    const res=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!res.ok) throw new Error(res.status===403?'GitHub API rate limit reached. Try again later.':'GitHub API returned '+res.status);
    const rows=await res.json();
    if(!Array.isArray(rows)) throw new Error('Unexpected GitHub response');
    all.push(...rows);
    if(rows.length<100) break;
  }
  return all.filter(repo=>!repo.private);
}
export function mergeImported(projects, imported) {
  const records=Array.isArray(imported) ? imported : imported && Array.isArray(imported.repositories) ? imported.repositories :
    imported && Array.isArray(imported.projects) ? imported.projects : null;
  if(!records) throw new Error('Expected a JSON array or a portfolio/repositories.json file.');
  if(records.length>5000) throw new Error('File contains too many projects.');
  const updated=projects.slice(), byId=new Map(projects.map(p=>[String(p.id),p]));
  const byFull=new Map(projects.filter(p=>p.full_name).map(p=>[p.full_name.toLowerCase(),p]));
  let count=0;
  for(const raw of records) {
    if(!raw || typeof raw !== 'object') continue;
    const name=cleanText(raw.full_name,180);
    const found=(raw.id!=null?byId.get(String(raw.id)):null) || (name?byFull.get(name.toLowerCase()):null);
    if(found) {
      // Never reset fields already edited in the dashboard.
      if(raw.private) found.private=true;
      if(!found.repoUrl && name) found.repoUrl='https://github.com/'+name;
    } else {
      const record=normalize({
        ...raw,source: name?'import':'local',
        status: raw.status || 'Inbox',priority: raw.priority || 'P3',
        firstSeen:new Date().toISOString()
      });
      updated.push(record);
      byId.set(record.id,record);
      if(name) byFull.set(name.toLowerCase(),record);
      count++;
    }
  }
  return {projects:updated,newCount:count};
}