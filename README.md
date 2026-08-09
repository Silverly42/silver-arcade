# Silver Arcade

One repository for the Silver browser-game catalogue. The first title is **Slider.io**, an original neon snake-arena game.

## Run

```bash
npm start
```

Open `http://localhost:4173`. Run checks with `npm test` and create a static deployment in `dist/` with `npm run build`.

The Node server is required for online play because it provides the same-origin WebSocket relay. Static hosting (including a plain itch.io HTML upload) still supports the full solo/bot game, but needs a separately hosted relay before online rooms can work.

## Online match (currently disabled)

The online controls are hidden in build `1.2.0-beta.3` while multiplayer is on hold. The tested relay and client code remain dormant for later re-enabling; solo and bot play do not load or use an online connection.

1. The host selects **Host Online Match** and starts playing immediately.
2. Share the six-character room code shown in the HUD.
3. One guest enters that code and selects **Join**. The guest spawns safely into the current match without resetting it.
4. A second guest is rejected with a clear slot-occupied message.

The host browser is authoritative for gameplay. The relay validates room codes and message types, limits message size/rate, and stores no credentials or secrets.

## Performance

Food lookup and body collisions use spatial grids instead of repeated full-array scans. UI and network snapshots are throttled, particle counts and body history are bounded, and rendering culls off-screen objects. Elite final-five AI adds predictive pursuit, danger avoidance, boost timing, target selection, and trapping behavior.

Four lightweight animated black holes act as wormholes. Their pull is visible, entry preserves the snake and score, paired exits are safety-checked, and a cooldown prevents immediate re-entry. Normal bots avoid accidental entry while elite bots can use a wormhole as a tactical shortcut. The menu and in-game HUD show the exact build identifier (`1.2.0-beta.3`).

End-game performance is protected by a hard world-food budget, sampled death drops that preserve their score value, a cached food index refreshed every four frames, direct body-array truncation, and less frequent HUD/leaderboard work. Build `1.2.0-beta.4` adds an optional Food Hoover: use the HUD button or `H` to pull nearby pellets toward the player.

## Controls

- Mouse, touch, or arrow/WASD keys: steer
- Hold mouse/touch, Space, or Shift: boost
- P or Escape: pause
- M: mute

Progress and preferences are saved locally in the browser.
