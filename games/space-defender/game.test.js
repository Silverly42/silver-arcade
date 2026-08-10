const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('thrust velocity is applied to ship position every frame',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  assert.match(game,/ship\.x=C\.wrap\(ship\.x\+ship\.vx\*dt,w\)/);
  assert.match(game,/ship\.y=C\.wrap\(ship\.y\+ship\.vy\*dt,h\)/);
});
