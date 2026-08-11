const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const js = fs.readFileSync(__dirname + '/game.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

test('Box of Elements exposes 39 materials, larger maps, and chaos interactions', () => {
  assert.match(html, /<title>Box of Elements<\/title>/);
  assert.equal((js.match(/\['[^']+','#[0-9a-f]+'/gi) || []).length, 39);
  for (const element of ['TNT', 'Gunpowder', 'Clone', 'Void', 'Lightning', 'Slime', 'Rainbow', 'Snow', 'Mud', 'Wax', 'Fuse', 'Bomb', 'Mercury', 'Foam', 'Obsidian', 'Cloud', 'Virus', 'Antimatter', 'Concrete']) {
    assert.match(js, new RegExp(`\\['${element}'`));
  }
  assert.match(js, /function explode\(/);
  assert.match(js, /localStorage\.getItem\('living-worlds-save'\)/);
  assert.match(html, /value="320x192">Huge/);
  assert.match(js, /function resizeWorld\(/);
  assert.doesNotMatch(js, /i\*13\+tick\*7/);
});
