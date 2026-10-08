import test from 'node:test';
import assert from 'node:assert/strict';
import {
 extractChats,analyzeConversations,reconcileIdea,mergeDiscoveries,safeSummary,readChatFile
} from '../discovery.js';

const userMessage=(text,t=1)=>({author:{role:'user'},create_time:t,content:{parts:[text]}});
const assistantMessage=text=>({author:{role:'assistant'},content:{parts:[text]}});
const chat=(id,title,lines)=>({id,title,mapping:Object.fromEntries(lines.map((s,i)=>['node'+i,{message:userMessage(s,i+1)}]))});
const project=(id,name,slug=name)=>({id:String(id),name,full_name:'Sean-steve/'+slug});

test('reads official export mapping and ignores assistant promises',()=>{
 const parsed=extractChats([{
  id:'001',title:'Garage App Concept',
  mapping:{z:{message:userMessage('Include emergency towing',1)},
   y:{message:assistantMessage('This is fully implemented.')},
   x:{message:userMessage('Build the garage app',2)}}
 }]);
 assert.equal(parsed.length,1);
 assert.equal(parsed[0].messages.length,2);
 assert.equal(parsed[0].messages[0],'Include emergency towing');
});
test('accepts flat-message conversation exports',()=>{
 const raw=[{id:'abc',title:'Pet Care Platform Idea',messages:[
  {role:'user',content:{parts:['Build pet care app']}},
  {role:'assistant',content:{parts:['Done!']}}
 ]}];
 const result=analyzeConversations(raw,[project(1,'Pet OS','Pet-os')]);
 assert.equal(result.ideas.length,1);
 assert.equal(result.ideas[0].match.status,'linked');
});
test('links Sage Auto but does not claim any features are implemented',()=>{
 const res=analyzeConversations([chat('car','Carhire Business Overview',[
  'I want to build a multi-tenant car hire platform.',
  'Add contract and handover workflow'])],[project(123,'Sage Auto','Sage-Auto')]);
 assert.equal(res.ideas.length,1);
 assert.equal(res.ideas[0].match.status,'linked');
 assert.match(res.ideas[0].match.evidence,/NOT verified/);
 assert.ok(res.ideas[0].requirements.every(r=>r.verification==='unverified'));
});
test('finds potentially unregistered Garage OS idea',()=>{
 const result=analyzeConversations([chat('garage','Garage App Concept',[
  'Build a garage app with SOS, roadside assistance and towing'])],[project(10,'Sage Auto','Sage-Auto')]);
 assert.equal(result.ideas[0].match.status,'missing');
});
test('does not include non-project personal conversations',()=>{
 const result=analyzeConversations([chat('pain','Pregnancy lower abdomen pain',[
  'Some pain in the abdomen at 38 weeks pregnant'])],[]);
 assert.equal(result.ideas.length,0);
});
test('redacts email, token and links from captured requirements',()=>{
 const summary=safeSummary('Send email john@example.com, key sk-ABCDEFGHIJKLMNO1234567 to https://example.com');
 assert.ok(!summary.includes('john@example.com'));
 assert.ok(!summary.includes('sk-ABCDEFGHIJKLMNO'));
 assert.ok(!summary.includes('example.com'));
});
test('reimports are idempotent and preserve manual review statuses',()=>{
 const incoming=analyzeConversations([chat('garage','Garage App Concept',['Build a towing application'])],[]).ideas;
 const first=mergeDiscoveries([],incoming);
 first.ideas[0].status='dismissed';
 const second=mergeDiscoveries(first.ideas,incoming);
 assert.equal(first.added,1);
 assert.equal(second.added,0);
 assert.equal(second.ideas.length,1);
 assert.equal(second.ideas[0].status,'dismissed');
});
test('unsupported export rejected',()=>{
 assert.throws(()=>extractChats({messages:[]}),/Unsupported export/);
});
test('ZIP or JSON file parser rejects irrelevant file type',async()=>{
 await assert.rejects(()=>readChatFile({name:'notes.txt',size:2,text:async()=>''}),/Choose conversations/);
});
