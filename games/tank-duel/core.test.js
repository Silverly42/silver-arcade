const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core');
test('tank circles collide with walls and each other',()=>{assert.equal(C.circleRect({x:9,y:20,r:10},{x:15,y:0,w:10,h:50}),true);assert.equal(C.circleCircle({x:0,y:0,r:10},{x:25,y:0,r:10}),false)});
test('blocked prevents tank wall traversal',()=>assert.equal(C.blocked({x:20,y:20,r:12},[{x:25,y:0,w:20,h:50}]),true));
test('shell reflects horizontally from a vertical wall',()=>{const hit=C.shellWallHit({x:90,y:120,r:4,vx:12,vy:2},{x:100,y:80,w:20,h:100});assert.equal(hit.vx,-12);assert.equal(hit.vy,2)});
test('four balanced maze layouts are available',()=>{assert.equal(C.layouts.length,4);assert.ok(C.layouts.every(x=>x.length>=3))});
test('AI line of sight detects maze walls',()=>{assert.equal(C.lineBlocked({x:0,y:50},{x:100,y:50},[{x:45,y:20,w:10,h:60}]),true);assert.equal(C.lineBlocked({x:0,y:0},{x:30,y:0},[]),false)});
test('AI uses the shortest rotation toward its target',()=>assert.ok(Math.abs(C.angleDelta(3,-3))<1));
