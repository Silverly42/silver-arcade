const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "games/slider-io");
test("build identifier is visible and multiplayer controls are disabled", () => {
  const version = fs.readFileSync(path.join(root, "version.js"), "utf8"),
    html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(version, /SLIDER_BUILD='1\.3\.1'/);
  assert.match(version, /SLIDER_ONLINE=false/);
  assert.match(html, /id="onlinePanel" class="online hidden"/);
  assert.match(html, /id="buildHud"/);
  assert.match(html, /id="buildMenu"/);
  assert.match(html, /id="hooverBtn"/);
  assert.match(html, /id="quitBtn"/);
  assert.match(html, /id="quitPaused"/);
  assert.match(html, /id="quitConfirm"/);
  assert.match(html, /id="quitCancel"/);
  assert.match(html, /id="quitYes"/);
  assert.match(html, /data-difficulty="easy"/);
  assert.match(html, /data-difficulty="medium"/);
  assert.match(html, /data-difficulty="hard"/);
  assert.match(html, /data-difficulty="insane"/);
});
test("thirty-second power pickups provide boost hoover and invisibility", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8"),
    html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(game, /speed: \{ label: "FREE BOOST"/);
  assert.match(game, /hoover: \{ label: "MEGA HOOVER"/);
  assert.match(game, /invisible: \{ label: "INVISIBLE"/);
  assert.match(game, /player\.powers\[type\] = 30/);
  assert.match(game, /activateHoover\(30, true\)/);
  assert.match(game, /boost && !freeBoost/);
  assert.match(html, /id="powerTimers"/);
});
test("player knockouts award ten seconds of food hoover", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  assert.match(
    game,
    /function showKill\(name\) \{\s+activateHoover\(10, true\)/,
  );
  assert.match(game, /HOOVER \+10S/);
});
test("normal food hoover has a ten second cooldown", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  assert.match(game, /hooverCooldown = 10/);
  assert.match(game, /COOLDOWN/);
});
test("food hoover uses E and death drops retain natural orb size", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8"),
    html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(game, /e\.key === "e" \|\| e\.key === "E"/);
  assert.doesNotMatch(game, /e\.key === "h" \|\| e\.key === "H"/);
  assert.match(game, /addFood\(p\.x, p\.y, dropValue, s\.color, 1, "death"\)/);
  assert.match(game, /f\.visualValue \?\? f\.value/);
  assert.match(html, /E: 5-second hoover/);
});
test("bots release awkward orb targets and death drops survive a full arena", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  assert.match(game, /distance < 80 && turnNeeded > 1\.05/);
  assert.match(game, /f\.kind !== "death"/);
  assert.match(game, /f\.kind === "death" \? 10 : 6/);
  assert.match(game, /"orb goblin"/);
  assert.match(game, /"allat"/);
});
test("Slider 1.3.1 adds anti-circle recovery colours victory sound and giant growth", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8"),
    core = fs.readFileSync(path.join(root, "core.js"), "utf8");
  assert.match(game, /moved < 85/);
  assert.match(game, /s\.breakUntil = now \+ 2400/);
  assert.match(game, /function victoryTone\(\)/);
  assert.match(game, /"#ee72ff"/);
  assert.match(game, /Math\.min\(1200, s\.score/);
  assert.match(core, /0\.85, 14, 64/);
});
