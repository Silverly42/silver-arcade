const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core.js');
test('twin treads drive and pivot authentically',()=>{assert.deepEqual(C.treadMotion(1,1),{drive:1,turn:0});assert.deepEqual(C.treadMotion(1,-1),{drive:0,turn:1});assert.deepEqual(C.treadMotion(0,1),{drive:.5,turn:-.5})});
test('seeded battlefield random is reproducible',()=>{const a=C.rng(1980),b=C.rng(1980);assert.deepEqual([a(),a(),a()],[b(),b(),b()])});
test('obstacles stop tanks and shells',()=>{const box={x:0,z:0,w:20,d:30};assert.equal(C.circleBox(0,0,8,box),true);assert.equal(C.blocked({x:0,z:0,r:8},[box]),true);assert.equal(C.segmentBox({x:-20,z:0},{x:20,z:0},box),true)});
test('projection rejects targets behind narrow forward view',()=>{assert.equal(C.project({x:0,z:-20}, {x:0,z:0,a:0},960,600),null);assert.ok(C.project({x:0,z:20},{x:0,z:0,a:0},960,600))});
