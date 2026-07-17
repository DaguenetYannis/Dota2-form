# Player questionnaire UX specification

This document specifies the player-facing questionnaire content and answer-control contract for the current `ProfileForm`.

Scope: documentation and design only. It does not change domain entities, repository contracts, persistence, Supabase, or the current UI.

## Current Code Observations

- The current form stores ten profile variables: `mainRole`, `secondaryRoles`, `farmPriority`, `preferredGamePace`, `cooldownDependencyComfort`, `sacrificeComfort`, `shotCallingComfort`, `preferredFightPositions`, `preferredIndividualPlaystyles`, and `preferredTeamPlaystyles`.
- Several current labels are abbreviated and feel database-like: `Role principal`, `Priorite farm`, `Confort cooldowns`, `Shotcalling`.
- Multiple labels currently miss French accents: `rôles`, `priorité`, `préféré`, `décisions`, `créateur`, `dégâts`, `contrôle`.
- `RatingSelect` is generic, but the numeric fields represent different kinds of decisions. Each scale needs specific endpoint labels.
- Several unrelated decisions currently share one `FormSection` card. This is efficient, but not ideal for a questionnaire because it weakens focus.
- A `pseudonym` fallback field remains in `ProfileForm`, even though the normal player flow resolves pseudo before `/player`.
- Labels live in `src/lib/labels.ts`, which is an appropriate presentation layer for display text. The current file needs accent cleanup and option descriptions if/when the UI is implemented.
- Stable vocabulary IDs in `src/domain/value-objects/vocabularies.ts` should not be renamed for presentation purposes.

## Question Card Anatomy

Each player-facing decision should use a reusable question card with:

- Optional section label: short grouping, for example `Tes rôles`.
- Complete question: one full sentence addressed to the player.
- Helper text: concise explanation of how to answer or why it matters.
- Answer control: the recommended UI component for that specific decision.
- Answer labels: scale endpoints, option labels, and optional option descriptions.
- Validation message: shown only when the answer is required or invalid.
- Save status: shown at section or page level, not repeated on every card unless autosave becomes per-question.

Recommendation: one principal decision per visual card. A card may include supporting helper text, but should not mix unrelated controls.

## Current Questions Contract

| Stable field | Player-facing question | Helper text | Answer type | Recommended control | Stored value | Accessibility | Future domain change required? |
|---|---|---|---|---|---|---|---|
| `mainRole` | Quel rôle préfères-tu jouer lorsque tu peux choisir librement ? | Choisis le rôle dans lequel tu te sens le plus utile et le plus naturel. | Single choice | Position cards | One `RoleId` | Use a radio group with one accessible label per position. | No. Presentation-only. |
| `secondaryRoles` | Quels autres rôles peux-tu jouer confortablement dans une partie sérieuse ? | Sélectionne seulement les rôles que tu peux assumer sans désorganiser l’équipe. | Multi choice | Multi-select chips | `RoleId[]` | Keep real checkbox inputs; whole chip label clickable. | No. Validation changes only if min/max is added. |
| `farmPriority` | De combien de ressources as-tu généralement besoin pour avoir un impact dans la partie ? | Évalue ton besoin en farm, niveaux et objets avant d’être vraiment efficace. | 1-5 scale | Five-point segmented scale | Number `1` to `5` | Radio group or segmented buttons with visible endpoint text. | No. Presentation-only. |
| `preferredGamePace` | Quel rythme de jeu préfères-tu donner à la partie ? | Indique si tu préfères attendre les fenêtres sûres ou créer rapidement de l’action. | 1-5 bipolar scale | Five-point bipolar segmented scale | Number `1` to `5` | Radio group with explicit low/high meaning. | No. Presentation-only. |
| `cooldownDependencyComfort` | À quel point es-tu à l’aise avec des héros dont l’impact dépend de longs temps de recharge ? | Certains héros ont de longues fenêtres faibles après leurs sorts clés. | 1-5 scale | Five-point segmented scale | Number `1` to `5` | Avoid color-only meaning; include text endpoints. | No. Presentation-only. |
| `sacrificeComfort` | À quel point es-tu prêt à sacrifier ton farm, ton positionnement ou ta survie pour créer un avantage collectif ? | Cela mesure ton confort avec les actions utiles mais coûteuses pour toi. | 1-5 scale | Five-point segmented scale | Number `1` to `5` | Clarify that low value is not “bad”; it means resource protection. | No. Presentation-only. |
| `shotCallingComfort` | À quel point souhaites-tu prendre la parole pour orienter les décisions de l’équipe ? | Indique ton envie de proposer des calls, pas ton niveau mécanique. | 1-5 scale | Five-point segmented scale | Number `1` to `5` | Make all options keyboard reachable. | No. Presentation-only. |
| `preferredFightPositions` | Où préfères-tu te positionner pendant les combats d’équipe ? | Tu peux choisir plusieurs zones si ton positionnement varie selon le héros. | Multi choice | Ordered visual multi-selection from frontline to backline | `FightPositionId[]` | Real checkboxes; visual order must not be the only cue. | No for multi-select. New field needed if order is stored. |
| `preferredIndividualPlaystyles` | Quelles manières de jouer correspondent le mieux à ce que tu aimes faire en partie ? | Choisis les styles qui décrivent tes actions naturelles en jeu. | Multi choice | Descriptive option cards | `IndividualPlaystyleId[]` | Checkbox cards with title and description. | No for selection. Validation/new fields for ranking or max choices. |
| `preferredTeamPlaystyles` | Quels types de plans de jeu aimerais-tu que l’équipe privilégie ? | Ces réponses aident à aligner les drafts et le plan collectif. | Multi choice | Descriptive option cards; future ranking possible | `TeamPlaystyleId[]` | Checkbox cards; avoid relying on Dota jargon alone. | No for selection. New fields needed for ranking. |

