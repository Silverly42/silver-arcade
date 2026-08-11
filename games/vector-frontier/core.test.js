const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core.js');
test('angles wrap and choose shortest turn',()=>{assert.ok(Math.abs(C.wrapAngle(-Math.PI/2)-Math.PI*1.5)<1e-9);assert.ok(C.angleDelta(.1,Math.PI*2-.1)<0)});
test('projection rejects objects behind the tank',()=>{const cam={x:0,z:0,a:0};assert.equal(C.project({x:0,z:-20,y:0},cam,960,600),null);assert.ok(C.project({x:0,z:20,y:0},cam,960,600))});
test('world clamp and collision are deterministic',()=>{assert.deepEqual(C.clampWorld({x:999,z:-999},300),{x:300,z:-300});assert.equal(C.hitCircle({x:0,z:0},{x:3,z:4},5),true)});
