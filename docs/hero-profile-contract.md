# Contrat du profil de héros

## Radar personnel

Le radar utilise la version de schema `2` et conserve les neuf axes existants.
Chaque axe accepte `0`, `1`, `2`, `3`, `4` ou `5`.

`null` signifie que la question n'a pas encore ete repondue. `0` signifie que
le joueur a explicitement répondu que cette qualité est absente ou négligeable.
Un `0` compte donc comme une reponse complete, alors que `null` reste incomplet.

Une valeur élevée représente une caractéristique marquée, pas un meilleur héros.
Pour la dépendance au farm, une valeur élevée représente une contrainte de
ressources.

## Ordre des héros

Les listes visibles par le joueur sont triées par nom affiché avec un collateur
français insensible aux accents et à la casse. Le tri ne modifie pas les tableaux
issus des repositories et ne change pas les ordres stockes.

## Matchups personnels

Un matchup est une evaluation subjective, directionnelle et propre au joueur.
`Phoenix` contre `Snapfire` et `Snapfire` contre `Phoenix` sont deux donnees
séparées. Aucun score inverse n'est créé automatiquement.

Le score est compris entre `0` et `6`, depuis le point de vue du héros courant :

- `0` : ce héros neutralise complètement le mien.
- `1` : le matchup est très défavorable pour mon héros.
- `2` : le matchup est plutôt défavorable pour mon héros.
- `3` : le matchup n'est ni favorable ni défavorable.
- `4` : le matchup est plutôt favorable pour mon héros.
- `5` : le matchup est très favorable pour mon héros.
- `6` : mon héros est un contre naturel de celui-ci.

L'absence de ligne signifie non évalué. Le score `3` n'est jamais créé par
défaut.

Les groupes d'affichage sont :

- `0..2` : matchups à éviter ou à envisager de bannir.
- `3` : matchups neutres.
- `4..6` : matchups favorables.

La suppression d'une évaluation de matchup ne supprime aucun héros.

## Timing de combat core

Le timing de combat est propre au profil joueur-héros. Il décrit la fenêtre à
partir de laquelle le joueur souhaite commencer à rejoindre activement les
combats avec ce héros dans une partie normale.

La section s'applique aux profils joués en position `1`, `2` ou `3`. Les
positions `4` et `5` ne la rendent pas obligatoire.

Les champs sont `fightEntryStartMinute` et `fightEntryEndMinute`.

- `null/null` signifie non renseigné ou non applicable.
- Les deux valeurs doivent etre presentes ensemble.
- Les valeurs sont des entiers de `0` a `60`.
- `0` est une minute valide.
- `60` s'affiche comme `60 min ou plus`.
- La borne de debut ne peut pas depasser la borne de fin.
