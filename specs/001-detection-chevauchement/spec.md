# Feature Specification: SF-001 — Détection de chevauchement de réservations

**Feature Branch**: `feat/SF-001-detection-chevauchement`

**Created**: 2026-09-08

**Status**: Validée par Geoffrey Van Nuffelen le 2026-09-08 (constitution, principe I)

**Input**: User description: "SF-001 — Détection de chevauchement de réservations. Fonctionnalité de logique pure, sans interface ni base de données : étant donné un ensemble de réservations existantes pour l'appartement d'Apricale, déterminer si une nouvelle demande sur une plage de dates est acceptable. Règles du domaine à couvrir : une réservation va d'une date d'arrivée à une date de départ ; le jour de départ d'un séjour peut être le jour d'arrivée du suivant (les nuitées ne se chevauchent pas) ; une demande dont la date de départ précède ou égale la date d'arrivée est invalide ; les réservations annulées ne bloquent rien ; la fonction doit être déterministe et sans effet de bord."

## Vocabulaire du domaine

Ces définitions sont normatives : tout critère d'acceptation ci-dessous s'y réfère.

- **Nuitée du jour J** : la nuit qui commence le jour J et se termine le lendemain.
- **Nuitées occupées par une réservation** : une réservation d'arrivée `A` et de départ
  `D` occupe exactement les nuitées des jours `J` tels que `A ≤ J < D`. Le jour de
  départ n'est pas une nuitée occupée.
- **Réservation bloquante** : réservation existante dont le statut n'est pas « annulée ».
- **Chevauchement** : deux séjours se chevauchent lorsqu'ils occupent au moins une
  nuitée commune.
