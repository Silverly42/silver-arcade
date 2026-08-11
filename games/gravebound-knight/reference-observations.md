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
| Player body | 12 × 26 pixels |
| Walk speed | 1.6 pixels/tick |
| Jump velocity | 4.65 pixels/tick |
| Gravity | 0.21 pixels/tick² |
| Lance speed | 3.65 pixels/tick |
| Fire cooldown | 12 ticks |
| Maximum player bolts | 3 |
| Ladder speed | 1.25 pixels/tick |
| Post-hit invulnerability | 75 ticks |
| Respawn delay | 48 ticks |
| Area timer | 150 seconds |

## Deliberate differences

- Entirely original title, story, characters, silhouettes, palette, sound synthesis, and level geometry.
- A single continuous horizontal vertical-slice level rather than copied screens.
- Checkpoints provide a safer retry position while the area timer continues.
- A visible boss health bar and portal provide clearer modern feedback.
- Keyboard and touch controls are supported.
- Enemy behaviour is deterministic enough for repeatable tests, with small timing variations for liveliness.
- Six ticks of coyote time and seven ticks of input buffering are deliberate modern accessibility concessions; the airborne direction remains fixed.
