const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core');
test('wrap keeps objects inside the arena',()=>{assert.equal(C.wrap(-1,100),99);assert.equal(C.wrap(101,100),1)});
test('circular collision detection works',()=>{assert.equal(C.collides({x:0,y:0,r:5},{x:8,y:0,r:5}),true);assert.equal(C.collides({x:0,y:0,r:5},{x:20,y:0,r:5}),false)});
test('large asteroids split twice and small asteroids disappear',()=>{const a={x:10,y:20,vx:1,vy:2,size:3,r:42,spin:0};const split=C.splitSpec(a,()=>.5);assert.equal(split.length,2);assert.ok(split.every(x=>x.size===2&&x.r<42));assert.deepEqual(C.splitSpec({...a,size:1}),[])});
test('waves become harder but are capped',()=>{assert.ok(C.waveAsteroids(5)>C.waveAsteroids(1));assert.equal(C.waveAsteroids(99),14)});
test('smaller asteroid fragments are worth more',()=>{assert.ok(C.scoreFor(1)>C.scoreFor(3))});
test('safe teleport chooses a position away from hazards',()=>{const values=[0,.5,.9,.9,.1,.1],p=C.safeTeleport(800,600,[{x:400,y:300,r:150}],()=>values.shift()??.9);assert.ok(p.x>=50&&p.x<=750);assert.ok(p.y>=70&&p.y<=550);assert.ok(Math.hypot(p.x-400,p.y-300)>150)});
