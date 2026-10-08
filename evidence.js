/* Suggested public GitHub evidence is not proof of implementation. */
const ignore=new Set('with from that this have want need build create feature system project implementation changes users user please these those currently would should there'.split(' '));
export function terms(text){
 return [...new Set(String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(s=>s.length>3&&!ignore.has(s)))];
}
export function scoreEvidence(query,body){
 const termsA=terms(query),termsB=new Set(terms(body));
 if(!termsA.length)return 0;
 const hits=termsA.filter(t=>termsB.has(t)).length;
 return hits<Math.min(2,termsA.length)?0:Math.round(hits*100/termsA.length);
}
export async function findPublicEvidence(project,requirement){
 if(!project||project.private||!/^[-\w.]+\/[-\w.]+$/.test(project.full_name||''))throw Error('Public GitHub repo required.');
 const base='https://api.github.com/repos/'+project.full_name,found=[],errors=[];
 for(const [kind,path] of [['issue','/issues?state=all&per_page=100'],['commit','/commits?per_page=60']]){
  try{
   const res=await fetch(base+path,{headers:{Accept:'application/vnd.github+json'}});
   if(!res.ok)throw Error('GitHub API '+res.status);
   const rows=await res.json();if(!Array.isArray(rows))throw Error('Unexpected GitHub response');
   for(const row of rows){
    const title=kind==='commit'?row.commit?.message:row.title;
    const score=scoreEvidence(requirement,String(title||'')+' '+(kind==='issue'?String(row.body||'').slice(0,1500):''));
    if(score<30||!String(row.html_url||'').startsWith('https://github.com/'))continue;
    found.push({kind:kind==='issue'&&row.pull_request?'pull request':kind,title:String(title||'').slice(0,150),url:row.html_url,score});
   }
  }catch(err){errors.push(kind+': '+err.message);}
 }
 return {candidates:found.sort((a,b)=>b.score-a.score).slice(0,8),errors};
}