## Scale Labels

Use segmented radio controls rather than a native select for these fields in a future UI pass. These are not all identical “ratings”; each scale has its own semantic axis.

### `farmPriority`

- Question: De combien de ressources as-tu généralement besoin pour avoir un impact dans la partie ?
- 1: Très peu de ressources
- 3: Besoin modéré
- 5: Beaucoup de ressources
- Control: five-point segmented scale.
- Rationale: true continuum from low-resource impact to high-resource dependency.

### `preferredGamePace`

- Question: Quel rythme de jeu préfères-tu donner à la partie ?
- 1: Patient et réactif
- 3: Adaptable
- 5: Rapide et proactif
- Control: five-point bipolar scale.
- Rationale: true strategic continuum. A slider could work, but segmented choices are clearer and easier to explain.

### `cooldownDependencyComfort`

- Question: À quel point es-tu à l’aise avec des héros dont l’impact dépend de longs temps de recharge ?
- 1: Je préfère être disponible souvent
- 3: Ça dépend du héros
- 5: Les longs cooldowns ne me dérangent pas
- Control: five-point segmented scale.
- Rationale: measures comfort, not objective skill.

### `sacrificeComfort`

- Question: À quel point es-tu prêt à sacrifier ton farm, ton positionnement ou ta survie pour créer un avantage collectif ?
- 1: Je protège mes ressources
- 3: Je peux sacrifier si le call est clair
- 5: Je peux beaucoup sacrifier pour l’équipe
- Control: five-point segmented scale.
- Rationale: true continuum, but wording must avoid judging low values.

### `shotCallingComfort`

- Question: À quel point souhaites-tu prendre la parole pour orienter les décisions de l’équipe ?
- 1: Je préfère suivre les décisions
- 3: Je propose quand l’occasion est claire
- 5: J’aime guider les décisions
- Control: five-point segmented scale.
- Rationale: measures communication preference. It should not imply that every player must shotcall.

## Vocabulary Descriptions

These descriptions are player-facing copy. Stable IDs remain unchanged.

### Roles

| ID | Label | Description |
|---|---|---|
| `position_1` | Position 1 | Carry principal, souvent prioritaire en farm et en scaling. |
| `position_2` | Position 2 | Midlaner, responsable du tempo et des premiers mouvements clés. |
| `position_3` | Position 3 | Offlaner, souvent créateur d’espace, d’initiation ou de pression. |
| `position_4` | Position 4 | Support mobile, actif sur la carte et les rotations. |
| `position_5` | Position 5 | Hard support, stabilité de lane, vision et protection de l’équipe. |

