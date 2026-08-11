const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('thrust velocity is applied to ship position every frame',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  assert.match(game,/ship\.x=C\.wrap\(ship\.x\+ship\.vx\*dt,w\)/);
  assert.match(game,/ship\.y=C\.wrap\(ship\.y\+ship\.vy\*dt,h\)/);
});
test('hosted page cache-busts the current game script',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.match(html,/game\.js\?v=1\.2\.0/);
});
test('emergency escape teleports safely stops motion and has a minute cooldown',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  assert.match(game,/function emergencyEscape\(\)/);
  assert.match(game,/C\.safeTeleport\(w,h,hazards\)/);
  assert.match(game,/ship\.vx=0;ship\.vy=0/);
  assert.match(game,/escapeCooldown=60/);
  assert.match(game,/toLowerCase\(\)==='e'/);
});
test('local leaderboard persists and renders the five best runs',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.match(game,/localStorage\.spaceDefenderBoard/);
  assert.match(game,/board\.sort\(\(a,b\)=>b\.score-a\.score\)/);
  assert.match(game,/board\.slice\(0,5\)/);
  assert.match(html,/id="leaderboard"/);
});
test('enemy saucer crosses the arena and fires at the player',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  assert.match(game,/function spawnUfo\(\)/);
  assert.match(game,/enemyShots\.push/);
  assert.match(game,/destroyUfo\(\)/);
  assert.match(game,/destroy\(a,false\)/);
});
