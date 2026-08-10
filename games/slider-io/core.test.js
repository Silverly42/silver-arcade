const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./core");
test("clamp bounds values", () => {
  assert.equal(C.clamp(8, 0, 4), 4);
  assert.equal(C.clamp(-1, 0, 4), 0);
});
test("angleDelta chooses shortest turn", () =>
  assert.ok(Math.abs(C.angleDelta(Math.PI * 0.9, -Math.PI * 0.9)) < 1));
test("rank sorts by score", () =>
  assert.equal(
    C.rank(
      [
        { id: 1, score: 3 },
        { id: 2, score: 9 },
      ],
      1,
    ),
    2,
  ));
test("collision ignores neck and catches body", () => {
  const pts = Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: 0 }));
  assert.equal(C.collides({ x: 90, y: 1 }, pts, 4), true);
});
test("AI reaches elite level for the final five", () => {
  assert.equal(C.aiLevel(12), 1);
  assert.equal(C.aiLevel(8), 2);
  assert.equal(C.aiLevel(5), 3);
  assert.equal(C.aiLevel(1), 3);
});
test("AI difficulty changes tactical strength throughout the match", () => {
  assert.equal(C.aiLevel(20, "easy"), 1);
  assert.equal(C.aiLevel(5, "easy"), 2);
  assert.equal(C.aiLevel(20, "hard"), 2);
  assert.equal(C.aiLevel(5, "hard"), 3);
  assert.equal(C.aiLevel(20, "insane"), 3);
});
test("bot roster stays between 24 and 32", () => {
  for (let i = 0; i < 100; i++)
    assert.ok(C.botCount() >= 24 && C.botCount() <= 32);
});
test("giant rivals stay within requested limits", () => {
  for (let i = 0; i < 100; i++) {
    assert.ok(C.giantCount() >= 1 && C.giantCount() <= 3);
    assert.ok(C.giantScore() >= 1000 && C.giantScore() <= 3000);
  }
});
test("spatial grid only returns local items", () => {
  const grid = C.makeGrid(
    [
      { x: 10, y: 10, id: "near" },
      { x: 900, y: 900, id: "far" },
    ],
    100,
  );
  assert.deepEqual(
    C.nearby(grid, 20, 20, 80).map((x) => x.id),
    ["near"],
  );
});
test("prediction leads a moving target", () =>
  assert.deepEqual(C.predict({ x: 10, y: 20, a: 0, speed: 100 }, 0.5), {
    x: 60,
    y: 20,
  }));
test("danger turn chooses an escape side", () =>
  assert.notEqual(C.dangerTurn({ x: 0, y: 0, a: 0 }, [{ x: 100, y: 20 }]), 0));
test("black-hole pull grows inside its influence radius", () => {
  assert.equal(C.holePull({ x: 0, y: 0 }, { x: 400, y: 0 }, 300).strength, 0);
  const pull = C.holePull({ x: 0, y: 0 }, { x: 100, y: 0 }, 300);
  assert.ok(pull.x > 0 && pull.strength > 0);
});
test("wormhole teleport preserves identity score and body length", () => {
  const snake = {
      id: "you",
      score: 321,
      x: 10,
      y: 20,
      points: [
        { x: 10, y: 20 },
        { x: 3, y: 20 },
      ],
    },
    same = C.teleportSnake(snake, { x: 500, y: 600 }, 1000);
  assert.equal(same.id, "you");
  assert.equal(same.score, 321);
  assert.equal(same.points.length, 2);
  assert.deepEqual(same.points[1], { x: 493, y: 600 });
  assert.equal(same.warpUntil, 3600);
});
test("safe wormhole exits avoid walls snakes and other holes", () => {
  const snakes = [{ x: 500, y: 500, alive: true }],
    holes = [{ x: 1500, y: 1500 }];
  assert.equal(C.safeExit({ x: 100, y: 100 }, snakes, holes, 2000), false);
  assert.equal(C.safeExit({ x: 600, y: 600 }, snakes, holes, 2000), false);
  assert.equal(C.safeExit({ x: 1000, y: 1000 }, snakes, holes, 2000), true);
});
test("death-body sampling caps pellet count while covering the body", () => {
  const points = Array.from({ length: 700 }, (_, i) => ({ x: i, y: 0 })),
    sample = C.sampleBody(points, 120);
  assert.equal(sample.length, 120);
  assert.equal(sample[0].x, 0);
  assert.ok(sample.at(-1).x > 690);
});
test("food hoover pulls nearby food and ignores distant food", () => {
  const player = { x: 100, y: 0 };
  assert.equal(C.foodPull({ x: -300, y: 0 }, player, 280).strength, 0);
  const pull = C.foodPull({ x: 0, y: 0 }, player, 280);
  assert.ok(pull.x > 0 && pull.strength > 0);
});
test("food ball size reflects value and remains readable as the player grows", () => {
  assert.ok(C.foodRadius(5, 1) > C.foodRadius(1, 1));
  assert.ok(C.foodRadius(0.25, 1) < C.foodRadius(1, 1));
  assert.ok(C.foodRadius(1, 0.7) > C.foodRadius(1, 1));
  assert.ok(C.foodRadius(100, 0.7) <= 11);
});
test("AI energy targeting prefers valuable nearby food without doubling back", () => {
  const snake = { x: 0, y: 0, a: 0 };
  assert.equal(
    C.energyTarget(snake, [
      { id: "behind", x: -30, y: 0, value: 1 },
      { id: "ahead", x: 80, y: 0, value: 1 },
      { id: "rich", x: 160, y: 0, value: 4 },
    ]).id,
    "rich",
  );
  assert.equal(C.energyTarget(snake, [{ x: 2000, y: 0, value: 20 }], 900), null);
});
