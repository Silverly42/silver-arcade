const test=require('node:test');const assert=require('node:assert/strict');const C=require('./core');
test('clamp bounds values',()=>{assert.equal(C.clamp(8,0,4),4);assert.equal(C.clamp(-1,0,4),0)});
test('angleDelta chooses shortest turn',()=>assert.ok(Math.abs(C.angleDelta(Math.PI*.9,-Math.PI*.9))<1));
test('rank sorts by score',()=>assert.equal(C.rank([{id:1,score:3},{id:2,score:9}],1),2));
test('collision ignores neck and catches body',()=>{const pts=Array.from({length:10},(_,i)=>({x:i*10,y:0}));assert.equal(C.collides({x:90,y:1},pts,4),true)});