### Fight Positions

| ID | Label | Description |
|---|---|---|
| `frontline` | Frontline | Jouer devant pour engager, absorber la pression ou révéler les positions ennemies. |
| `second_wave` | Deuxième vague | Entrer juste après l’initiation pour enchaîner ou retourner le combat. |
| `backline` | Backline | Rester derrière pour infliger des dégâts, sauver ou contrôler à distance. |
| `flank` | Flanc | Arriver depuis un côté pour surprendre une cible ou casser la formation adverse. |
| `high_ground` | Hauteur | Utiliser la vision et le terrain pour contrôler l’entrée du combat. |

### Individual Playstyles

| ID | Label | Description |
|---|---|---|
| `initiator` | Initiateur | Ouvrir les combats et forcer l’équipe ennemie à réagir. |
| `hunter` | Chasseur | Chercher les héros isolés et punir les erreurs de positionnement. |
| `timing_playmaker` | Créateur de timing | Exploiter un niveau, un objet ou un cooldown pour créer une fenêtre forte. |
| `second_wave` | Deuxième vague | Attendre la première action puis entrer au bon moment pour décider le combat. |
| `frontliner` | Frontliner | Jouer au contact et permettre aux alliés de jouer derrière toi. |
| `protector` | Protecteur | Sauver, couvrir ou sécuriser les héros importants de l’équipe. |
| `teamfight_controller` | Contrôle teamfight | Structurer le combat avec des contrôles, zones ou sorts de disruption. |
| `damage_dealer` | Dégâts | Prioriser la pression de dégâts dans les combats et objectifs. |
| `tempo_player` | Tempo | Accélérer la partie par des mouvements fréquents et des prises d’initiative. |
| `resource_player` | Ressources | Transformer farm, niveaux et objets en impact plus tardif. |
| `split_pusher` | Split push | Mettre la pression sur les lanes et forcer l’ennemi à se séparer. |
| `objective_player` | Objectifs | Jouer autour des tours, Roshan, lanes et timings collectifs. |
| `enabler` | Facilitateur | Rendre les actions des alliés plus faciles par les saves, buffs, contrôles ou placements. |
| `flexible` | Flexible | Adapter ton rôle selon la draft, les besoins de l’équipe et l’état de la partie. |

### Team Playstyles

| ID | Label | Description |
|---|---|---|
| `fast_tempo` | Tempo rapide | Jouer vite, prendre l’initiative et convertir les premiers avantages. |
| `pickoff` | Pick-off | Chercher des éliminations ciblées avant de prendre objectifs ou vision. |
| `teamfight` | Teamfight | Construire autour de combats groupés et de gros timings de sorts. |
| `protect_one` | Protéger un core | Jouer pour sécuriser la partie d’un héros central. |
| `split_map` | Split map | Étirer la carte, éviter les combats forcés et gagner par pression latérale. |
| `late_game_control` | Contrôle du late game | Stabiliser la partie et jouer pour des timings tardifs maîtrisés. |
| `objective_control` | Contrôle des objectifs | Prioriser les tours, Roshan, zones de vision et accès à la carte. |

## Related Questions

Questions that may share one visual section:

- `mainRole` and `secondaryRoles`: same theme, but should still be two distinct question cards.
- `preferredIndividualPlaystyles` and `preferredTeamPlaystyles`: both discuss style, but one is individual behavior and the other is team plan. They may sit in the same section, not the same card.
- Numeric comfort scales can share a section called `Ton rythme de jeu`, but should be separate cards because each axis has different meaning.

Questions that should remain separate:

- `farmPriority` and `preferredGamePace`: resource dependency is not the same as strategic pace.
- `sacrificeComfort` and `shotCallingComfort`: one is self-cost, the other is communication preference.
- `preferredFightPositions` and `preferredIndividualPlaystyles`: position in fights is spatial; playstyle is behavioral.

## Future Conditional Questions

These are useful later, but require schema or validation decisions and must not be added in the current implementation.