- **Demande** : couple (date d'arrivée souhaitée, date de départ souhaitée) soumis à
  décision, non encore enregistré.
- **Décision** : verdict rendu sur une demande — `acceptable`, `en conflit` ou
  `demande invalide` — accompagné, en cas de conflit, de l'identification des
  réservations bloquantes en cause.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refuser une demande qui chevauche un séjour déjà retenu (Priority: P1)

Un visiteur souhaite réserver l'appartement d'Apricale sur une plage de dates.
Le propriétaire a besoin de savoir, sans ambiguïté, si cette plage empiète sur un
séjour déjà retenu, afin de ne jamais promettre deux fois la même nuitée.

**Why this priority**: c'est la raison d'être de la fonctionnalité. Sans elle, la double
réservation devient possible, ce qui est le seul défaut réellement inacceptable du
domaine. Livrée seule, elle a déjà de la valeur.

**Independent Test**: soumettre une demande contre un ensemble de réservations
bloquantes connues et vérifier le verdict rendu ainsi que la liste des réservations
en conflit, sans aucune autre partie du système.

**Acceptance Scenarios**:

1. **Given** aucune réservation existante, **When** une demande du 10 au 15 mai est
   évaluée, **Then** la décision est `acceptable`.
2. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 10 au
   15 mai est évaluée, **Then** la décision est `en conflit` et désigne cette réservation.
3. **Given** une réservation bloquante du 10 au 20 mai, **When** une demande du 12 au
   14 mai est évaluée, **Then** la décision est `en conflit`.
4. **Given** une réservation bloquante du 12 au 14 mai, **When** une demande du 10 au
   20 mai est évaluée, **Then** la décision est `en conflit`.
5. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 8 au
   11 mai est évaluée, **Then** la décision est `en conflit`.
6. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 14 au
   18 mai est évaluée, **Then** la décision est `en conflit`.
7. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 1er au
   5 mai est évaluée, **Then** la décision est `acceptable`.
8. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 20 au
   25 mai est évaluée, **Then** la décision est `acceptable`.
9. **Given** trois réservations bloquantes du 1er au 5, du 10 au 15 et du 20 au 25 mai,
   **When** une demande du 4 au 21 mai est évaluée, **Then** la décision est
   `en conflit` et désigne les trois réservations.
10. **Given** trois réservations bloquantes du 1er au 5, du 10 au 15 et du 20 au 25 mai,
    **When** une demande du 16 au 19 mai est évaluée, **Then** la décision est
    `acceptable`.

---

### User Story 2 - Autoriser deux séjours qui se succèdent le même jour (Priority: P2)

Un séjour se termine le matin, le suivant commence l'après-midi. Le propriétaire veut
pouvoir enchaîner deux locations sur le même jour d'articulation, sans perdre une nuit
de location par excès de prudence.

**Why this priority**: sans cette règle, la détection reste correcte mais refuse à tort
des demandes légitimes et fait perdre des nuitées. C'est une règle de valeur, non de
sécurité.

**Independent Test**: soumettre des demandes strictement adjacentes à une réservation
bloquante, avant et après, et vérifier qu'elles sont acceptées.

**Acceptance Scenarios**:

1. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 5 au
   10 mai est évaluée, **Then** la décision est `acceptable`.
2. **Given** une réservation bloquante du 10 au 15 mai, **When** une demande du 15 au
   20 mai est évaluée, **Then** la décision est `acceptable`.
3. **Given** deux réservations bloquantes du 5 au 10 mai et du 15 au 20 mai,
   **When** une demande du 10 au 15 mai est évaluée, **Then** la décision est
   `acceptable`.
4. **Given** une réservation bloquante d'une seule nuitée du 10 au 11 mai,
   **When** une demande d'une seule nuitée du 11 au 12 mai est évaluée, **Then** la
   décision est `acceptable`.
5. **Given** une réservation bloquante d'une seule nuitée du 10 au 11 mai,
   **When** une demande d'une seule nuitée du 9 au 10 mai est évaluée, **Then** la
   décision est `acceptable`.
6. **Given** une réservation bloquante d'une seule nuitée du 10 au 11 mai,
   **When** une demande d'une seule nuitée du 10 au 11 mai est évaluée, **Then** la
   décision est `en conflit`.

---

### User Story 3 - Rejeter une demande dont la plage est absurde (Priority: P3)

Une demande dont le départ précède ou égale l'arrivée ne décrit aucune nuitée. Elle
doit être rejetée comme invalide, distinctement d'un refus pour cause de conflit :
les deux cas n'appellent pas la même réponse à l'utilisateur.

**Why this priority**: c'est une garde d'entrée. Elle protège la cohérence de la
décision, mais n'apporte aucune valeur métier tant que P1 n'existe pas.

**Independent Test**: soumettre des plages dégénérées avec et sans réservations
existantes, et vérifier que le verdict est `demande invalide` dans tous les cas.

**Acceptance Scenarios**:

1. **Given** aucune réservation existante, **When** une demande du 10 au 10 mai est
   évaluée, **Then** la décision est `demande invalide`.
2. **Given** aucune réservation existante, **When** une demande du 15 au 10 mai est
   évaluée, **Then** la décision est `demande invalide`.
3. **Given** une réservation bloquante du 1er au 30 mai, **When** une demande du 10 au
   10 mai est évaluée, **Then** la décision est `demande invalide` et non `en conflit`.
4. **Given** une réservation bloquante du 1er au 5 juin, **When** une demande du 20 au
   10 mai est évaluée, **Then** la décision est `demande invalide`, sans référence à
   une réservation en conflit.

---

### User Story 4 - Ne pas laisser une annulation bloquer l'agenda (Priority: P3)

Une réservation annulée reste tracée dans l'agenda mais libère ses nuitées. Le
propriétaire veut que les dates redeviennent immédiatement proposables.

**Why this priority**: indispensable à terme pour ne pas geler des dates libres, mais
sans effet aussi longtemps qu'aucune annulation n'existe.

**Independent Test**: soumettre une demande superposée à une réservation annulée et
vérifier qu'elle est acceptée ; répéter avec un mélange d'annulées et de bloquantes.

**Acceptance Scenarios**:

1. **Given** une réservation annulée du 10 au 15 mai, **When** une demande du 10 au
   15 mai est évaluée, **Then** la décision est `acceptable`.
2. **Given** une réservation annulée du 1er au 30 mai, **When** une demande du 12 au
   14 mai est évaluée, **Then** la décision est `acceptable`.
3. **Given** une réservation annulée du 10 au 15 mai et une réservation bloquante du
   14 au 18 mai, **When** une demande du 10 au 14 mai est évaluée, **Then** la décision
   est `acceptable`.
4. **Given** une réservation annulée du 10 au 15 mai et une réservation bloquante du
   14 au 18 mai, **When** une demande du 10 au 16 mai est évaluée, **Then** la décision
   est `en conflit` et ne désigne que la réservation bloquante.
5. **Given** un ensemble de réservations toutes annulées couvrant tout le mois de mai,
   **When** une demande du 1er au 31 mai est évaluée, **Then** la décision est
   `acceptable`.

---

### User Story 5 - Obtenir toujours la même réponse pour la même question (Priority: P3)

Le propriétaire, un test automatisé ou une future interface doivent pouvoir rejouer
une évaluation et obtenir strictement le même verdict, sans que l'évaluation altère
l'agenda.

**Why this priority**: propriété transverse, indispensable à la confiance et à la
testabilité, mais elle ne décrit aucun besoin utilisateur nouveau.

**Independent Test**: évaluer plusieurs fois la même demande, puis réévaluer avec le
même ensemble de réservations présenté dans un ordre différent, et comparer les
verdicts ainsi que l'état de l'ensemble fourni en entrée.

**Acceptance Scenarios**:

1. **Given** un ensemble de réservations et une demande donnés, **When** l'évaluation
   est répétée plusieurs fois de suite, **Then** la décision rendue est identique à
   chaque fois.
2. **Given** un même ensemble de réservations présenté dans deux ordres différents,
   **When** la même demande est évaluée, **Then** le verdict et l'ensemble des
   réservations en conflit sont identiques.
3. **Given** un ensemble de réservations et une demande donnés, **When** l'évaluation
   est effectuée, **Then** ni l'ensemble des réservations ni la demande ne sont
   modifiés.
4. **Given** une demande en conflit avec plusieurs réservations bloquantes,
   **When** l'évaluation est effectuée deux fois, **Then** les réservations en conflit
   sont restituées dans le même ordre les deux fois.

---

### Edge Cases

Matrice exhaustive des positions relatives d'une demande `[a, d[` face à une
réservation bloquante `[A, D[`. Chaque ligne est un cas de test distinct.

| Cas | Position relative | Exemple (demande vs réservation 10→15) | Décision attendue |
|-----|-------------------|----------------------------------------|-------------------|
| B1  | Demande entièrement antérieure, avec écart | 1→5 | acceptable |
| B2  | Demande se terminant le jour d'arrivée | 5→10 | acceptable |
| B3  | Demande débordant d'une nuitée avant | 5→11 | en conflit |
| B4  | Demande partageant l'arrivée, plus courte | 10→13 | en conflit |
| B5  | Demande strictement incluse | 12→14 | en conflit |
| B6  | Demande partageant le départ, plus courte | 13→15 | en conflit |
| B7  | Demande débordant d'une nuitée après | 14→18 | en conflit |
| B8  | Demande débutant le jour de départ | 15→20 | acceptable |
| B9  | Demande entièrement postérieure, avec écart | 20→25 | acceptable |
| B10 | Demande identique | 10→15 | en conflit |
| B11 | Demande englobante stricte | 5→20 | en conflit |
| B12 | Demande partageant l'arrivée, plus longue | 10→20 | en conflit |
| B13 | Demande partageant le départ, plus longue | 5→15 | en conflit |

Autres cas limites à couvrir :

- Ensemble de réservations vide.
- Ensemble ne contenant que des réservations annulées.
- Demande d'une seule nuitée insérée dans un intervalle libre d'exactement une nuitée
  entre deux réservations bloquantes.
- Demande d'une seule nuitée dans un intervalle libre de zéro nuitée (deux
  réservations bloquantes contiguës) : en conflit.
