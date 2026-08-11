const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const js = fs.readFileSync(__dirname + '/game.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

test('Box of Elements exposes mineral alchemy, larger maps, and chaos interactions', () => {
  assert.match(html, /<title>Box of Elements<\/title>/);
  assert.equal((js.match(/\['[^']+','#[0-9a-f]+'/gi) || []).length, 44);
  for (const element of ['TNT', 'Gunpowder', 'Void', 'Lightning', 'Slime', 'Rainbow', 'Snow', 'Mud', 'Wax', 'Fuse', 'Bomb', 'Mercury', 'Foam', 'Obsidian', 'Cloud', 'Virus', 'Antimatter', 'Concrete', 'Quartzite', 'Basalt', 'Sulfur', 'Copper Ore', 'Crystal']) {
    assert.match(js, new RegExp(`\\['${element}'`));
  }
  assert.match(js, /function explode\(/);
  assert.match(js, /localStorage\.getItem\('living-worlds-save'\)/);
  assert.match(html, /value="320x192">Huge/);
  assert.match(html, /value="640x384">Titanic/);
  assert.match(js, /function resizeWorld\(/);
  assert.doesNotMatch(js, /i\*13\+tick\*7/);
});

test('physics and tools include delayed minerals, real strikes, inspector, falling plants, and continuous brush', () => {
  assert.match(html, /id="pinpointer"/);
  assert.match(html, /id="optionsMenu"/);
  assert.match(js, /life\[i\]>mineralTime/);
  assert.match(js, /function strikeLightning/);
  assert.match(js, /if\(life\[i\]<22&&empty\(x,y\+1\)\)/);
  assert.match(js, /steps=Math\.max\(1,Math\.ceil/);
  assert.match(js, /if\(i===CLONE\)return/);
  assert.match(js, /function openElementMenu/);
  assert.match(js, /lastTapAt<420/);
  assert.match(html, /id="showHidden"/);
});

test('common materials have grounded physical reactions', () => {
  assert.match(js, /v===SAND&&near\(x,y,LAVA\)/);
  assert.match(js, /grid\[i\]=QUARTZITE/);
  assert.doesNotMatch(js, /v===SAND&&hot\(x,y\)/);
  assert.match(js, /grid\[i\]=chance\(\.82\)\?BASALT/);
  assert.match(js, /v===WATER.*near\(x,y,FIRE\).*grid\[i\]=STEAM/);
  assert.match(js, /const salt=near\(x,y,SALT\)/);
  assert.match(js, /v===MUD.*hot\(x,y\).*grid\[i\]=STONE/);
  assert.doesNotMatch(js, /v===MERCURY.*set\(x,y,LIGHTNING\)/);
  assert.match(js, /v===QUARTZITE.*grid\[i\]=CRYSTAL/);
  assert.match(js, /v===COPPER_ORE.*grid\[i\]=METAL/);
  assert.match(html, /id="temperature"[^>]+min="-100"[^>]+max="100"/);
  assert.match(js, /ambientTemp<0.*set\(x,y,ICE\)/);
  assert.doesNotMatch(js, /if\(chance\(\.0003\)\)set\(x,y,ICE\)/);
});
