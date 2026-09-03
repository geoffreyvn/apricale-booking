# tests/acceptance/

**Zone interdite en écriture aux agents d'implémentation.**

Ces tests dérivent directement des critères d'acceptation Given/When/Then des
specs `SF-xxx`. Ils sont écrits par un acteur s'appuyant sur un **modèle
différent** de celui qui implémente — en pratique `factory-architecture` rédige,
`factory-build` implémente (constitution, principe II).

Règles :

- Un agent ne modifie, ne supprime, ne renomme, n'ignore ni ne désactive jamais
  un fichier de ce répertoire.
- Toute pull request touchant à la fois un fichier d'ici et le code qu'il couvre
  exige une justification écrite explicite.
- Chaque critère d'acceptation d'une spec est couvert par au moins un test.

Convention de nommage : `SF-<id>-<intitulé-court>.test.ts`
