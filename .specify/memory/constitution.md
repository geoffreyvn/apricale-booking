<!--
RAPPORT D'IMPACT DE SYNCHRONISATION
- Changement de version : (aucune, gabarit non rempli) → 1.0.0
- Type de montée de version : MAJOR (ratification initiale — première définition
  contraignante des principes de gouvernance)
- Principes ajoutés :
  - I. Spec avant code (NON NÉGOCIABLE)
  - II. Séparation entre l'écriture des tests d'acceptation et l'implémentation (NON NÉGOCIABLE)
  - III. Traçabilité continue de l'identifiant SF-xxx
  - IV. Aucun secret hors des fichiers prévus
  - V. Vérification manuelle et indépendante de toute dépendance nouvelle
  - VI. Pull requests de 400 lignes de diff au maximum
  - VII. Intégration continue verte et approbation humaine avant clôture
- Principes modifiés : aucun (aucun principe préexistant)
- Sections ajoutées :
  - « Contraintes d'exécution de la chaîne » (emplacement 2 du gabarit)
  - « Flux de développement et portes de qualité » (emplacement 3 du gabarit)
  - « Gouvernance » (remplie)
- Sections supprimées : aucune ; les cinq emplacements de principes du gabarit ont été
  étendus à sept principes conformément à la demande.
