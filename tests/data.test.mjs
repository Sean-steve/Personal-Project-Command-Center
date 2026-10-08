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
    assert.equal(data.projects.length,6);
    assert.equal(data.projects.filter(p=>p.status==='In Progress').length,3);
    assert.equal(seed.length,6);
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
