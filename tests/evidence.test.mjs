import test from 'node:test';
import assert from 'node:assert/strict';
import {terms,scoreEvidence} from '../evidence.js';

test('scores related public GitHub activity as candidates only',()=>{
 const score=scoreEvidence('Add contract and handover workflow','Fix rental contract and handover UI');
 assert.ok(score>0);
});
test('does not match generic unrelated activity',()=>{
 assert.equal(scoreEvidence('Add contract handover workflows','Fix Redis cache invalidation'),0);
});
test('search terms discard empty and generic words',()=>{
 assert.ok(!terms('Build the system with these changes').includes('system'));
});