- Demande chevauchant plusieurs réservations bloquantes non contiguës.
- Demande à cheval sur un changement de mois (28 février → 2 mars).
- Demande à cheval sur un changement d'année (30 décembre → 2 janvier).
- Demande incluant le 29 février d'une année bissextile (28 février 2028 →
  1er mars 2028).
- Demande d'une durée très longue (plusieurs centaines de nuitées) chevauchant une
  réservation bloquante située en son milieu.
- Demande dont l'arrivée est dans le passé par rapport au jour courant : hors du champ
  de cette décision, aucune influence sur le verdict (voir Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT rendre, pour une demande et un ensemble de réservations
  existantes, une décision unique parmi `acceptable`, `en conflit` et
  `demande invalide`.
- **FR-002**: Le système DOIT considérer qu'une réservation d'arrivée `A` et de départ
  `D` occupe les nuitées des jours `J` tels que `A ≤ J < D`, le jour de départ exclu.
- **FR-003**: Le système DOIT rendre `en conflit` si et seulement si la demande et au
  moins une réservation bloquante partagent au moins une nuitée.
- **FR-004**: Le système DOIT rendre `acceptable` lorsque la date de départ de la
  demande est égale à la date d'arrivée d'une réservation bloquante, toutes les autres
  nuitées étant libres.
- **FR-005**: Le système DOIT rendre `acceptable` lorsque la date d'arrivée de la
  demande est égale à la date de départ d'une réservation bloquante, toutes les autres
  nuitées étant libres.
- **FR-006**: Le système DOIT rendre `demande invalide` lorsque la date de départ
  demandée est antérieure ou égale à la date d'arrivée demandée.
- **FR-007**: Le système DOIT évaluer la validité de la plage demandée avant toute
  recherche de chevauchement ; une demande invalide ne DOIT jamais être qualifiée
  `en conflit`.
- **FR-008**: Le système DOIT ignorer intégralement les réservations annulées lors de
  la recherche de chevauchement.
- **FR-009**: Le système DOIT, en cas de conflit, restituer l'identification de toutes
  les réservations bloquantes en chevauchement, et non seulement la première trouvée.
- **FR-010**: Le système DOIT restituer les réservations en conflit triées par date
  d'arrivée croissante, puis, à date d'arrivée égale, par identifiant croissant selon
  l'ordre lexicographique. Cet ordre est indépendant de l'ordre de présentation des
  réservations en entrée.
- **FR-011**: Le système DOIT rendre une décision identique pour des entrées
  identiques, quel que soit le moment, le nombre d'évaluations et l'ordre des
  réservations fournies.
- **FR-012**: Le système NE DOIT PAS modifier la demande, l'ensemble des réservations
  existantes, ni aucun état extérieur lors de l'évaluation.
- **FR-013**: Le système NE DOIT PAS dépendre de la date ou de l'heure courante, d'un
  fuseau horaire, d'un générateur aléatoire, d'une entrée/sortie ni d'un réseau pour
  rendre sa décision.
- **FR-014**: Le système DOIT rendre `acceptable` lorsque l'ensemble des réservations
  existantes est vide et que la plage demandée est valide.
- **FR-015**: Le système DOIT distinguer, dans la décision restituée, le motif
  d'invalidité de la plage du motif de conflit, afin qu'un appelant puisse formuler
  deux messages différents.
- **FR-016**: Le système DOIT traiter les dates comme des jours calendaires, sans
  composante horaire, et rester correct au franchissement d'un mois, d'une année et
  d'un 29 février.

### Key Entities

- **Réservation existante** : séjour déjà enregistré à l'agenda de l'appartement.
  Porte un identifiant stable, une date d'arrivée, une date de départ et un statut.
  Elle est bloquante ou annulée.
- **Demande de réservation** : intention de séjour non enregistrée. Porte une date
  d'arrivée souhaitée et une date de départ souhaitée, sans identifiant ni statut.
- **Décision de disponibilité** : résultat de l'évaluation. Porte un verdict
  (`acceptable`, `en conflit`, `demande invalide`) et, pour un conflit, la liste
  ordonnée des identifiants des réservations bloquantes concernées.
- **Statut de réservation** : qualifie l'effet d'une réservation sur l'agenda. Deux
  effets seulement : bloquant ou non bloquant. Seule l'annulation est non bloquante.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des critères Given/When/Then de cette spécification, y compris les
  13 lignes de la matrice de bornes, sont couverts par au moins un test automatisé.
- **SC-002**: aucune nuitée ne peut être attribuée deux fois : sur un jeu d'au moins
  200 demandes générées couvrant toutes les positions relatives possibles, aucune
  demande acceptée ne partage de nuitée avec une réservation bloquante.
- **SC-003**: aucune demande légitimement adjacente n'est refusée : sur l'ensemble des
  cas d'adjacence exacte, le taux de refus est de 0 %.
- **SC-004**: la même demande évaluée 100 fois de suite, et évaluée sur toutes les
  permutations d'un ensemble de 5 réservations, produit exactement le même résultat.
- **SC-005**: après évaluation, l'ensemble des réservations et la demande fournis en
  entrée sont inchangés dans 100 % des cas testés.
- **SC-006**: toute décision de refus permet à l'appelant de distinguer sans
  interprétation supplémentaire une plage invalide d'un conflit de dates.

## Assumptions

- Les dates sont des jours calendaires sans heure ni fuseau. Les heures effectives
  d'arrivée et de départ relèvent du règlement du logement, hors du champ de SF-001.
- Les réservations existantes fournies en entrée sont supposées valides et cohérentes
  entre elles : leur date de départ est postérieure à leur date d'arrivée. La
  validation des réservations déjà enregistrées n'est pas du ressort de cette
  fonctionnalité.
- Le statut de réservation se réduit à deux effets sur l'agenda. Tout statut autre que
  « annulée » est bloquant ; l'ajout futur d'un statut ne modifie pas cette règle.
- L'appartement d'Apricale est un logement unique et indivisible : il n'existe ni
  chambres, ni capacité, ni sur-réservation partielle.
- Aucune règle de durée minimale ou maximale de séjour, aucun délai de préavis, aucune
  période de blocage propriétaire n'entre dans le champ de SF-001.
- L'antériorité d'une demande par rapport au jour courant n'est pas évaluée ici : elle
  supposerait une horloge, ce qui contredirait l'exigence de déterminisme (FR-013).
  Ce contrôle relève d'une spécification ultérieure.
- Aucune persistance, aucune interface, aucun encaissement : la fonctionnalité reçoit
  ses réservations en paramètre et rend une décision, conformément au périmètre du
  dépôt.
- Les identifiants de réservation sont supposés uniques et stables, ce qui permet
  d'exiger un ordre de restitution déterministe (FR-010).
