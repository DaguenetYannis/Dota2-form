# Data Model

## Team

- `id`: string
- `name`: string
- `accessCode`: string
- `createdAt`: ISO date string

## Player

- `id`: string
- `teamId`: string
- `pseudonym`: non-empty string
- `mainRole`: role identifier
- `secondaryRoles`: role identifiers
- `createdAt`: ISO date string
- `updatedAt`: ISO date string

Roles: `position_1`, `position_2`, `position_3`, `position_4`, `position_5`.

## PlayerPreferences

- `playerId`: string
- `farmPriority`: integer 1-5
- `preferredGamePace`: integer 1-5
- `cooldownDependencyComfort`: integer 1-5
- `sacrificeComfort`: integer 1-5
- `shotCallingComfort`: integer 1-5
- `preferredFightPositions`: fight position identifiers
- `preferredIndividualPlaystyles`: individual playstyle identifiers
- `preferredTeamPlaystyles`: team playstyle identifiers

Fight positions: `frontline`, `second_wave`, `backline`, `flank`, `high_ground`.

Individual playstyles: `initiator`, `hunter`, `timing_playmaker`, `second_wave`, `frontliner`, `protector`, `teamfight_controller`, `damage_dealer`, `tempo_player`, `resource_player`, `split_pusher`, `objective_player`, `enabler`, `flexible`.

Team playstyles: `fast_tempo`, `pickoff`, `teamfight`, `protect_one`, `split_map`, `late_game_control`.

## Hero

- `id`: string
- `dotaId`: number
- `internalName`: string
- `displayName`: string
- `primaryAttribute`: `strength`, `agility`, `intelligence`, or `universal`
- `imageUrl`: optional string

The scaffold includes a small replaceable fixture, not the full Dota 2 catalogue.

## PlayerHero

- `id`: string
- `playerId`: string
- `heroId`: string
- `roles`: role identifiers
- `poolTier`: pool tier identifier
- `comfort`: integer 0-5
- `confidence`: integer 0-5
- `recentExperience`: integer 0-5
- `blindPickConfidence`: integer 0-5
- `flexPick`: boolean
- `preferredDraftPhase`: draft phase identifier
- `preferredPlaystyles`: individual playstyle identifiers
- `requiredAlliedFeatures`: string array
- `personalNotes`: string
- `createdAt`: ISO date string
- `updatedAt`: ISO date string

Pool tiers: `signature`, `strong`, `comfortable`, `situational`, `experimental`.

Draft phases: `early`, `middle`, `late`, `flexible`.

A player cannot have the same `heroId` twice in their hero pool.

## HeroAttributes

Shared hero attributes, separate from player-specific assessments:

- `heroId`: string
- `laneStrength`: integer 0-5
- `catch`: integer 0-5
- `save`: integer 0-5
- `heroDamage`: integer 0-5
- `towerDamage`: integer 0-5
- `waveClear`: integer 0-5
- `teamfightControl`: integer 0-5
- `roshan`: integer 0-5
- `frontline`: integer 0-5
- `mobility`: integer 0-5
- `scaling`: integer 0-5
- `cooldownDependency`: integer 0-5

## Relationships

- `Team` has many `Player` records.
- `Player` has one `PlayerPreferences` record.
- `Player` has many `PlayerHero` records.
- `Hero` has many `PlayerHero` records.
- `HeroAttributes` belongs to `Hero`.
