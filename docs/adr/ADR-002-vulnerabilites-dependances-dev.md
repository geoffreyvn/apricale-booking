# ADR-002 — Les vulnérabilités des dépendances de développement sont bloquantes

Statut : accepté
Date : 2026-09-04

## Contexte

Premier passage d'`osv-scanner` sur le projet : 5 vulnérabilités sur 3 paquets
(esbuild, vite, vitest), toutes en dépendances de développement, dont une
critique (CVSS 9.8) permettant l'exécution de code.

La pratique courante ne bloque que sur les dépendances de production : le code
de test ne part pas chez l'utilisateur.

## Décision

Dans ce dépôt, les vulnérabilités des dépendances de développement sont
bloquantes au même titre que celles de production. Aucune exclusion par
périmètre `dev`.

## Rationale

Dans une factory IA, l'outillage de développement n'est pas un environnement de
confiance manipulé par un humain attentif : c'est ce que des agents exécutent
automatiquement, en boucle, avec accès au système de fichiers, au dépôt et au
réseau. Une exécution de code arbitraire dans le lanceur de tests est un accès
direct à la machine de développement et au dépôt.

Le raisonnement « ce ne sont que des dépendances de dev » est valable dans un
projet où un humain lance les tests. Il ne l'est pas ici.

## Conséquences observées dès l'application

Corriger ces 5 vulnérabilités a imposé de monter vitest de 2.x à 5.x, dont les
exigences ont révélé que **Node 20 était en fin de vie depuis avril 2026**.
Le socle a été porté à Node 24 (LTS active, supportée jusqu'en 2028) et
`@types/node` aligné en conséquence. Motifs consignés dans `mise.toml`.

Autrement dit : un contrôle automatique a trouvé, à son premier passage, un
problème de socle que personne ne cherchait. C'est la justification empirique
de cette décision.

## Alternatives écartées

- **Exclure le périmètre dev du scan** — rejeté : supprime la visibilité sur la
  surface d'attaque la plus exposée aux agents.
- **Avertir sans bloquer** — rejeté : un avertissement récurrent devient un bruit
  qu'on cesse de lire, puis une porte qui ne protège plus.
