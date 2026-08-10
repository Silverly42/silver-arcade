(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SliderCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TAU = Math.PI * 2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (a, b) => {
    const x = a.x - b.x,
      y = a.y - b.y;
    return x * x + y * y;
  };
  const angleDelta = (from, to) => {
    let d = ((to - from + Math.PI) % TAU) - Math.PI;
    return d < -Math.PI ? d + TAU : d;
  };
  const lerpAngle = (from, to, t) =>
    from + angleDelta(from, to) * clamp(t, 0, 1);
  const rank = (snakes, id) =>
    [...snakes]
      .sort((a, b) => b.score - a.score)
      .findIndex((s) => s.id === id) + 1;
  const collides = (head, segments, radius, skip = 7) =>
    segments.slice(skip).some((p) => dist2(head, p) < radius * radius);
  const aiLevel = (alive, difficulty = "medium") =>
    difficulty === "insane"
      ? 3
      : difficulty === "hard"
        ? alive <= 5
          ? 3
          : 2
        : difficulty === "easy"
          ? alive <= 5
            ? 2
            : 1
          : alive <= 5
            ? 3
            : alive <= 10
              ? 2
              : 1;
  const botCount = () => 24 + Math.floor(Math.random() * 9);
  const giantCount = () => 1 + Math.floor(Math.random() * 3);
  const giantScore = () => 1000 + Math.floor(Math.random() * 2001);
  const makeGrid = (items, size = 180) => {
    const cells = new Map();
    for (const item of items) {
      const key = `${Math.floor(item.x / size)},${Math.floor(item.y / size)}`,
        cell = cells.get(key);
      if (cell) cell.push(item);
      else cells.set(key, [item]);
    }
    return { size, cells };
  };
  const nearby = (grid, x, y, radius) => {
    const out = [],
      size = grid.size,
      minX = Math.floor((x - radius) / size),
      maxX = Math.floor((x + radius) / size),
      minY = Math.floor((y - radius) / size),
      maxY = Math.floor((y + radius) / size);
    for (let cy = minY; cy <= maxY; cy++)
      for (let cx = minX; cx <= maxX; cx++) {
        const cell = grid.cells.get(`${cx},${cy}`);
        if (cell) out.push(...cell);
      }
    return out;
  };
  const predict = (target, seconds = 0.45) => ({
    x: target.x + Math.cos(target.a || 0) * (target.speed || 0) * seconds,
    y: target.y + Math.sin(target.a || 0) * (target.speed || 0) * seconds,
  });
  const dangerTurn = (snake, segments, lookAhead = 145) => {
    const fx = Math.cos(snake.a),
      fy = Math.sin(snake.a),
      probe = { x: snake.x + fx * lookAhead, y: snake.y + fy * lookAhead };
    let left = 0,
      right = 0,
      danger = 0;
    for (const p of segments) {
      if (dist2(probe, p) > 240 * 240) continue;
      danger++;
      const cross = fx * (p.y - snake.y) - fy * (p.x - snake.x);
      if (cross > 0) left++;
      else right++;
    }
    return danger ? (left > right ? -1 : 1) : 0;
  };
  const holePull = (snake, hole, radius = 300, power = 235) => {
    const dx = hole.x - snake.x,
      dy = hole.y - snake.y,
      d = Math.hypot(dx, dy);
    if (!d || d >= radius) return { x: 0, y: 0, strength: 0 };
    const strength = (1 - d / radius) ** 2 * power;
    return { x: (dx / d) * strength, y: (dy / d) * strength, strength };
  };
  const teleportSnake = (snake, exit, now, cooldown = 2600) => {
    const dx = exit.x - snake.x,
      dy = exit.y - snake.y;
    snake.x = exit.x;
    snake.y = exit.y;
    snake.points = snake.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    snake.warpUntil = now + cooldown;
    return snake;
  };
  const safeExit = (p, snakes, holes, world, ignoreHole) =>
    p.x > 380 &&
    p.y > 380 &&
    p.x < world - 380 &&
    p.y < world - 380 &&
    snakes.every((s) => !s.alive || dist2(p, s) > 520 * 520) &&
    holes.every((h) => h === ignoreHole || dist2(p, h) > 180 * 180);
  const sampleBody = (points, max = 120) => {
    if (points.length <= max) return points.slice();
    const step = points.length / max,
      out = [];
    for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
    return out;
  };
  const foodPull = (food, player, radius = 280, power = 520) => {
    const dx = player.x - food.x,
      dy = player.y - food.y,
      d = Math.hypot(dx, dy);
    if (!d || d >= radius) return { x: 0, y: 0, strength: 0 };
    const strength = (1 - d / radius) * power;
    return { x: (dx / d) * strength, y: (dy / d) * strength, strength };
  };
  const foodRadius = (value = 1, zoom = 1) =>
    clamp(
      (2.7 + Math.sqrt(clamp(value, 0.2, 25)) * 1.45) /
        Math.sqrt(clamp(zoom, 0.65, 1.2)),
      3.4,
      11,
    );
  const energyTarget = (snake, foods, radius = 1200) => {
    let best = null,
      bestUtility = -Infinity;
    for (const food of foods) {
      if (food.eaten) continue;
      const distance = Math.sqrt(dist2(snake, food));
      if (distance > radius) continue;
      const value = clamp(food.value || 1, 0.2, 30),
        heading = Math.atan2(food.y - snake.y, food.x - snake.x),
        turnCost = Math.abs(angleDelta(snake.a || 0, heading)),
        utility = value * 190 - distance - turnCost * 75;
      if (utility > bestUtility) {
        bestUtility = utility;
        best = food;
      }
    }
    return best;
  };
  return {
    TAU,
    clamp,
    dist2,
    angleDelta,
    lerpAngle,
    rank,
    collides,
    aiLevel,
    botCount,
    giantCount,
    giantScore,
    makeGrid,
    nearby,
    predict,
    dangerTurn,
    holePull,
    teleportSnake,
    safeExit,
    sampleBody,
    foodPull,
    foodRadius,
    energyTarget,
  };
});
