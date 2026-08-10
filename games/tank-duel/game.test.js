const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('shells never destroy the tank that fired them',()=>{
  const game=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  assert.match(game,/t\.id!==s\.owner&&C\.circleCircle\(s,t\)/);
});
test('page loads the Tank Duel 1.1.1 fix',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.match(html,/game\.js\?v=1\.1\.1/);
});
