import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig} from '../cloud.js';

test('accepts a dedicated Supabase URL with a publishable key',()=>{
 const result=validateConfig({url:'https://unique-example.supabase.co',publishableKey:'sb_publishable_example_for_ci'});
 assert.equal(result.url,'https://unique-example.supabase.co');
});
test('blocks service-role and secret keys in browser config',()=>{
 assert.throws(()=>validateConfig({url:'https://unique-example.supabase.co',publishableKey:'sb_secret_sensitive'}),/Never/);
 assert.throws(()=>validateConfig({url:'https://unique-example.supabase.co',publishableKey:'service_role'}),/Never/);
});
test('rejects unsafe HTTP or non-Supabase auth endpoints',()=>{
 assert.throws(()=>validateConfig({url:'http://evil.example',publishableKey:'sb_publishable_x'}),/official/);
 assert.throws(()=>validateConfig({url:'https://malicious.example.com',publishableKey:'sb_publishable_x'}),/official/);
});
test('rejects missing or malformed publishable key',()=>{
 assert.throws(()=>validateConfig({url:'https://unique-example.supabase.co',publishableKey:'aaa'}),/publishable/);
});
