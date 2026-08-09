const test=require('node:test');const assert=require('node:assert/strict');const C=require('./core');
test('clamp bounds values',()=>{assert.equal(C.clamp(8,0,4),4);assert.equal(C.clamp(-1,0,4),0)});
test('angleDelta chooses shortest turn',()=>assert.ok(Math.abs(C.angleDelta(Math.PI*.9,-Math.PI*.9))<1));
test('rank sorts by score',()=>assert.equal(C.rank([{id:1,score:3},{id:2,score:9}],1),2));
test('collision ignores neck and catches body',()=>{const pts=Array.from({length:10},(_,i)=>({x:i*10,y:0}));assert.equal(C.collides({x:90,y:1},pts,4),true)});
test('AI reaches elite level for the final five',()=>{assert.equal(C.aiLevel(12),1);assert.equal(C.aiLevel(8),2);assert.equal(C.aiLevel(5),3);assert.equal(C.aiLevel(1),3)});
test('bot roster stays between 24 and 32',()=>{for(let i=0;i<100;i++)assert.ok(C.botCount()>=24&&C.botCount()<=32)});
test('giant rivals stay within requested limits',()=>{for(let i=0;i<100;i++){assert.ok(C.giantCount()>=1&&C.giantCount()<=3);assert.ok(C.giantScore()>=1000&&C.giantScore()<=3000)}});
