(() => {
  "use strict";
  const C = window.SliderCore,
    canvas = document.querySelector("#game"),
    ctx = canvas.getContext("2d"),
    map = document.querySelector("#map"),
    mctx = map.getContext("2d");
  const $ = (s) => document.querySelector(s),
    WORLD = 6500,
    FOOD_TARGET = 1500,
    FOOD_MAX = 2100,
    skins = ["#62f6d0", "#ff5e8a", "#ffd25f", "#7b73ff", "#58b7ff", "#ff8d4d"];
  const names = [
    "Vortex",
    "Nova",
    "Pixel",
    "Glitch",
    "Comet",
    "Hex",
    "Orbit",
    "Dash",
    "Echo",
    "Flux",
    "Ziggy",
    "Quasar",
    "Bolt",
    "Ion",
    "Prism",
    "Rift",
    "Jinx",
    "Cosmo",
    "Apex",
    "Cipher",
    "Fang",
    "Neon",
    "Pulse",
    "Razor",
    "Sonic",
    "Titan",
    "Vector",
    "Wraith",
    "Zero",
    "Blitz",
    "Chrome",
    "Havoc",
  ];
  let dpr = 1,
    w = 0,
    h = 0,
    state = "menu",
    player = null,
    snakes = [],
    foods = [],
    particles = [],
    blackHoles = [],
    powerUps = [],
    warpEffects = [],
    pointer = { x: 0, y: 0, down: false },
    keys = {},
    camera = { x: WORLD / 2, y: WORLD / 2, zoom: 1 },
    last = 0,
    skin = +(localStorage.sliderSkin || 0),
    audio = null,
    muted = localStorage.sliderMuted === "1",
    hoover = false,
    hooverRemaining = 0,
    hooverCooldown = 0,
    gameMode = localStorage.sliderMode || "classic",
    difficulty = localStorage.sliderDifficulty || "medium",
    ending = false;
  let alive = [],
    foodGrid = C.makeGrid([]),
    segmentGrid = C.makeGrid([]),
    uiClock = 0,
    frameNo = 0;
  let foodDirty = false;
  const foodSprites = new Map();
  const net = {
    role: "solo",
    ws: null,
    room: "",
    remoteInput: { target: 0, boost: false },
    lastInput: 0,
    lastSnapshot: 0,
    guestEnded: false,
    hasGuest: false,
  };
  $("#buildHud").textContent = window.SLIDER_BUILD;
  $("#buildMenu").textContent = window.SLIDER_BUILD;
  if (window.SLIDER_ONLINE) {
    $("#onlinePanel").classList.remove("hidden");
    $("#roomStatus").classList.remove("hidden");
  }
  function updateHooverButton() {
    const b = $("#hooverBtn");
    b.textContent = hoover
      ? `HOOVER ${Math.ceil(hooverRemaining)}S`
      : hooverCooldown > 0
        ? `COOLDOWN ${Math.ceil(hooverCooldown)}S`
        : "HOOVER 5S";
    b.classList.toggle("active", hoover);
    b.disabled = !hoover && hooverCooldown > 0;
    b.setAttribute("aria-pressed", String(hoover));
  }
  function activateHoover(seconds = 5, reward = false) {
    if (state !== "playing" || (!reward && hooverCooldown > 0)) return;
    hoover = true;
    hooverRemaining = seconds;
    if (reward) hooverCooldown = 0;
    updateHooverButton();
    tone(seconds > 5 ? 720 : 560, 0.07);
  }
  function updateHooverTimers(dt) {
    const beforeActive = Math.ceil(hooverRemaining),
      beforeCooldown = Math.ceil(hooverCooldown);
    if (hoover) {
      hooverRemaining = Math.max(0, hooverRemaining - dt);
      if (hooverRemaining <= 0) {
        hoover = false;
        hooverCooldown = 10;
        tone(260, 0.07);
      }
    } else if (hooverCooldown > 0)
      hooverCooldown = Math.max(0, hooverCooldown - dt);
    if (
      beforeActive !== Math.ceil(hooverRemaining) ||
      beforeCooldown !== Math.ceil(hooverCooldown)
    )
      updateHooverButton();
  }
  updateHooverButton();
  function resize() {
    // A 2x full-screen canvas is four times the pixels. Capping it keeps the
    // game smooth on high-DPI phones/laptops with almost no visible loss.
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();
  skins.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "skin" + (i === skin ? " selected" : "");
    b.style.setProperty("--skin", c);
    b.setAttribute("aria-label", "Skin " + (i + 1));
    b.onclick = () => {
      skin = i;
      localStorage.sliderSkin = i;
      document
        .querySelectorAll(".skin")
        .forEach((x, j) => x.classList.toggle("selected", j === i));
      tone(350, 0.05);
    };
    $("#skins").append(b);
  });
  $("#name").value = localStorage.sliderName || "";
  document.querySelectorAll(".mode").forEach((b) => {
    b.classList.toggle("selected", b.dataset.mode === gameMode);
    b.onclick = () => {
      gameMode = b.dataset.mode;
      localStorage.sliderMode = gameMode;
      document
        .querySelectorAll(".mode")
        .forEach((x) => x.classList.toggle("selected", x === b));
      tone(420, 0.05);
    };
  });
  document.querySelectorAll(".aiDifficulty").forEach((b) => {
    b.classList.toggle("selected", b.dataset.difficulty === difficulty);
    b.onclick = () => {
      difficulty = b.dataset.difficulty;
      localStorage.sliderDifficulty = difficulty;
      document
        .querySelectorAll(".aiDifficulty")
        .forEach((x) => x.classList.toggle("selected", x === b));
      tone(460, 0.05);
    };
  });
  function tone(freq, d = 0.04) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.035, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + d);
    } catch {}
  }
  function makeSnake(id, name, color, x, y, isBot) {
    const a = Math.random() * C.TAU,
      points = [];
    for (let i = 0; i < 34; i++)
      points.push({ x: x - Math.cos(a) * i * 7, y: y - Math.sin(a) * i * 7 });
    return {
      id,
      name,
      color,
      x,
      y,
      a,
      target: a,
      speed: 150,
      score: 34,
      points,
      isBot,
      alive: true,
      boost: false,
      think: 0,
      targetFood: null,
      aiTarget: null,
      feedCommit: 0,
      warpUntil: 0,
      powers: { speed: 0, hoover: 0, invisible: 0 },
    };
  }
  function addFood(
    x = Math.random() * WORLD,
    y = Math.random() * WORLD,
    value = 1,
    color = skins[(Math.random() * skins.length) | 0],
    visualValue = value,
  ) {
    if (foods.length >= FOOD_MAX) return false;
    foods.push({
      x,
      y,
      value,
      visualValue,
      color,
      pulse: Math.random() * C.TAU,
      eaten: false,
    });
    return true;
  }
  const powerTypes = {
    speed: { label: "FREE BOOST", color: "#ffd25f", symbol: "⚡" },
    hoover: { label: "MEGA HOOVER", color: "#62f6d0", symbol: "◎" },
    invisible: { label: "INVISIBLE", color: "#b98cff", symbol: "◌" },
  };
  function spawnPowerUp(type) {
    const margin = 500;
    powerUps.push({
      type: type || Object.keys(powerTypes)[(Math.random() * 3) | 0],
      x: margin + Math.random() * (WORLD - margin * 2),
      y: margin + Math.random() * (WORLD - margin * 2),
      pulse: Math.random() * C.TAU,
    });
  }
  function activatePower(type) {
    player.powers[type] = 30;
    if (type === "hoover") activateHoover(30, true);
    const info = powerTypes[type];
    showPowerMessage(`${info.symbol} ${info.label} · 30 SECONDS`);
    tone(type === "speed" ? 820 : type === "hoover" ? 640 : 420, 0.14);
  }
  function showPowerMessage(text) {
    const item = document.createElement("div");
    item.textContent = text;
    $("#killFeed").prepend(item);
    setTimeout(() => item.remove(), 2600);
  }
  function collectPowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (C.dist2(player, powerUps[i]) > 34 * 34) continue;
      activatePower(powerUps[i].type);
      powerUps.splice(i, 1);
      setTimeout(() => state === "playing" && spawnPowerUp(), 9000);
    }
  }
  function updatePowers(dt) {
    if (!player?.powers) return;
    for (const type of Object.keys(player.powers))
      player.powers[type] = Math.max(0, player.powers[type] - dt);
  }
  function spawnBlackHoles() {
    const holes = [];
    for (let i = 0; i < 4; i++) {
      let h;
      for (let n = 0; n < 40; n++) {
        h = {
          id: i,
          x: 700 + Math.random() * (WORLD - 1400),
          y: 700 + Math.random() * (WORLD - 1400),
          pair: i + (i % 2 ? -1 : 1),
          phase: Math.random() * C.TAU,
        };
        if (holes.every((o) => C.dist2(h, o) > 1200 * 1200)) break;
      }
      holes.push(h);
    }
    return holes;
  }
  function safeSpawn() {
    let best = { x: WORLD / 2, y: WORLD / 2 },
      bestGap = 0;
    for (let n = 0; n < 32; n++) {
      const p = {
        x: 650 + Math.random() * (WORLD - 1300),
        y: 650 + Math.random() * (WORLD - 1300),
      };
      let gap = Infinity;
      for (const s of alive) gap = Math.min(gap, C.dist2(p, s));
      if (gap > bestGap) {
        best = p;
        bestGap = gap;
      }
      if (gap > 900 * 900) break;
    }
    return best;
  }
  function start(role = net.role) {
    localStorage.sliderName = $("#name").value.trim() || "Slider";
    localStorage.sliderMode = gameMode;
    localStorage.sliderDifficulty = difficulty;
    hoover = false;
    hooverRemaining = 0;
    hooverCooldown = 0;
    updateHooverButton();
    net.role = role;
    ending = false;
    net.guestEnded = false;
    for (const c of "menu gameover paused".split(" "))
      $("#" + c).classList.add("hidden");
    $("#hud").classList.remove("hidden");
    $("#killFeed").innerHTML = "";
    $("#modeBadge").textContent =
      `${gameMode === "knockout" ? "KNOCKOUT" : "CLASSIC"} · ${difficulty.toUpperCase()}`;
    $("#modeBadge").classList.remove("elite");
    foods = [];
    particles = [];
    snakes = [];
    warpEffects = [];
    powerUps = [];
    blackHoles = spawnBlackHoles();
    frameNo = 0;
    foodDirty = false;
    for (let i = 0; i < FOOD_TARGET; i++) addFood();
    for (const type of Object.keys(powerTypes)) spawnPowerUp(type);
    for (let i = 0; i < 3; i++) spawnPowerUp();
    player = makeSnake(
      "you",
      localStorage.sliderName,
      skins[skin],
      WORLD / 2,
      WORLD / 2,
      false,
    );
    snakes.push(player);
    const botCount = C.botCount(),
      giants = C.giantCount();
    for (let i = 0; i < botCount; i++) {
      const giant = i < giants,
        margin = giant ? 1700 : 500,
        s = makeSnake(
          "b" + i,
          names[i],
          skins[(i + 1) % skins.length],
          margin + Math.random() * (WORLD - margin * 2),
          margin + Math.random() * (WORLD - margin * 2),
          true,
        );
      s.score = giant ? C.giantScore() : 45 + Math.random() * 255;
      const startingLength = giant ? Math.min(550, s.score) : s.score | 0;
      s.points = Array.from({ length: startingLength }, (_, j) => ({
        x: s.x - Math.cos(s.a) * j * 7,
        y: s.y - Math.sin(s.a) * j * 7,
      }));
      snakes.push(s);
    }
    alive = snakes;
    camera.x = player.x;
    camera.y = player.y;
    state = "playing";
    last = performance.now();
    uiClock = 0;
    tone(520, 0.09);
  }
  function rebuildIndexes() {
    alive = snakes.filter((s) => s.alive);
    if (frameNo % 4 === 1 || !foodGrid.cells.size)
      foodGrid = C.makeGrid(
        foods.filter((f) => !f.eaten),
        180,
      );
    if (frameNo % 2 === 1 || !segmentGrid.cells.size) {
      const segments = [];
      for (const s of alive)
        for (let i = 6; i < s.points.length; i += 2) {
          const p = s.points[i];
          segments.push({ x: p.x, y: p.y, owner: s, index: i });
        }
      segmentGrid = C.makeGrid(segments, 150);
    }
  }
  function closestFood(s, radius = 900) {
    return C.energyTarget(s, C.nearby(foodGrid, s.x, s.y, radius), radius);
  }
  function eliteTarget(s) {
    let best = null,
      bestValue = -Infinity;
    for (const rival of alive) {
      if (rival === s) continue;
      if (rival.powers?.invisible > 0) continue;
      const d = Math.sqrt(C.dist2(s, rival)),
        sizeAdvantage = s.score / (rival.score || 1),
        value =
          (sizeAdvantage > 1.15 ? 650 : 0) - d + (rival === player ? 280 : 0);
      if (value > bestValue) {
        bestValue = value;
        best = rival;
      }
    }
    return best;
  }
  function avoidAngle(s, level) {
    const danger = C.nearby(segmentGrid, s.x, s.y, 310).filter(
        (p) => p.owner !== s,
      ),
      turn = C.dangerTurn(s, danger, level === 3 ? 190 : 135);
    if (!turn) return null;
    return s.a + turn * (level === 3 ? 1.28 : 0.9);
  }
  function closestHole(s) {
    let best = null,
      bd = Infinity;
    for (const h of blackHoles) {
      const d = C.dist2(s, h);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return { hole: best, distance: Math.sqrt(bd) };
  }
  function tacticalHole(s, target) {
    if (s.warpUntil > performance.now() || blackHoles.length < 2) return null;
    const direct = Math.sqrt(C.dist2(s, target));
    let best = null,
      bestCost = direct;
    for (const h of blackHoles) {
      const exit = blackHoles[h.pair];
      if (!exit) continue;
      const cost = Math.sqrt(C.dist2(s, h)) + Math.sqrt(C.dist2(exit, target));
      if (cost < bestCost - 900) {
        bestCost = cost;
        best = h;
      }
    }
    return best;
  }
  function chooseWarpExit(source, s) {
    const exitHole = blackHoles[source.pair] || source;
    for (let n = 0; n < 28; n++) {
      const a = Math.random() * C.TAU,
        r = 245 + Math.random() * 150,
        p = {
          x: exitHole.x + Math.cos(a) * r,
          y: exitHole.y + Math.sin(a) * r,
          a,
        };
      if (
        C.safeExit(
          p,
          alive.filter((x) => x !== s),
          blackHoles,
          WORLD,
          exitHole,
        )
      )
        return p;
    }
    for (let n = 0; n < 40; n++) {
      const p = {
        x: 500 + Math.random() * (WORLD - 1000),
        y: 500 + Math.random() * (WORLD - 1000),
        a: Math.random() * C.TAU,
      };
      if (
        C.safeExit(
          p,
          alive.filter((x) => x !== s),
          blackHoles,
          WORLD,
        )
      )
        return p;
    }
    const p = safeSpawn();
    return { ...p, a: Math.random() * C.TAU };
  }
  function flashWarp() {
    const el = $("#warpFlash");
    el.classList.remove("active");
    void el.offsetWidth;
    el.classList.add("active");
    tone(180, 0.18);
    setTimeout(() => tone(620, 0.2), 120);
  }
  function warpSnake(s, hole, now) {
    const exit = chooseWarpExit(hole, s),
      entrance = { x: s.x, y: s.y };
    C.teleportSnake(s, exit, now);
    s.a = exit.a;
    s.target = exit.a;
    s.boost = false;
    warpEffects.push(
      { x: entrance.x, y: entrance.y, life: 0.65 },
      { x: exit.x, y: exit.y, life: 0.8 },
    );
    if (s === player) flashWarp();
  }
  function applyBlackHoles(s, dt, now) {
    if (now < s.warpUntil) return;
    for (const h of blackHoles) {
      const pull = C.holePull(s, h, 310, 250);
      if (!pull.strength) continue;
      s.x += pull.x * dt;
      s.y += pull.y * dt;
      if (Math.sqrt(C.dist2(s, h)) < 43) {
        warpSnake(s, h, now);
        return;
      }
    }
  }
  function targetFor(s, dt) {
    if (!s.isBot) {
      let dx = pointer.x - w / 2,
        dy = pointer.y - h / 2;
      if (keys.ArrowLeft || keys.a) dx = -200;
      if (keys.ArrowRight || keys.d) dx = 200;
      if (keys.ArrowUp || keys.w) dy = -200;
      if (keys.ArrowDown || keys.s) dy = 200;
      if (dx || dy) s.target = Math.atan2(dy, dx);
      s.boost =
        (pointer.down || keys[" "] || keys.Shift) &&
        (s.score > 38 || s.powers.speed > 0);
      return;
    }
    if (s.id === "guest") {
      s.target = net.remoteInput.target;
      s.boost = net.remoteInput.boost && s.score > 38;
      return;
    }
    const level = C.aiLevel(alive.length, difficulty);
    s.think -= dt;
    if (s.think > 0) return;
    s.think =
      level === 3
        ? 0.06 + Math.random() * 0.09
        : (0.28 + Math.random() * 0.42) / level;
    const escape = avoidAngle(s, level);
    if (escape !== null) {
      s.target = escape;
      s.boost = level === 3 && s.score > 48;
      return;
    }
    const near = closestHole(s);
    if (
      level < 3 &&
      near.hole &&
      near.distance < 390 &&
      s.warpUntil < performance.now()
    ) {
      s.target = Math.atan2(s.y - near.hole.y, s.x - near.hole.x);
      s.boost = s.score > 45;
      return;
    }
    if (level === 3 && s.score >= 180) {
      const candidate = eliteTarget(s);
      s.aiTarget =
        candidate &&
        s.score > candidate.score * 1.15 &&
        C.dist2(s, candidate) < 700 * 700
          ? candidate
          : null;
      if (s.aiTarget) {
        const shortcut = tacticalHole(s, s.aiTarget);
        if (shortcut) {
          s.target = Math.atan2(shortcut.y - s.y, shortcut.x - s.x);
          s.boost = s.score > 52;
          return;
        }
        const lead = C.predict(
            s.aiTarget,
            0.4 + Math.min(0.5, Math.sqrt(C.dist2(s, s.aiTarget)) / 1100),
          ),
          dx = lead.x - s.x,
          dy = lead.y - s.y,
          side =
            Math.sign(
              Math.sin(s.aiTarget.a || 0) * dx -
                Math.cos(s.aiTarget.a || 0) * dy,
            ) || 1,
          trap = 85 + Math.min(170, Math.sqrt(C.dist2(s, s.aiTarget)) * 0.09);
        s.target = Math.atan2(
          dy + Math.cos(s.aiTarget.a || 0) * side * trap,
          dx - Math.sin(s.aiTarget.a || 0) * side * trap,
        );
        const aligned = Math.abs(C.angleDelta(s.a, s.target)) < 0.3;
        s.boost = aligned && s.score > 52 && C.dist2(s, s.aiTarget) > 180 * 180;
        return;
      }
    }
    const foodRadius = 1050 + level * 250;
    if (
      !s.targetFood ||
      s.targetFood.eaten ||
      C.dist2(s, s.targetFood) > foodRadius * foodRadius ||
      s.feedCommit <= 0
    ) {
      s.targetFood = closestFood(s, foodRadius);
      s.feedCommit = 4 + Math.random() * 2;
    }
    s.feedCommit -= s.think;
    if (s.targetFood)
      s.target = Math.atan2(s.targetFood.y - s.y, s.targetFood.x - s.x);
    const edge = 300 + level * 45;
    if (
      s.x < edge ||
      s.x > WORLD - edge ||
      s.y < edge ||
      s.y > WORLD - edge
    )
      s.target = Math.atan2(WORLD / 2 - s.y, WORLD / 2 - s.x);
    s.target += (Math.random() - 0.5) * (0.06 / level);
    s.boost = false;
  }
  function finish(won = false) {
    if (ending) return;
    ending = true;
    state = won ? "won" : "dead";
    setTimeout(() => {
      const score = player.score | 0,
        best = Math.max(score, +(localStorage.sliderBest || 0));
      localStorage.sliderBest = best;
      $("#finalScore").textContent = score;
      $("#best").textContent = "Best: " + best;
      $("#resultLabel").textContent = won ? "GRID CONQUERED" : "SIGNAL LOST";
      $("#resultCaption").textContent = won
        ? "knockout champion"
        : "final length";
      $("#hud").classList.add("hidden");
      $("#gameover").classList.remove("hidden");
      tone(won ? 760 : 90, won ? 0.25 : 0.4);
    }, 650);
  }
  function showKill(name) {
    activateHoover(10, true);
    const feed = $("#killFeed"),
      item = document.createElement("div");
    item.textContent = `YOU KNOCKED OUT ${name} · HOOVER +10S`;
    feed.prepend(item);
    setTimeout(() => item.remove(), 2200);
  }
  function kill(s, killer = null) {
    if (!s.alive) return;
    s.alive = false;
    if (killer === player && s !== player) showKill(s.name);
    const drops = C.sampleBody(
        s.points.slice(3),
        Math.min(120, FOOD_MAX - foods.length),
      ),
      dropValue = drops.length
        ? Math.max(2, s.points.length / drops.length)
        : 0;
    for (const p of drops) addFood(p.x, p.y, dropValue, s.color, 1);
    for (let i = 0; i < 25 && particles.length < 500; i++)
      particles.push({
        x: s.x,
        y: s.y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        life: 1,
        color: s.color,
      });
    if (s === player) finish(false);
    else if (s.id === "guest") {
      sendHost({ type: "guest_dead" });
    } else if (gameMode === "classic")
      setTimeout(() => {
        if (state === "playing") {
          const p = safeSpawn(),
            n = makeSnake(s.id, s.name, s.color, p.x, p.y, true);
          snakes[snakes.indexOf(s)] = n;
        }
      }, 1800);
  }
  function collectFood(s) {
    for (const f of C.nearby(foodGrid, s.x, s.y, 25)) {
      if (f.eaten || C.dist2(s, f) >= 420) continue;
      f.eaten = true;
      foodDirty = true;
      s.score += f.value;
      if (particles.length < 500)
        particles.push({
          x: f.x,
          y: f.y,
          vx: 0,
          vy: 0,
          life: 0.45,
          color: f.color,
        });
      if (s === player && Math.random() < 0.18)
        tone(650 + Math.random() * 220, 0.025);
    }
  }
  function applyFoodHoover(s, dt) {
    for (const f of C.nearby(foodGrid, s.x, s.y, 285)) {
      if (f.eaten) continue;
      const pull = C.foodPull(f, s);
      if (!pull.strength) continue;
      f.x += pull.x * dt;
      f.y += pull.y * dt;
    }
  }
  function hitBody(s) {
    const radius = C.bodyWidth(s.score) * 0.72;
    for (const p of C.nearby(segmentGrid, s.x, s.y, radius + 8)) {
      if (p.owner === s || !p.owner.alive) continue;
      if (C.dist2(s, p) < radius * radius) return p.owner;
    }
    return null;
  }
  function update(dt, now) {
    if (state === "guest") {
      updateGuest(dt, now);
      return;
    }
    if (state !== "playing") return;
    frameNo++;
    rebuildIndexes();
    for (const s of alive) {
      targetFor(s, dt);
      const baseTurn = 2.5 - Math.min(s.score, 220) * 0.004,
        level = s.isBot ? C.aiLevel(alive.length, difficulty) : 1,
        turn = baseTurn * (s.isBot ? 1 + (level - 1) * 0.24 : 1.65);
      s.a = C.lerpAngle(s.a, s.target, turn * dt);
      const freeBoost = s === player && s.powers.speed > 0,
        boost = s.boost && (s.score > 38 || freeBoost);
      s.speed = 150 + (boost ? (freeBoost ? 135 : 100) : 0);
      s.x += Math.cos(s.a) * s.speed * dt;
      s.y += Math.sin(s.a) * s.speed * dt;
      applyBlackHoles(s, dt, now);
      s.x = C.clamp(s.x, 10, WORLD - 10);
      s.y = C.clamp(s.y, 10, WORLD - 10);
      s.points.unshift({ x: s.x, y: s.y });
      const max = Math.max(28, Math.min(700, s.score | 0));
      if (s.points.length > max) s.points.length = max;
      if (boost && !freeBoost && Math.random() < dt * 16) {
        s.score -= 0.12;
        const tail = s.points[s.points.length - 1];
        if (tail) addFood(tail.x, tail.y, 0.25, s.color);
      }
      if (s === player && hoover) applyFoodHoover(s, dt);
      collectFood(s);
      if (s === player) collectPowerUps();
      const killer = hitBody(s);
      if (killer) kill(s, killer);
      else if (s.x <= 11 || s.x >= WORLD - 11 || s.y <= 11 || s.y >= WORLD - 11)
        kill(s);
    }
    if (foodDirty) {
      foods = foods.filter((f) => !f.eaten);
      foodDirty = false;
    }
    while (foods.length < FOOD_TARGET) addFood();
    updatePowers(dt);
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const fx of warpEffects) fx.life -= dt;
    warpEffects = warpEffects.filter((fx) => fx.life > 0);
    alive = alive.filter((s) => s.alive);
    if (gameMode === "knockout" && player.alive && alive.length === 1) {
      finish(true);
      return;
    }
    camera.x += (player.x - camera.x) * Math.min(1, dt * 5);
    camera.y += (player.y - camera.y) * Math.min(1, dt * 5);
    camera.zoom +=
      (C.clamp(1.14 - player.score / 900, 0.72, 1) - camera.zoom) * dt * 2;
    if (now - uiClock > 280) {
      uiClock = now;
      updateHud();
    }
    if (net.role === "host" && now - net.lastSnapshot > 80) {
      net.lastSnapshot = now;
      sendSnapshot();
    }
  }
  function updateHud() {
    const living = alive.length;
    $("#score").textContent = player.score | 0;
    $("#rank").textContent = player.alive
      ? "#" + C.rank(alive, player.id)
      : "—";
    $("#alive").textContent = living;
    const elite = living <= 5 && C.aiLevel(living, difficulty) === 3;
    $("#modeBadge").classList.toggle("elite", elite);
    $("#modeBadge").textContent = elite
      ? "FINAL 5 · ELITE AI"
      : `${gameMode === "knockout" ? "KNOCKOUT" : "CLASSIC"} · ${difficulty.toUpperCase()}`;
    renderLeaders();
    $("#powerTimers").innerHTML = Object.entries(player.powers)
      .filter(([, seconds]) => seconds > 0)
      .map(([type, seconds]) => {
        const info = powerTypes[type];
        return `<span style="color:${info.color}">${info.symbol} ${info.label} ${Math.ceil(seconds)}S</span>`;
      })
      .join("");
  }
  function worldBounds(pad = 100) {
    return {
      left: camera.x - w / camera.zoom / 2 - pad,
      top: camera.y - h / camera.zoom / 2 - pad,
      right: camera.x + w / camera.zoom / 2 + pad,
      bottom: camera.y + h / camera.zoom / 2 + pad,
    };
  }
  function foodSprite(color, radius) {
    const bucket = Math.round(radius * 2) / 2,
      key = `${color}:${bucket}`;
    let sprite = foodSprites.get(key);
    if (sprite) return sprite;
    const glow = 5,
      size = Math.ceil((bucket + glow) * 2),
      center = size / 2,
      surface = document.createElement("canvas"),
      sctx = surface.getContext("2d");
    surface.width = surface.height = size;
    const gradient = sctx.createRadialGradient(
      center,
      center,
      Math.max(0, bucket * 0.35),
      center,
      center,
      bucket + glow,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(Math.min(0.95, bucket / (bucket + glow)), color);
    gradient.addColorStop(1, "transparent");
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, size, size);
    sprite = { surface, size };
    foodSprites.set(key, sprite);
    return sprite;
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#070914";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    const b = worldBounds(80);
    ctx.strokeStyle = "#171d36";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(b.left / 100) * 100; x < b.right; x += 100) {
      ctx.moveTo(x, b.top);
      ctx.lineTo(x, b.bottom);
    }
    for (let y = Math.floor(b.top / 100) * 100; y < b.bottom; y += 100) {
      ctx.moveTo(b.left, y);
      ctx.lineTo(b.right, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#ff547055";
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, WORLD, WORLD);
    drawBlackHoles(b);
    drawPowerUps(b);
    ctx.globalCompositeOperation = "lighter";
    const visibleFoods =
      state === "guest"
        ? foods
        : C.nearby(
            foodGrid,
            camera.x,
            camera.y,
            (Math.max(w, h) / camera.zoom) * 0.8 + 150,
          );
    const pulseTime = performance.now() * 0.004;
    for (const f of visibleFoods) {
      if (
        f.eaten ||
        f.x < b.left ||
        f.x > b.right ||
        f.y < b.top ||
        f.y > b.bottom
      )
        continue;
      const r =
        C.foodRadius(f.visualValue ?? f.value, camera.zoom) +
        Math.sin(pulseTime + f.pulse) * 0.45;
      const sprite = foodSprite(f.color, r);
      ctx.drawImage(
        sprite.surface,
        f.x - sprite.size / 2,
        f.y - sprite.size / 2,
      );
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    for (const s of alive) if (s !== player) drawSnake(s, b);
    if (player?.alive) drawSnake(player, b);
    for (const p of particles) {
      if (p.x < b.left || p.x > b.right || p.y < b.top || p.y > b.bottom)
        continue;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + p.life * 4, 0, C.TAU);
      ctx.fill();
    }
    for (const fx of warpEffects) {
      ctx.globalAlpha = Math.max(0, fx.life);
      ctx.strokeStyle = "#d07bff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 35 + (1 - fx.life) * 110, 0, C.TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (frameNo % 3 === 0 || state !== "playing") drawMap();
  }
  function drawPowerUps(b) {
    const pulseTime = performance.now() * 0.004;
    for (const p of powerUps) {
      if (p.x < b.left || p.x > b.right || p.y < b.top || p.y > b.bottom)
        continue;
      const info = powerTypes[p.type],
        radius = 15 + Math.sin(pulseTime + p.pulse) * 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = "#080b17";
      ctx.strokeStyle = info.color;
      ctx.shadowColor = info.color;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, C.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = info.color;
      ctx.font = "900 17px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(info.symbol, 0, 1);
      ctx.restore();
    }
  }
  function drawBlackHoles(b) {
    const now = performance.now() * 0.0025;
    for (const h of blackHoles) {
      if (
        h.x < b.left - 80 ||
        h.x > b.right + 80 ||
        h.y < b.top - 80 ||
        h.y > b.bottom + 80
      )
        continue;
      const pulse = Math.sin(now * 2 + h.phase) * 4;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(now + h.phase);
      ctx.strokeStyle = "#a95cff";
      ctx.shadowColor = "#8b45ff";
      ctx.shadowBlur = 20;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 50 + pulse, 0.2, 4.8);
      ctx.stroke();
      ctx.rotate(-now * 1.8);
      ctx.strokeStyle = "#56d9ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 66 - pulse, 0, C.TAU * 0.72);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#010108";
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, C.TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  function drawSnake(s, b) {
    if (s.powers?.invisible > 0) ctx.globalAlpha = 0.16;
    const width = C.bodyWidth(s.score);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let drawing = false;
    const step = camera.zoom < 0.8 ? 2 : 1;
    for (let i = s.points.length - 1; i >= 0; i -= step) {
      const p = s.points[i],
        visible =
          p.x > b.left - 40 &&
          p.x < b.right + 40 &&
          p.y > b.top - 40 &&
          p.y < b.bottom + 40;
      if (!visible) {
        drawing = false;
        continue;
      }
      if (!drawing) {
        ctx.moveTo(p.x, p.y);
        drawing = true;
      } else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "#02040b";
    ctx.lineWidth = width + 6;
    ctx.stroke();
    ctx.strokeStyle = s.color;
    // Blurring every long body path is very costly. A wider translucent pass
    // gives boosted snakes a glow without forcing a full-canvas blur.
    if (s.boost) {
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = width + 10;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([2, 13]);
    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    if (s.x < b.left || s.x > b.right || s.y < b.top || s.y > b.bottom) {
      ctx.globalAlpha = 1;
      return;
    }
    const nx = -Math.sin(s.a),
      ny = Math.cos(s.a),
      fx = Math.cos(s.a) * 4,
      fy = Math.sin(s.a) * 4;
    for (const side of [-1, 1]) {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(
        s.x + fx + nx * side * 4,
        s.y + fy + ny * side * 4,
        2.8,
        0,
        C.TAU,
      );
      ctx.fill();
      ctx.fillStyle = "#101426";
      ctx.beginPath();
      ctx.arc(
        s.x + fx * 1.5 + nx * side * 4,
        s.y + fy * 1.5 + ny * side * 4,
        1.2,
        0,
        C.TAU,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#dce3ff";
    ctx.font = "600 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(s.name, s.x, s.y - 18);
    ctx.globalAlpha = 1;
  }
  function renderLeaders() {
    const top = [...alive].sort((a, b) => b.score - a.score).slice(0, 8);
    $("#leaders").innerHTML = top
      .map(
        (s) =>
          `<li class="${s === player ? "me" : ""}">${escapeHtml(s.name)} <b>${s.score | 0}</b></li>`,
      )
      .join("");
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function drawMap() {
    mctx.clearRect(0, 0, 150, 150);
    mctx.strokeStyle = "#6571a055";
    mctx.beginPath();
    mctx.arc(75, 75, 72, 0, C.TAU);
    mctx.stroke();
    for (const s of snakes) {
      if (!s.alive) continue;
      mctx.fillStyle = s === player ? "#fff" : s.color;
      mctx.beginPath();
      mctx.arc(
        (s.x / WORLD) * 140 + 5,
        (s.y / WORLD) * 140 + 5,
        s === player ? 3 : 1.5,
        0,
        C.TAU,
      );
      mctx.fill();
    }
  }
  function wsUrl(room, role) {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${location.host}/slider-online?room=${encodeURIComponent(room)}&role=${role}`;
  }
  function setOnlineMessage(message, error = false) {
    const el = $("#onlineMessage");
    el.textContent = message;
    el.classList.toggle("error", error);
  }
  function randomRoom() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      bytes = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }
  function connect(role, room) {
    if (net.ws) net.ws.close();
    net.role = role;
    net.room = room.toUpperCase();
    setOnlineMessage("Connecting…");
    const ws = new WebSocket(wsUrl(net.room, role));
    net.ws = ws;
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "error") {
        setOnlineMessage(msg.message || "Unable to join.", true);
        ws.close();
        return;
      }
      if (msg.type === "room_ready" && role === "host") {
        setOnlineMessage(`Room ${net.room} is open — share this code.`);
        $("#roomCode").textContent = net.room;
        start("host");
      }
      if (msg.type === "join_accept" && role === "guest") {
        setOnlineMessage("Joined match.");
        state = "guest";
        for (const c of "menu gameover paused".split(" "))
          $("#" + c).classList.add("hidden");
        $("#hud").classList.remove("hidden");
        $("#roomCode").textContent = net.room;
      }
      if (msg.type === "guest_joined" && role === "host") {
        net.hasGuest = true;
        const old = snakes.find((s) => s.id === "guest");
        if (!old || !old.alive) {
          const p = safeSpawn(),
            guest = makeSnake(
              "guest",
              msg.name || "Online Slider",
              skins[(skin + 3) % skins.length],
              p.x,
              p.y,
              false,
            );
          guest.score = 50;
          if (old) snakes[snakes.indexOf(old)] = guest;
          else snakes.push(guest);
        }
        setOnlineMessage("Online player joined.");
      }
      if (msg.type === "input" && role === "host")
        net.remoteInput = {
          target: Number(msg.target) || 0,
          boost: !!msg.boost,
        };
      if (msg.type === "state" && role === "guest") applySnapshot(msg);
      if (msg.type === "guest_dead" && role === "guest") showGuestLoss();
      if (msg.type === "peer_left") {
        if (role === "host") net.hasGuest = false;
        setOnlineMessage("The other online player disconnected.", true);
      }
    };
    ws.onerror = () => setOnlineMessage("Online connection failed.", true);
    ws.onclose = () => {
      if (role === "guest" && state === "guest")
        setOnlineMessage("Disconnected from match.", true);
    };
  }
  function sendHost(payload) {
    if (net.role === "host" && net.ws?.readyState === WebSocket.OPEN)
      net.ws.send(JSON.stringify(payload));
  }
  function sendSnapshot() {
    const guest = snakes.find((s) => s.id === "guest");
    if (!guest?.alive || net.ws?.readyState !== WebSocket.OPEN) return;
    const radius = 1500,
      snapshotSnakes = snakes
        .filter((s) => s.alive)
        .map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          x: s.x,
          y: s.y,
          a: s.a,
          speed: s.speed,
          score: s.score,
          alive: s.alive,
          boost: s.boost,
          points: s.points.filter(
            (p, i) => i % 2 === 0 && C.dist2(p, guest) < radius * radius,
          ),
        }));
    const snapshotFoods = C.nearby(foodGrid, guest.x, guest.y, 1350)
      .filter((f) => !f.eaten)
      .map(({ x, y, value, visualValue, color, pulse }) => ({
        x,
        y,
        value,
        visualValue,
        color,
        pulse,
      }));
    sendHost({
      type: "state",
      mode: gameMode,
      world: WORLD,
      build: window.SLIDER_BUILD,
      snakes: snapshotSnakes,
      foods: snapshotFoods,
      blackHoles,
    });
  }
  function applySnapshot(msg) {
    const previous = player && { x: player.x, y: player.y };
    gameMode = msg.mode || gameMode;
    snakes = msg.snakes || [];
    foods = msg.foods || [];
    blackHoles = msg.blackHoles || blackHoles;
    alive = snakes.filter((s) => s.alive);
    player = snakes.find((s) => s.id === "guest");
    if (!player) return;
    if (previous && C.dist2(previous, player) > 500 * 500) flashWarp();
    if (!camera.ready) {
      camera.x = player.x;
      camera.y = player.y;
      camera.ready = true;
    }
    if (!player.alive) showGuestLoss();
    updateHud();
  }
  function updateGuest(dt, now) {
    if (!player) return;
    camera.x += (player.x - camera.x) * Math.min(1, dt * 7);
    camera.y += (player.y - camera.y) * Math.min(1, dt * 7);
    camera.zoom +=
      (C.clamp(1.14 - player.score / 900, 0.72, 1) - camera.zoom) * dt * 2;
    let dx = pointer.x - w / 2,
      dy = pointer.y - h / 2;
    if (keys.ArrowLeft || keys.a) dx = -200;
    if (keys.ArrowRight || keys.d) dx = 200;
    if (keys.ArrowUp || keys.w) dy = -200;
    if (keys.ArrowDown || keys.s) dy = 200;
    const target = dx || dy ? Math.atan2(dy, dx) : player.a,
      boost = (pointer.down || keys[" "] || keys.Shift) && player.score > 38;
    if (now - net.lastInput > 50 && net.ws?.readyState === WebSocket.OPEN) {
      net.lastInput = now;
      net.ws.send(JSON.stringify({ type: "input", target, boost }));
    }
  }
  function showGuestLoss() {
    if (net.guestEnded) return;
    net.guestEnded = true;
    $("#resultLabel").textContent = "SIGNAL LOST";
    $("#resultCaption").textContent = "online match continues";
    $("#finalScore").textContent = player?.score | 0;
    $("#best").textContent = "Late-join slot remains occupied";
    $("#hud").classList.add("hidden");
    $("#gameover").classList.remove("hidden");
  }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    if (state === "playing") updateHooverTimers(dt);
    update(dt, now);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function pause(toggle = true) {
    if (state === "playing" && toggle) {
      state = "paused";
      $("#paused").classList.remove("hidden");
    } else if (state === "paused") {
      state = "playing";
      $("#paused").classList.add("hidden");
      last = performance.now();
    }
  }
  function quitToMenu() {
    if (net.ws) {
      net.ws.close();
      net.ws = null;
    }
    net.role = "solo";
    ending = true;
    state = "menu";
    player = null;
    snakes = [];
    alive = [];
    foods = [];
    particles = [];
    blackHoles = [];
    warpEffects = [];
    foodGrid = C.makeGrid([]);
    segmentGrid = C.makeGrid([]);
    pointer.down = false;
    for (const c of "hud gameover paused".split(" "))
      $("#" + c).classList.add("hidden");
    $("#menu").classList.remove("hidden");
    tone(210, 0.08);
  }
  function requestQuit() {
    if (state !== "playing" && state !== "paused") return;
    $("#quitConfirm").classList.remove("hidden");
  }
  function cancelQuit() {
    $("#quitConfirm").classList.add("hidden");
  }
  function confirmQuit() {
    cancelQuit();
    hoover = false;
    hooverRemaining = 0;
    hooverCooldown = 0;
    updateHooverButton();
    quitToMenu();
  }
  canvas.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  canvas.addEventListener("pointerdown", (e) => {
    pointer.down = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  addEventListener("pointerup", () => (pointer.down = false));
  addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "p" || e.key === "P" || e.key === "Escape") pause();
    if (
      (e.key === "q" || e.key === "Q") &&
      (state === "playing" || state === "paused")
    )
      requestQuit();
    if ((e.key === "e" || e.key === "E") && state === "playing")
      activateHoover();
    if (e.key === "m" || e.key === "M") {
      muted = !muted;
      localStorage.sliderMuted = muted ? "1" : "0";
    }
  });
  addEventListener("keyup", (e) => (keys[e.key] = false));
  addEventListener("blur", () => {
    if (state === "playing" && net.role !== "guest") pause();
  });
  $("#play").onclick = () => {
    net.role = "solo";
    hoover = false;
    hooverRemaining = 0;
    hooverCooldown = 0;
    updateHooverButton();
    start("solo");
  };
  $("#hostOnline").onclick = () => connect("host", randomRoom());
  $("#joinOnline").onclick = () => {
    const room = $("#joinCode").value.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(room)) {
      setOnlineMessage("Enter a valid 6-character room code.", true);
      return;
    }
    connect("guest", room);
  };
  $("#again").onclick = () => {
    if (net.role === "guest") {
      location.reload();
      return;
    }
    hoover = false;
    hooverRemaining = 0;
    hooverCooldown = 0;
    updateHooverButton();
    start(net.role);
  };
  $("#pauseBtn").onclick = () => pause();
  $("#hooverBtn").onclick = activateHoover;
  $("#quitBtn").onclick = requestQuit;
  $("#quitPaused").onclick = requestQuit;
  $("#quitCancel").onclick = cancelQuit;
  $("#quitYes").onclick = confirmQuit;
  $("#resume").onclick = () => pause(false);
  $("#name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") start("solo");
  });
})();
