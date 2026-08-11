const test=require('node:test');const assert=require('node:assert/strict');const C=require('./core.js');
test('overlap detects contact areas',()=>{assert.equal(C.overlap({x:0,y:0,w:10,h:10},{x:9,y:2,w:3,h:3}),true);assert.equal(C.overlap({x:0,y:0,w:10,h:10},{x:10,y:0,w:2,h:2}),false)});
test('solid floor stops falling',()=>{const b={x:5,y:0,w:10,h:10,vx:0,vy:12};C.moveAndCollide(b,0,12,[{x:0,y:20,w:30,h:10}]);assert.equal(b.y,10);assert.equal(b.grounded,true)});
test('wall stops horizontal movement',()=>{const b={x:0,y:2,w:10,h:10,vx:5,vy:0};C.moveAndCollide(b,15,0,[{x:20,y:0,w:10,h:30}]);assert.equal(b.x,10);assert.equal(b.vx,0)});
test('jump is grounded only and locks direction',()=>{const b={grounded:true,vy:0};assert.equal(C.fixedJump(b,-1),true);assert.equal(b.jumpVx,-1.25);assert.equal(C.fixedJump(b,1),false)});
test('damage removes armour before life',()=>{const p={invuln:0,state:'alive',armoured:true,lives:3,vy:0};assert.equal(C.applyHit(p),'armour');assert.equal(p.lives,3);p.invuln=0;assert.equal(C.applyHit(p),'death');assert.equal(p.lives,2)});
test('invulnerability blocks repeat damage',()=>{const p={invuln:10,state:'alive',armoured:true,lives:3};assert.equal(C.applyHit(p),'ignored');assert.equal(p.armoured,true)});

