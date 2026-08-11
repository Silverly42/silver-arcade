# Gravebound Knight reference observations

## Reference status

The original TZX was not supplied to this build session. The supplied analysis document is a behavioural reference only. No original code, graphics, audio, text, names, or map data were extracted or included.

## Verified from the supplied analysis

- Target feel: a 50 Hz ZX Spectrum-era action platformer.
- Actions: walk, crouch, fixed-direction jump, ladder climb, and fire.
- Ground firing briefly stops horizontal movement; air firing preserves momentum.
- First hit removes armour; a later hit costs a life.
- Enemy roles include emerging ground threats, aimed projectile plants, flying enemies, and large charging enemies.
- A graveyard/forest progression, moving platform, boss, and exit item form the reference structure.

## Design estimates used in this original game

These values are design choices, not measurements from the TZX:

| Behaviour | Gravebound Knight value |
|---|---:|
| Simulation | fixed 50 updates/second |
| Internal display | 320 × 180 pixels |
| Player body | 12 × 20 pixels |
| Walk speed | 1.25 pixels/tick |
| Jump velocity | 4.2 pixels/tick |
| Gravity | 0.19 pixels/tick² |
| Bolt speed | 3.3 pixels/tick |
| Fire cooldown | 14 ticks |
| Maximum player bolts | 3 |
| Ladder speed | 1.0 pixels/tick |
| Post-hit invulnerability | 90 ticks |
| Respawn delay | 75 ticks |

## Deliberate differences

- Entirely original title, story, characters, silhouettes, palette, sound synthesis, and level geometry.
- A single continuous horizontal vertical-slice level rather than copied screens.
- Checkpoint activation restores a safer retry position.
- A visible boss health bar and portal provide clearer modern feedback.
- Keyboard and touch controls are supported.
- Enemy behaviour is deterministic enough for repeatable tests, with small timing variations for liveliness.

