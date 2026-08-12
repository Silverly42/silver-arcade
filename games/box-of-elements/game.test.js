const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const js = fs.readFileSync(__dirname + '/game.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

test('Box of Elements exposes mineral alchemy, larger maps, and chaos interactions', () => {
  assert.match(html, /<title>Box of Elements<\/title>/);
  assert.equal((js.match(/\['[^']+','#[0-9a-f]+'/gi) || []).length, 47);
  for (const element of ['TNT', 'Gunpowder', 'Void', 'Lightning', 'Slime', 'Rainbow', 'Snow', 'Mud', 'Wax', 'Fuse', 'Bomb', 'Mercury', 'Foam', 'Obsidian', 'Cloud', 'Virus', 'Antimatter', 'Concrete', 'Quartzite', 'Basalt', 'Sulfur', 'Copper Ore', 'Crystal']) {
    assert.match(js, new RegExp(`\\['${element}'`));
  }
  assert.match(js, /function explode\(/);
  assert.match(js, /localStorage\.getItem\('living-worlds-save'\)/);
  assert.match(html, /value="240x144">Normal/);
  assert.match(html, /value="480x288">Huge/);
  assert.match(html, /value="720x432">Titanic/);
  assert.match(js, /function resizeWorld\(/);
  assert.match(js, /const waterline=base-1/);
  assert.match(js, /set\(x,ground\[x\]-1,type\)/);
  assert.match(js, /window\.addEventListener\('contextmenu'/);
  assert.doesNotMatch(js, /i\*13\+tick\*7/);
});

test('grass, geometry tools, previews, and element-aware controls are available', () => {
  assert.match(js, /\['Grass'/);
  assert.match(js, /grid\[i\]=GRASS/);
  assert.match(html, /id="drawTool"/);
  assert.match(html, /value="line"/);
  assert.match(html, /value="circle"/);
  assert.match(html, /value="rectangle"/);
  assert.doesNotMatch(html, /id="ruler"/);
  assert.match(js, /function nearestElement/);
  assert.match(html, /oncontextmenu="return false"/);
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
  assert.match(js, /lastMaterialTapAt<420/);
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
  assert.match(html, /id="temperature"[^>]+aria-label="World temperature"/);
  assert.match(js, /ambientTemp<0.*set\(x,y,ICE\)/);
  assert.doesNotMatch(js, /if\(chance\(\.0003\)\)set\(x,y,ICE\)/);
});

test('fire favors downward spread and mineral reactions grow into capped deposits', () => {
  assert.match(js, /yy<=2/);
  assert.match(js, /downBoost=yy>0\?2\.35:1/);
  assert.match(js, /function growReactionPatch\(x,y,product,sources,max=30,delay=12\)/);
  assert.match(js, /if\(total>=max\)return/);
  assert.match(js, /growReactionPatch\(x,y,QUARTZITE,\[SAND\]\)/);
  assert.match(js, /growReactionPatch\(x,y,OBSIDIAN,\[LAVA\],30,36\)/);
  assert.match(js, /growReactionPatch\(x,y,CRYSTAL,\[QUARTZITE,SALT\]\)/);
});
test('mobile performance uses cached pixels and adaptive frame rates',()=>{assert.match(js,/frameImage=ctx\.createImageData/);assert.match(js,/const palette=color\.map/);assert.match(js,/pointer:coarse/);assert.match(js,/N>200000\?100/);assert.match(html,/game\.js\?v=8\.2/)});

test('antivirus, nuke powder, previews, and mobile material options are available', () => {
  assert.match(js, /\['Antivirus','#45d6ff'\]/);
  assert.match(js, /\['Nuke Powder','#ffe42e'\]/);
  assert.match(js, /if\(v===ANTIVIRUS\)/);
  assert.match(js, /function nearestVirus\(x,y,radius=18\)/);
  assert.match(js, /function huntVirus\(x,y\)/);
  assert.match(js, /for\(let stride=0;stride<2;stride\+\+\)/);
  assert.match(js, /if\(v===ANTIVIRUS\)\{huntVirus\(x,y\);return\}/);
  assert.match(js, /if\(v===NUKE_POWDER\)/);
  assert.match(js, /explode\(x,y,24\)/);
  assert.match(js, /function drawPreview\(\)/);
  assert.match(js, /lastMaterialTap===i/);
  assert.doesNotMatch(html, /id="ruler"/);
  assert.doesNotMatch(js, /rulerMode/);
  assert.match(js, /OBSIDIAN,\[LAVA\],30,36/);
});