- Titres de sections traduits en français, la constitution étant rédigée en français.
- Ajustements avant ratification : principe II précisé (indépendance par le
  modèle, non par la simple distinction d'agent) ; principe VI doté d'exclusions
  et d'une dérogation tracée par label.
- TODO reportés : aucun. Aucun jeton de substitution du gabarit ne subsiste.
- Documents dépendants à vérifier lors d'un prochain passage : `AGENTS.md`,
  `.github/workflows/`, `docs/adr/`, `specs/_TEMPLATE.md` (lus à l'exécution,
  non modifiés par cet amendement).

AMENDEMENT DU 2026-09-08 — version 1.0.0 → 1.1.0 (MINOR)
- Portée étendue aux dépôts produits par la factory.
- Principe VI : les tests d'acceptation dérivés d'une spec validée et référencée
  critère par critère sortent du plafond de diff, sous trois conditions cumulatives.
  Motif : découvert au premier usage réel, sur SF-001 (748 lignes de tests).
- Principe III : SF-000 réservé aux pull requests de gouvernance et de maintenance.
  Motif : une PR d'amendement ne se rattache à aucune spécification et échouait
  sur le contrôle d'identifiant de la CI.
-->

# Constitution du projet Software Factory IA

Cette constitution régit le dépôt `factory-workspace`, socle de la Software Factory IA,
ainsi que tous les dépôts qu'elle produit, dont `apricale-booking`. Une copie en est
déposée dans chaque dépôt produit ; la source de vérité demeure `factory-workspace`,
où tout amendement est adopté avant d'être propagé.
Elle prévaut sur toute autre pratique, habitude ou consigne, y compris sur les
instructions données à un agent en cours de session. Les sept principes ci-dessous
sont non négociables.

## Principes fondamentaux

### I. Spec avant code (NON NÉGOCIABLE)

Aucune ligne de code d'une fonctionnalité ne peut être écrite avant que sa
spécification n'existe et n'ait été validée par un humain.

- Toute fonctionnalité DOIT posséder une spécification portant un identifiant unique
  au format `SF-xxx`, stockée dans `specs/`.
- Cette spécification DOIT énoncer ses critères d'acceptation au format
  Given/When/Then. Un critère non exprimable dans ce format n'est pas un critère
  d'acceptation : il est reformulé ou retiré.
- Un humain DOIT valider explicitement la spécification et ses critères avant que
  l'implémentation ne commence. La validation est datée et vérifiable dans le dépôt
  (commit, revue ou approbation de pull request).
- Toute implémentation démarrée sans spécification validée DOIT être arrêtée et
  annulée, quel que soit son état d'avancement.

Vérification : pour toute pull request d'implémentation, la spécification `SF-xxx`
correspondante existe et sa validation humaine est antérieure au premier commit
d'implémentation.

### II. Séparation entre tests d'acceptation et implémentation (NON NÉGOCIABLE)

Celui qui implémente n'écrit pas les tests qui le jugent.

- Les tests d'acceptation DOIVENT être écrits par un acteur distinct de celui qui
  implémente la fonctionnalité — humain, ou un agent s'appuyant sur un modèle
  différent de celui qui implémente. En pratique : `factory-architecture` rédige
  les tests, `factory-build` implémente. Deux sessions d'un même modèle ne sont
  pas des acteurs indépendants : elles partagent les mêmes angles morts.
- Ils DOIVENT dériver directement des critères Given/When/Then de la spécification :
  chaque critère d'acceptation est couvert par au moins un test.
- Ils DOIVENT résider dans `tests/acceptance/`.
- Un agent ne DOIT JAMAIS modifier, supprimer, renommer, ignorer ni désactiver un
  fichier de `tests/acceptance/`.
- Toute pull request qui touche à la fois un test d'acceptation et le code que ce test
  couvre DOIT porter une justification écrite et explicite de cette modification
  conjointe. Sans justification, la pull request est refusée.

Vérification : `tests/acceptance/` n'apparaît dans le diff d'une pull request
d'implémentation qu'accompagné d'une justification explicite ; la couverture
critère-par-test est démontrable.

### III. Traçabilité continue

L'identifiant `SF-xxx` est le fil ininterrompu qui relie une intention à sa livraison.

- L'identifiant `SF-xxx` DOIT figurer, sans rupture, dans : la spécification, le nom de
  la branche, chaque message de commit, le titre de la pull request, et la note de
  version.
- Les conventions de nommage DOIVENT être respectées :
  branche `feat/SF-042-description-courte`, commit `feat(scope): sujet (SF-042)`.
- Un artefact sans identifiant `SF-xxx` rattachable à une spécification existante
  n'est pas intégrable.
- L'identifiant `SF-000` est réservé aux pull requests de gouvernance et de maintenance
  — amendement de la présente constitution, montée de dépendances, correction
  d'outillage — qui ne se rattachent à aucune spécification fonctionnelle. Toutes les
  autres règles leur restent applicables.

Vérification : à partir d'une entrée de note de version, on remonte mécaniquement à la
pull request, aux commits, à la branche et à la spécification, et inversement.

### IV. Aucun secret hors des fichiers prévus

Un secret ne vit que là où il est prévu qu'il vive, et nulle part ailleurs.

- Aucun secret ne DOIT figurer dans le code source.
- Aucun secret ne DOIT figurer dans la configuration versionnée.
- Aucun secret ne DOIT figurer dans l'environnement global du shell.
- Aucun secret ne DOIT être présent dans un conteneur où s'exécute un agent.
- Les secrets ne résident que dans les emplacements prévus à cet effet — `secrets/`
  chiffré et fichiers d'environnement non versionnés — et ces emplacements ne sont
  jamais committés.

Vérification : l'analyse de secrets (`mise run security`) est verte sur l'historique
comme sur le diff ; l'inspection de l'environnement d'un conteneur d'agent ne révèle
aucun secret.

### V. Vérification manuelle et indépendante de toute dépendance nouvelle

Une dépendance n'entre pas dans le projet sur la seule parole d'un agent.

- Toute dépendance nouvelle DOIT être vérifiée manuellement sur trois points :
  son existence réelle, l'identité de son éditeur, et son ancienneté.
- Cette vérification DOIT être conduite par un acteur autre que l'agent qui a proposé
  la dépendance. L'agent proposant ne peut pas valider sa propre proposition.
- L'ajout DOIT être mentionné explicitement dans la pull request, avec le résultat des
  trois vérifications.
- Une dépendance non vérifiée, ou vérifiée par son propre proposant, DOIT être retirée.

Rationale : les agents hallucinent des noms de paquets ; un nom plausible mais
inexistant est une porte d'entrée directe pour un paquet malveillant homonyme.

### VI. Pull requests de 400 lignes de diff au maximum

- Aucune pull request ne DOIT excéder 400 lignes de diff.
- Au-delà de ce seuil, la tâche DOIT être redécoupée en pull requests plus petites,
  chacune rattachée à un identifiant `SF-xxx` et indépendamment relisible.
- Ne comptent PAS dans le décompte : les fichiers de verrouillage de dépendances,
  les fichiers générés automatiquement, et les jeux de données de test volumineux.
- Au-delà de 400 lignes relisibles, l'intégration continue émet un avertissement ;
  au-delà de 800, elle bloque la fusion.
- Une dérogation reste possible pour un changement authentiquement indivisible
  (échafaudage initial, migration outillée). Elle exige le label `large-pr-justified`,
  une justification écrite dans la pull request, et laisse une trace vérifiable.
  Elle ne s'applique jamais à du code métier.
- Les lignes de `tests/acceptance/**` ne comptent pas dans le plafond SI ET SEULEMENT
  SI trois conditions sont réunies : la spécification dont elles dérivent a été validée
  par un humain ; chaque test porte dans son intitulé la référence du critère qu'il
  couvre ; la pull request ne modifie aucun test d'acceptation préexistant. À défaut
  d'une seule de ces conditions, elles comptent intégralement.
  Rationale : la justesse de ces lignes s'établit par pointage de couverture vers un
  artefact déjà validé, non par lecture sémantique. Le plafond protège la relecture,
  et un pointage n'est pas une relecture.
- Le seuil n'est pas contournable par regroupement, par reformatage massif ni par
  exclusion de fichiers de la revue.

Rationale : une revue humaine portant sur 2000 lignes n'est pas une revue, c'est une
signature. Le plafond protège la réalité de la relecture, pas sa forme.

### VII. Intégration continue verte et approbation humaine avant clôture

- Rien n'est terminé sans une intégration continue intégralement verte.
- Rien n'est terminé sans approbation humaine explicite.
- Aucun contournement n'est admis : ni fusion forcée, ni contournement des règles de
  protection de branche, ni désactivation d'un test, ni assouplissement d'un seuil pour
  faire passer la chaîne.
- Cette règle s'applique à tout intervenant sans exception, y compris au propriétaire
  du dépôt.
- Un test qui échoue se corrige ; il ne se neutralise pas.

Vérification : la protection de branche impose intégration continue verte et
approbation ; l'historique ne comporte aucune fusion sans ces deux conditions.

## Contraintes d'exécution de la chaîne

Ces contraintes sont les modalités techniques par lesquelles les principes ci-dessus
sont tenus. Elles ne les remplacent ni ne les étendent.

- **Exposition réseau** : aucun port publié sur `0.0.0.0`. Tout service écoute sur
  `127.0.0.1` ; l'accès distant passe par tunnel.
- **Clés d'accès aux modèles** : aucun outil n'utilise la clé maîtresse de la
  passerelle. Chaque outil dispose d'une clé virtuelle dédiée et révocable
  (ADR-001).
- **Commandes normalisées** : toute commande de build, test, lint, type-check et
  sécurité passe par `mise run <tâche>`. Les agents, les humains et l'intégration
  continue exécutent strictement les mêmes tâches.
- **Zones interdites en écriture aux agents** : `secrets/**`, `docs/adr/**`,
  `tests/acceptance/**`, et les fichiers de verrouillage de dépendances sauf demande
  humaine explicite.
- **Décisions d'architecture** : une décision s'ajoute dans `docs/adr/` et ne se
  réécrit jamais. En cas de contradiction entre deux ADR, le plus récent fait foi ;
  en cas de contradiction entre un ADR et la présente constitution, la constitution
  fait foi.
- **Actions destructives** : toute suppression ou commande destructive requiert une
  confirmation humaine préalable.

## Flux de développement et portes de qualité

Le cycle nominal d'une fonctionnalité `SF-xxx` :

1. **Spécification** — rédaction dans `specs/` avec critères Given/When/Then, puis
   validation humaine (Principe I).
2. **Tests d'acceptation** — dérivés des critères, écrits dans `tests/acceptance/` par
   un acteur distinct de l'implémenteur (Principe II).
3. **Implémentation** — sur une branche `feat/SF-xxx-...`, commits portant
   l'identifiant (Principes III et VI).
4. **Pull request** — 400 lignes de diff au maximum, identifiant dans le titre,
   dépendances nouvelles listées avec leurs vérifications (Principes III, V, VI).
5. **Portes de qualité** — `mise run test`, `mise run lint`, `mise run typecheck` et
   `mise run security` verts, chaque critère d'acceptation couvert par un test.
6. **Revue humaine** — approbation explicite ; toute modification conjointe
   test/code justifiée par écrit (Principes II et VII).
7. **Fusion et note de version** — l'identifiant `SF-xxx` est reporté dans la note de
   version (Principe III).

Toute revue de pull request DOIT vérifier explicitement la conformité aux sept
principes. Une non-conformité constatée bloque la fusion ; elle ne se documente pas
en dette.

## Gouvernance

Cette constitution prévaut sur toute autre pratique du dépôt. Aucune consigne de
session, aucune urgence de livraison et aucun statut hiérarchique n'autorise à s'en
écarter.

**Procédure d'amendement**

- Un amendement se fait exclusivement par pull request modifiant le présent fichier.
- La pull request DOIT contenir une justification écrite de l'amendement : le problème
  constaté, la modification proposée, et ses conséquences sur le flux de travail.
- Elle DOIT être approuvée par un humain et satisfaire les portes de qualité en
  vigueur (Principe VII).
- Un amendement ne peut pas être fusionné dans la même pull request qu'une
  modification de code fonctionnel.

**Politique de version**

La constitution suit le versionnement sémantique :

- **MAJOR** — retrait ou redéfinition incompatible d'un principe ou d'une règle de
  gouvernance.
- **MINOR** — ajout d'un principe ou d'une section, ou extension matérielle d'une
  règle existante.
- **PATCH** — clarification, reformulation, correction, sans effet sémantique.

Toute montée de version met à jour la date de dernier amendement et consigne un
rapport d'impact de synchronisation en tête de fichier.

**Contrôle de conformité**

- Chaque revue de pull request contrôle la conformité aux sept principes.
- `AGENTS.md` porte les commandes et garde-fous opérationnels lus par les agents à
  l'exécution ; il DOIT rester cohérent avec la présente constitution. En cas de
  divergence, la constitution fait foi et `AGENTS.md` est corrigé.
- Toute complexité ajoutée DOIT être justifiée par écrit dans la pull request qui
  l'introduit.

**Version**: 1.1.0 | **Ratifiée le**: 2026-09-03 | **Dernier amendement**: 2026-09-08