- Role-specific follow-up questions after `mainRole`.
- Preferred archetype within the selected main role, such as farming carry, tempo mid, aura offlaner, roaming support, defensive hard support.
- Role-specific hero expectations, such as lane stability, initiation need, wave clear, save, tower damage, Roshan damage.
- Conditional questions based on selected playstyles. Example: if `initiator` is selected, ask whether the player prefers hard commits or soft initiation.
- Ranking selected individual or team playstyles.
- Limiting selected styles to a maximum number and asking the player to prioritize.
- Recording ordered fight positions instead of unordered selections.

## Domain-Compatibility Matrix

| Proposed improvement | Compatibility |
|---|---|
| Replace abbreviated labels with full-sentence questions | Presentation-only. |
| Add French accents and typographic cleanup | Presentation-only. |
| Add helper text per question | Presentation-only. |
| Add endpoint labels to 1-5 fields | Presentation-only. |
| Replace `RatingSelect` with segmented 1-5 controls | Presentation-only if stored numbers remain unchanged. |
| Replace role select with single-choice position cards | Presentation-only if stored `RoleId` remains unchanged. |
| Replace checkbox lists with chips or cards | Presentation-only if stored arrays remain unchanged. |
| Add option descriptions for playstyles and positions | Presentation-only. |
| Limit number of selected individual playstyles | Validation change. No new stored field required. |
| Require at least one fight position | Validation change. No new stored field required. |
| Rank selected playstyles | New stored field or changed field semantics required. |
| Record preference order for fight positions | New stored field or changed field semantics required. |
| Add conditional role-specific questions | New stored fields and questionnaire flow changes required. |
| Add role-specific hero expectations | New stored fields required. |

## Recommended Final Wording

1. `mainRole`: Quel rôle préfères-tu jouer lorsque tu peux choisir librement ?
2. `secondaryRoles`: Quels autres rôles peux-tu jouer confortablement dans une partie sérieuse ?
3. `farmPriority`: De combien de ressources as-tu généralement besoin pour avoir un impact dans la partie ?
4. `preferredGamePace`: Quel rythme de jeu préfères-tu donner à la partie ?
5. `cooldownDependencyComfort`: À quel point es-tu à l’aise avec des héros dont l’impact dépend de longs temps de recharge ?
6. `sacrificeComfort`: À quel point es-tu prêt à sacrifier ton farm, ton positionnement ou ta survie pour créer un avantage collectif ?
7. `shotCallingComfort`: À quel point souhaites-tu prendre la parole pour orienter les décisions de l’équipe ?
8. `preferredFightPositions`: Où préfères-tu te positionner pendant les combats d’équipe ?
9. `preferredIndividualPlaystyles`: Quelles manières de jouer correspondent le mieux à ce que tu aimes faire en partie ?
10. `preferredTeamPlaystyles`: Quels types de plans de jeu aimerais-tu que l’équipe privilégie ?

## Recommended Controls

1. `mainRole`: single-choice position cards.
2. `secondaryRoles`: multi-select chips.
3. `farmPriority`: five-point segmented scale.
4. `preferredGamePace`: five-point bipolar segmented scale.
5. `cooldownDependencyComfort`: five-point segmented scale.
6. `sacrificeComfort`: five-point segmented scale.
7. `shotCallingComfort`: five-point segmented scale.
8. `preferredFightPositions`: ordered visual multi-selection from frontline to backline.
9. `preferredIndividualPlaystyles`: multi-select descriptive cards.
10. `preferredTeamPlaystyles`: multi-select descriptive cards, with future ranking possible.

## Presentation-Only Improvements

- Full-sentence question wording.
- Accent and typography cleanup.
- Helper text for each question.
- Endpoint and midpoint scale labels.
- Question-specific segmented controls for numeric fields.
- Descriptive option cards for playstyles.
- Visual combat-position selector that still stores `FightPositionId[]`.
- Better grouping with one question card per decision.

## Improvements Requiring Domain Changes

- Ranking selected playstyles.
- Recording order of selected fight positions.
- Conditional role-specific branches.
- Preferred archetype per role.
- Role-specific hero expectations.
- Separate confidence/strength values per selected role.

## Recommended Implementation Order

### Phase 1

Full-sentence wording, accents, helper text, and endpoint labels.

### Phase 2

One `QuestionCard` per decision and question-specific controls.

### Phase 3

Descriptive option cards and visual combat-position selector.

### Phase 4

Rankings, conditional role branches, and new stored fields.
