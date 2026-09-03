# AGENTS.md — apricale-booking

## Contexte

Application de réservation d'un appartement à Apricale (Italie).
Périmètre : présentation du bien, profils utilisateurs, agenda, réservations.
**Hors périmètre : tout encaissement.**

Ce dépôt est régi par la constitution de la Software Factory IA
(`.specify/memory/constitution.md`). En cas de contradiction entre ce fichier
et la constitution, **la constitution fait foi** et ce fichier est corrigé.

## Commandes

Installer      : mise run setup
Build          : mise run build
Test (complet) : mise run test
Test (1 fichier): mise run test -- tests/unit/mon.test.ts
Lint           : mise run lint
Type-check     : mise run typecheck
Sécurité       : mise run security
Tout vérifier  : mise run verify

Jamais `npm` en direct : les commandes passent par `mise run`, pour que les
agents, les humains et l'intégration continue exécutent strictement la même chose.

## Ne jamais toucher

- `tests/acceptance/**`  — écrits par un autre modèle, dérivés des specs
- `secrets/**`
- `docs/adr/**`          — une décision s'ajoute, ne se réécrit pas
- `package-lock.json`    — sauf demande humaine explicite

## Répartition des modèles (constitution, principe II)

- `factory-architecture` : specs, tests d'acceptation, revue, décisions
- `factory-build`        : implémentation
- `factory-fast`         : messages de commit, renommages, reformulations

Un modèle n'implémente jamais contre des tests qu'il a lui-même écrits.

## Conventions

- Branches : `feat/SF-042-description-courte`
- Commits  : `feat(scope): sujet (SF-042)`
- Exports nommés uniquement ; pas d'export par défaut
- TypeScript strict : aucun `any`, aucun `@ts-ignore` sans justification en PR

## Règles de sécurité

- Aucun secret dans le code, la configuration versionnée ou l'environnement global
- Aucune dépendance nouvelle sans mention explicite en PR, avec vérification
  manuelle de son existence, de son éditeur et de son ancienneté
- Confirmation humaine avant toute suppression ou commande destructive

## Taille des changements (constitution, principe VI)

400 lignes de diff relisible au maximum. Lockfiles, fichiers générés et jeux de
données ne comptent pas. Au-delà, redécouper — sauf changement indivisible, qui
exige le label `large-pr-justified` et une justification écrite.

## Avant de terminer une tâche

- `mise run verify` sans erreur
- Chaque critère d'acceptation de la spec couvert par un test
- Aucun test désactivé, ignoré ou assoupli pour faire passer la chaîne
