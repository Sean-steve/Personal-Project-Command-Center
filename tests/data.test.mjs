import test from 'node:test';
import assert from 'node:assert/strict';
import { initialData, mergePublicRepos, mergeImported, normalize, seed } from '../data.js';

function githubRepo(id, name, privateRepo=false, owner='Sean-steve') {
  return {
    id, name, full_name:owner+'/'+name, owner:{login:owner},
    html_url:'https://github.com/'+owner+'/'+name,
    private:privateRepo, archived:false, pushed_at:'2026-10-08T07:00:00Z'
  };
}

test('initial seed includes the six planned public checkpoint projects', () => {
  const original=global.localStorage;
  global.localStorage={getItem:()=>null};
  try {
    const data=initialData();
    assert.equal(data.projects.length,7);
    assert.equal(data.projects.filter(p=>p.status==='In Progress').length,3);
    assert.equal(seed.length,7);
    assert.equal(data.projects.find(p=>p.name==='Finance OS').status,'In Progress');
    assert.equal(data.projects.find(p=>p.name==='SeanCore').status,'Planned');
  } finally {global.localStorage=original;}
});

test('live GitHub discovery adds only public repositories owned by the configured account', () => {
  const originals=[normalize({id:1,full_name:'Sean-steve/sample',name:'Sample',status:'In Progress',next:'Keep existing priority'})];
  const repos=[githubRepo(1,'sample'),githubRepo(2,'new-public'),githubRepo(3,'secret',true),githubRepo(4,'outsider',false,'somebody-else')];
  const result=mergePublicRepos(originals,repos);
  assert.equal(result.newCount,1);
  assert.equal(result.projects.length,2);
  assert.equal(result.projects[0].next,'Keep existing priority');
  assert.equal(result.projects[0].status,'In Progress');
  assert.equal(result.projects[1].status,'Inbox');
  assert.equal(mergePublicRepos(result.projects,repos).newCount,0);
});

test('private register import does not overwrite manually maintained fields', () => {
  const first=normalize({id:9,full_name:'Sean-steve/one',name:'Custom name',status:'Planned',priority:'P1'});
  const result=mergeImported([first],{repositories:[
    {id:9,full_name:'Sean-steve/one',private:true},
    {id:10,full_name:'Sean-steve/new-private',private:true}
  ]});
  assert.equal(result.newCount,1);
  assert.equal(result.projects[0].name,'Custom name');
  assert.equal(result.projects[0].priority,'P1');
  assert.equal(result.projects[0].private,true);
  assert.equal(result.projects[1].private,true);
  assert.equal(mergeImported(result.projects,{repositories:[{id:10,full_name:'Sean-steve/new-private'}]}).newCount,0);
});

test('malformed registry rejects safely', () => {
  assert.throws(()=>mergeImported([],{}),/Expected/);
  assert.throws(()=>mergeImported([],new Array(5001).fill({id:1})),/too many/);
});

test('invalid imported statuses default to Inbox', () => {
  const p=normalize({name:'Something',status:'arbitrary',priority:'ultra',health:'danger'});
  assert.equal(p.status,'Inbox');
  assert.equal(p.priority,'P3');
  assert.equal(p.health,'Unknown');
});

test('imports owner provided aliases and related repositories without resetting project status',()=>{
 const first=normalize({id:11,full_name:'Sean-steve/Sage-Auto',name:'Sage Auto',status:'In Progress',next:'Keep'});
 const body={projects:[{id:11,full_name:'Sean-steve/Sage-Auto',aliases:['Carhire Business','Sage Auto v2'],relatedRepositories:['Sean-steve/Sage-Auto-v2'],status:'Planned',next:'Do not override'}]};
 const p=mergeImported([first],body).projects[0];
 assert.equal(p.status,'In Progress');
 assert.equal(p.next,'Keep');
 assert.deepEqual(p.aliases,['Carhire Business','Sage Auto v2']);
 assert.deepEqual(p.relatedRepositories,['Sean-steve/Sage-Auto-v2']);
 assert.equal(mergeImported([p],body).projects[0].aliases.length,2);
});
test('rejects malformed related repository names when importing',()=>{
 const n=normalize({name:'Unlinked',aliases:['A'.repeat(150),'Same','Same'],relatedRepositories:['nonsense','Sean-steve/valid']});
 assert.equal(n.aliases.length,2);
 assert.equal(n.aliases[0].length,100);
 assert.deepEqual(n.relatedRepositories,['Sean-steve/valid']);
});
