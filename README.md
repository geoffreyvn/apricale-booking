# apricale-booking

Application de réservation d'un appartement à Apricale (Italie).
**Projet pilote de la Software Factory IA** — premier produit passé par la chaîne
complète, de la spec au déploiement.

## Périmètre

| Domaine | Statut |
|---|---|
| Présentation de l'appartement | à venir |
| Profils utilisateurs | à venir |
| Agenda de disponibilité | à venir |
| Réservations | **SF-001 — détection de chevauchement** |
| Encaissement | **hors périmètre** (DSP2, PCI — sujets à part entière) |

## Commandes

Toutes les commandes passent par `mise run` — voir `AGENTS.md`.

```
mise run setup      # installer les dépendances
mise run verify     # lint + typecheck + test + sécurité
```

## Gouvernance

Ce dépôt suit la constitution de la Software Factory IA, copiée dans
`.specify/memory/constitution.md`. **Sa source de vérité est le dépôt
`factory-workspace`** : tout amendement s'y fait d'abord, puis se propage ici.

