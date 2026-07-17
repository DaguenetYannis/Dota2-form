# Hero Radar Metrics

The hero radar describes the player's subjective understanding and use of a
hero. It is not an objective game-stat model, a meta-strength rating, or a
mechanical-skill score.

## Version 2 Metrics

Version 2 is the active schema. Its fixed circular order is:

1. `mobility` - Mobilite
2. `hero_damage` - Degats aux heros
3. `farm_dependency` - Dependance au farm
4. `building_damage` - Degats aux batiments
5. `enabler` - Enabler
6. `save` - Save
7. `control` - Controle
8. `teamfight` - Teamfight
9. `initiation` - Initiation

Each value is `1`, `2`, `3`, `4`, `5`, or `null` when unanswered.

## Definitions

Mobilite: ability to move, join an action, cross terrain, engage, disengage, or
reposition. This is broader than movement speed.

Degats aux heros: ability to threaten enemy heroes through burst, sustained
damage, or real offensive pressure.

Dependance au farm: amount of farm, levels, and items required before the hero
can perform its function. A high value is a constraint, not an advantage.

Degats aux batiments: ability to convert a window into tower, barracks, or
Ancient damage.

Enabler: ability to make allied actions easier or stronger through buffs,
non-urgent healing, resources, information, positioning, or preparation.

Save: ability to directly prevent an ally from dying or extract them from a
dangerous situation.

Controle: ability to limit enemy movement, actions, or decisions.

Teamfight: overall ability to affect the structure and flow of a fight involving
several heroes. It is not the arithmetic sum of damage, control, save, and
initiation.

Initiation: ability to deliberately start a favorable engagement and force an
enemy response.

## Conceptual Regions

These regions explain how to read adjacent axes. They are not automatic
archetypes and are not exhaustive hero classes.

Chasseur: Initiation, Mobilite, Degats aux heros.

Core / Pusher: Degats aux heros, Dependance au farm, Degats aux batiments.

Support / Facilitateur: Enabler, Save, Controle.

Teamfight / Engagement: Controle, Teamfight, Initiation.

## Versioning Policy

Version 1 used different metrics:

- `initiation`
- `pickoff`
- `timing_playmaking`
- `teamfight_control`
- `damage_pressure`
- `utility_protection`
- `map_objective_pressure`
- `resource_dependency`

Version 1 values are preserved as legacy records. They are not automatically
converted into version 2 because the concepts are not equivalent. The active UI
loads and saves version 2 evaluations, and a complete radar requires all nine
version 2 metrics.

## Comparison Eligibility

Hero comparison uses only complete version 2 evaluations. Legacy-only heroes and
incomplete version 2 heroes are not eligible for comparison.
