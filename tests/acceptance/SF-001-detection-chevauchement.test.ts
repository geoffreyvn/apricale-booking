import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  evaluerDemande,
  type Decision,
  type Demande,
  type JourCalendaire,
  type Reservation,
} from "../../src/domain/availability.js";

// ---------------------------------------------------------------------------
// Surface d'API définie par ce contrat (SF-001)
//
//   evaluerDemande(demande, reservationsExistantes): Decision
//
//   type JourCalendaire = string           // jour calendaire ISO « AAAA-MM-JJ »
//   type Demande        = { arrivee, depart }
//   type Reservation    = { identifiant, arrivee, depart, statut }
//   type StatutReservation = "confirmée" | "annulée"
//   type Decision =
//     | { verdict: "acceptable" }
//     | { verdict: "demande invalide" }
//     | { verdict: "en conflit"; reservationsEnConflit: readonly string[] }
//
// Les trois verdicts sont mutuellement exclusifs (FR-001) et le verdict seul
// suffit à distinguer une plage invalide d'un conflit de dates (FR-015, SC-006).
// ---------------------------------------------------------------------------

const MILLISECONDES_PAR_JOUR = 86_400_000;
const ORIGINE = Date.UTC(2026, 0, 1);

const jourDepuisNumero = (numero: number): JourCalendaire =>
  new Date(ORIGINE + numero * MILLISECONDES_PAR_JOUR).toISOString().slice(0, 10);

const deuxChiffres = (valeur: number): string => String(valeur).padStart(2, "0");

const mai = (jourDuMois: number): JourCalendaire => `2026-05-${deuxChiffres(jourDuMois)}`;
const juin = (jourDuMois: number): JourCalendaire => `2026-06-${deuxChiffres(jourDuMois)}`;

const bloquante = (
  identifiant: string,
  arrivee: JourCalendaire,
  depart: JourCalendaire,
): Reservation => ({ identifiant, arrivee, depart, statut: "confirmée" });

const annulee = (
  identifiant: string,
  arrivee: JourCalendaire,
  depart: JourCalendaire,
): Reservation => ({ identifiant, arrivee, depart, statut: "annulée" });

const demandeDe = (arrivee: JourCalendaire, depart: JourCalendaire): Demande => ({
  arrivee,
  depart,
});

const conflitsDe = (decision: Decision): readonly string[] =>
  decision.verdict === "en conflit" ? decision.reservationsEnConflit : [];

const nuitees = (premiereNuit: number, jourDeDepart: number): ReadonlySet<number> => {
  const jours = new Set<number>();
  for (let jour = premiereNuit; jour < jourDeDepart; jour += 1) jours.add(jour);
  return jours;
};

const seChevauchent = (a: ReadonlySet<number>, b: ReadonlySet<number>): boolean =>
  [...a].some((nuit) => b.has(nuit));

const permutations = <T>(elements: readonly T[]): readonly T[][] => {
  if (elements.length <= 1) return [[...elements]];
  const resultat: T[][] = [];
  elements.forEach((element, index) => {
    const reste = [...elements.slice(0, index), ...elements.slice(index + 1)];
    for (const permutation of permutations(reste)) resultat.push([element, ...permutation]);
  });
  return resultat;
};

const permuter = <T>(elements: readonly T[], cles: readonly number[]): readonly T[] =>
  elements
    .map((element, index) => ({ element, cle: cles[index] ?? index }))
    .sort((gauche, droite) => gauche.cle - droite.cle)
    .map(({ element }) => element);

// ---------------------------------------------------------------------------
// US1 — Refuser une demande qui chevauche un séjour déjà retenu
// ---------------------------------------------------------------------------

describe("US1 — refuser une demande qui chevauche un séjour déjà retenu", () => {
  const sejourRetenu = bloquante("R-mai", mai(10), mai(15));

  it("US1-1 — aucune réservation existante, demande du 10 au 15 mai : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(10), mai(15)), [])).toEqual({ verdict: "acceptable" });
  });

  it("US1-2 — réservation 10→15, demande identique 10→15 : en conflit, et désigne cette réservation", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(15)), [sejourRetenu]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-mai"]);
  });

  it("US1-3 — réservation 10→20, demande incluse 12→14 : en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(12), mai(14)), [
      bloquante("R-long", mai(10), mai(20)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-long"]);
  });

  it("US1-4 — réservation 12→14, demande englobante 10→20 : en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(20)), [
      bloquante("R-court", mai(12), mai(14)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-court"]);
  });

  it("US1-5 — réservation 10→15, demande 8→11 débordant par le début : en conflit", () => {
    expect(evaluerDemande(demandeDe(mai(8), mai(11)), [sejourRetenu]).verdict).toBe("en conflit");
  });

  it("US1-6 — réservation 10→15, demande 14→18 débordant par la fin : en conflit", () => {
    expect(evaluerDemande(demandeDe(mai(14), mai(18)), [sejourRetenu]).verdict).toBe("en conflit");
  });

  it("US1-7 — réservation 10→15, demande antérieure 1→5 : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(1), mai(5)), [sejourRetenu])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US1-8 — réservation 10→15, demande postérieure 20→25 : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(20), mai(25)), [sejourRetenu])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US1-9 — trois réservations 1→5, 10→15, 20→25, demande 4→21 : en conflit avec les trois", () => {
    const decision = evaluerDemande(demandeDe(mai(4), mai(21)), [
      bloquante("R-1", mai(1), mai(5)),
      bloquante("R-2", mai(10), mai(15)),
      bloquante("R-3", mai(20), mai(25)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-1", "R-2", "R-3"]);
  });

  it("US1-10 — trois réservations 1→5, 10→15, 20→25, demande 16→19 dans un creux : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(16), mai(19)), [
        bloquante("R-1", mai(1), mai(5)),
        bloquante("R-2", mai(10), mai(15)),
        bloquante("R-3", mai(20), mai(25)),
      ]),
    ).toEqual({ verdict: "acceptable" });
  });
});

// ---------------------------------------------------------------------------
// US2 — Autoriser deux séjours qui se succèdent le même jour
// ---------------------------------------------------------------------------

describe("US2 — autoriser deux séjours qui se succèdent le même jour", () => {
  const sejourRetenu = bloquante("R-mai", mai(10), mai(15));
  const uneSeuleNuitee = bloquante("R-1nuit", mai(10), mai(11));

  it("US2-1 — réservation 10→15, demande 5→10 se terminant le jour d'arrivée : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(5), mai(10)), [sejourRetenu])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US2-2 — réservation 10→15, demande 15→20 débutant le jour de départ : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(15), mai(20)), [sejourRetenu])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US2-3 — réservations 5→10 et 15→20, demande 10→15 comblant exactement le creux : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(10), mai(15)), [
        bloquante("R-avant", mai(5), mai(10)),
        bloquante("R-apres", mai(15), mai(20)),
      ]),
    ).toEqual({ verdict: "acceptable" });
  });

  it("US2-4 — réservation d'une nuitée 10→11, demande d'une nuitée 11→12 : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(11), mai(12)), [uneSeuleNuitee])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US2-5 — réservation d'une nuitée 10→11, demande d'une nuitée 9→10 : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(9), mai(10)), [uneSeuleNuitee])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US2-6 — réservation d'une nuitée 10→11, demande de la même nuitée 10→11 : en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(11)), [uneSeuleNuitee]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-1nuit"]);
  });
});

// ---------------------------------------------------------------------------
// US3 — Rejeter une demande dont la plage est absurde
// ---------------------------------------------------------------------------

describe("US3 — rejeter une demande dont la plage est absurde", () => {
  it("US3-1 — aucune réservation, demande 10→10 (aucune nuitée) : demande invalide", () => {
    expect(evaluerDemande(demandeDe(mai(10), mai(10)), []).verdict).toBe("demande invalide");
  });

  it("US3-2 — aucune réservation, demande 15→10 (départ avant arrivée) : demande invalide", () => {
    expect(evaluerDemande(demandeDe(mai(15), mai(10)), []).verdict).toBe("demande invalide");
  });

  it("US3-3 — réservation 1→30 mai, demande 10→10 : demande invalide et non en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(10)), [
      bloquante("R-mois", mai(1), mai(30)),
    ]);

    expect(decision.verdict).toBe("demande invalide");
    expect(decision.verdict).not.toBe("en conflit");
    expect(conflitsDe(decision)).toEqual([]);
  });

  it("US3-4 — réservation 1→5 juin, demande 20→10 mai : demande invalide, sans réservation en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(20), mai(10)), [
      bloquante("R-juin", juin(1), juin(5)),
    ]);

    expect(decision.verdict).toBe("demande invalide");
    expect("reservationsEnConflit" in decision).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// US4 — Ne pas laisser une annulation bloquer l'agenda
// ---------------------------------------------------------------------------

describe("US4 — ne pas laisser une annulation bloquer l'agenda", () => {
  it("US4-1 — réservation annulée 10→15, demande 10→15 : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(10), mai(15)), [annulee("A-1", mai(10), mai(15))]),
    ).toEqual({ verdict: "acceptable" });
  });

  it("US4-2 — réservation annulée 1→30, demande 12→14 : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(12), mai(14)), [annulee("A-1", mai(1), mai(30))])).toEqual({
      verdict: "acceptable",
    });
  });

  it("US4-3 — annulée 10→15 et bloquante 14→18, demande 10→14 : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(10), mai(14)), [
        annulee("A-1", mai(10), mai(15)),
        bloquante("R-1", mai(14), mai(18)),
      ]),
    ).toEqual({ verdict: "acceptable" });
  });

  it("US4-4 — annulée 10→15 et bloquante 14→18, demande 10→16 : en conflit avec la seule bloquante", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(16)), [
      annulee("A-1", mai(10), mai(15)),
      bloquante("R-1", mai(14), mai(18)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-1"]);
  });

  it("US4-5 — mai entièrement couvert par des annulées, demande 1→31 mai : acceptable", () => {
    const agendaAnnule = [
      annulee("A-1", mai(1), mai(8)),
      annulee("A-2", mai(8), mai(16)),
      annulee("A-3", mai(16), mai(24)),
      annulee("A-4", mai(24), juin(1)),
    ];

    expect(evaluerDemande(demandeDe(mai(1), mai(31)), agendaAnnule)).toEqual({
      verdict: "acceptable",
    });
  });
});

// ---------------------------------------------------------------------------
// US5 — Obtenir toujours la même réponse pour la même question
// ---------------------------------------------------------------------------

describe("US5 — obtenir toujours la même réponse pour la même question", () => {
  const agenda: readonly Reservation[] = [
    bloquante("R-2", mai(10), mai(15)),
    bloquante("R-1", mai(1), mai(5)),
    annulee("A-1", mai(20), mai(25)),
    bloquante("R-3", mai(20), mai(22)),
  ];

  it("US5-1 — la même évaluation répétée rend une décision identique à chaque fois", () => {
    const demande = demandeDe(mai(4), mai(21));
    const reference = evaluerDemande(demande, agenda);

    for (let essai = 0; essai < 10; essai += 1) {
      expect(evaluerDemande(demande, agenda)).toEqual(reference);
    }
  });

  it("US5-2 — même ensemble présenté dans deux ordres différents : verdict et conflits identiques", () => {
    const demande = demandeDe(mai(4), mai(21));

    const decisionOrdreInitial = evaluerDemande(demande, agenda);
    const decisionOrdreInverse = evaluerDemande(demande, [...agenda].reverse());

    expect(decisionOrdreInverse).toEqual(decisionOrdreInitial);
    expect(conflitsDe(decisionOrdreInverse)).toEqual(conflitsDe(decisionOrdreInitial));
  });

  it("US5-3 — l'évaluation ne modifie ni l'ensemble des réservations ni la demande (FR-012, SC-005)", () => {
    const demande = Object.freeze(demandeDe(mai(4), mai(21)));
    const reservations = Object.freeze(agenda.map((reservation) => Object.freeze({ ...reservation })));

    const copieDemande = structuredClone<Demande>(demande);
    const copieReservations = structuredClone<Reservation[]>([...reservations]);

    evaluerDemande(demande, reservations);

    expect(demande).toEqual(copieDemande);
    expect(reservations).toEqual(copieReservations);
    expect(reservations).toHaveLength(copieReservations.length);
  });

  it("US5-4 — deux évaluations d'un conflit multiple restituent les conflits dans le même ordre", () => {
    const demande = demandeDe(mai(4), mai(21));

    const premiere = conflitsDe(evaluerDemande(demande, agenda));
    const seconde = conflitsDe(evaluerDemande(demande, agenda));

    expect(premiere.length).toBeGreaterThan(1);
    expect(seconde).toEqual(premiere);
  });
});

// ---------------------------------------------------------------------------
// Matrice exhaustive des bornes B1 → B13 (spec, section Edge Cases)
// Référence : réservation bloquante « R-ref » du 10 au 15 mai.
// ---------------------------------------------------------------------------

interface LigneDeMatrice {
  readonly cas: string;
  readonly position: string;
  readonly arrivee: JourCalendaire;
  readonly depart: JourCalendaire;
  readonly verdict: Decision["verdict"];
}

const MATRICE_DES_BORNES: readonly LigneDeMatrice[] = [
  { cas: "B1", position: "entièrement antérieure, avec écart", arrivee: mai(1), depart: mai(5), verdict: "acceptable" },
  { cas: "B2", position: "se terminant le jour d'arrivée", arrivee: mai(5), depart: mai(10), verdict: "acceptable" },
  { cas: "B3", position: "débordant d'une nuitée avant", arrivee: mai(5), depart: mai(11), verdict: "en conflit" },
  { cas: "B4", position: "partageant l'arrivée, plus courte", arrivee: mai(10), depart: mai(13), verdict: "en conflit" },
  { cas: "B5", position: "strictement incluse", arrivee: mai(12), depart: mai(14), verdict: "en conflit" },
  { cas: "B6", position: "partageant le départ, plus courte", arrivee: mai(13), depart: mai(15), verdict: "en conflit" },
  { cas: "B7", position: "débordant d'une nuitée après", arrivee: mai(14), depart: mai(18), verdict: "en conflit" },
  { cas: "B8", position: "débutant le jour de départ", arrivee: mai(15), depart: mai(20), verdict: "acceptable" },
  { cas: "B9", position: "entièrement postérieure, avec écart", arrivee: mai(20), depart: mai(25), verdict: "acceptable" },
  { cas: "B10", position: "identique", arrivee: mai(10), depart: mai(15), verdict: "en conflit" },
  { cas: "B11", position: "englobante stricte", arrivee: mai(5), depart: mai(20), verdict: "en conflit" },
  { cas: "B12", position: "partageant l'arrivée, plus longue", arrivee: mai(10), depart: mai(20), verdict: "en conflit" },
  { cas: "B13", position: "partageant le départ, plus longue", arrivee: mai(5), depart: mai(15), verdict: "en conflit" },
];

describe("Matrice des bornes B1 → B13 face à la réservation bloquante du 10 au 15 mai", () => {
  it.each(MATRICE_DES_BORNES)(
    "$cas — demande $position : $verdict",
    ({ arrivee, depart, verdict }: LigneDeMatrice) => {
      const decision = evaluerDemande(demandeDe(arrivee, depart), [
        bloquante("R-ref", mai(10), mai(15)),
      ]);

      expect(decision.verdict).toBe(verdict);
      expect(conflitsDe(decision)).toEqual(verdict === "en conflit" ? ["R-ref"] : []);
    },
  );

  it("B1 → B13 — la matrice couvre bien les treize positions relatives (SC-001)", () => {
    expect(MATRICE_DES_BORNES).toHaveLength(13);
    expect(new Set(MATRICE_DES_BORNES.map(({ cas }) => cas)).size).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// Autres cas limites (spec, section Edge Cases)
// ---------------------------------------------------------------------------

describe("Cas limites d'agenda", () => {
  it("FR-014 — ensemble de réservations vide et plage valide : acceptable", () => {
    expect(evaluerDemande(demandeDe(mai(10), mai(12)), [])).toEqual({ verdict: "acceptable" });
  });

  it("FR-008 — ensemble ne contenant que des réservations annulées : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(10), mai(12)), [
        annulee("A-1", mai(1), mai(12)),
        annulee("A-2", mai(9), mai(30)),
      ]),
    ).toEqual({ verdict: "acceptable" });
  });

  it("SC-003 — nuitée unique insérée dans un creux d'exactement une nuitée : acceptable", () => {
    expect(
      evaluerDemande(demandeDe(mai(10), mai(11)), [
        bloquante("R-avant", mai(5), mai(10)),
        bloquante("R-apres", mai(11), mai(15)),
      ]),
    ).toEqual({ verdict: "acceptable" });
  });

  it("FR-003 — nuitée unique dans un creux de zéro nuitée (réservations contiguës) : en conflit", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(11)), [
      bloquante("R-avant", mai(5), mai(10)),
      bloquante("R-apres", mai(10), mai(15)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-apres"]);
  });

  it("FR-009 — demande chevauchant plusieurs réservations bloquantes non contiguës : toutes restituées", () => {
    const decision = evaluerDemande(demandeDe(mai(2), mai(23)), [
      bloquante("R-1", mai(1), mai(5)),
      bloquante("R-2", mai(10), mai(12)),
      bloquante("R-3", mai(20), mai(25)),
      bloquante("R-4", juin(10), juin(12)),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-1", "R-2", "R-3"]);
  });

  it("FR-016 — demande à cheval sur un changement de mois (28 février → 2 mars 2026)", () => {
    const demande = demandeDe("2026-02-28", "2026-03-02");

    expect(evaluerDemande(demande, [bloquante("R-1", "2026-03-01", "2026-03-05")]).verdict).toBe(
      "en conflit",
    );
    expect(evaluerDemande(demande, [bloquante("R-2", "2026-03-02", "2026-03-05")])).toEqual({
      verdict: "acceptable",
    });
  });

  it("FR-016 — demande à cheval sur un changement d'année (30 décembre → 2 janvier)", () => {
    const demande = demandeDe("2026-12-30", "2027-01-02");

    expect(evaluerDemande(demande, [bloquante("R-1", "2027-01-01", "2027-01-04")]).verdict).toBe(
      "en conflit",
    );
    expect(evaluerDemande(demande, [bloquante("R-2", "2027-01-02", "2027-01-04")])).toEqual({
      verdict: "acceptable",
    });
    expect(evaluerDemande(demande, [bloquante("R-3", "2026-12-27", "2026-12-30")])).toEqual({
      verdict: "acceptable",
    });
  });

  it("FR-016 — demande incluant le 29 février 2028 (28 février → 1er mars 2028)", () => {
    const demande = demandeDe("2028-02-28", "2028-03-01");

    expect(evaluerDemande(demande, [bloquante("R-1", "2028-02-29", "2028-03-01")]).verdict).toBe(
      "en conflit",
    );
    expect(evaluerDemande(demande, [bloquante("R-2", "2028-03-01", "2028-03-04")])).toEqual({
      verdict: "acceptable",
    });
    expect(evaluerDemande(demandeDe("2028-02-29", "2028-03-01"), [])).toEqual({
      verdict: "acceptable",
    });
  });

  it("FR-002 — demande très longue (plusieurs centaines de nuitées) chevauchant une réservation en son milieu", () => {
    const decision = evaluerDemande(demandeDe("2026-01-01", "2027-06-15"), [
      bloquante("R-milieu", "2026-09-01", "2026-09-02"),
    ]);

    expect(decision.verdict).toBe("en conflit");
    expect(conflitsDe(decision)).toEqual(["R-milieu"]);
  });

  it("FR-013 — une arrivée située dans le passé n'influence pas le verdict", () => {
    expect(evaluerDemande(demandeDe("2020-01-01", "2020-01-02"), [])).toEqual({
      verdict: "acceptable",
    });
    expect(
      evaluerDemande(demandeDe("2020-05-12", "2020-05-14"), [
        bloquante("R-passe", "2020-05-10", "2020-05-15"),
      ]).verdict,
    ).toBe("en conflit");
  });
});

// ---------------------------------------------------------------------------
// FR-010 — ordre de restitution des réservations en conflit
// ---------------------------------------------------------------------------

describe("FR-010 — ordre de restitution : date d'arrivée croissante, puis identifiant lexicographique", () => {
  const memeArrivee: readonly Reservation[] = [
    bloquante("R-2", mai(10), mai(12)),
    bloquante("A-9", mai(20), mai(22)),
    bloquante("R-10", mai(10), mai(13)),
    bloquante("Z-1", mai(5), mai(6)),
    bloquante("R-1", mai(10), mai(11)),
  ];

  const ORDRE_ATTENDU: readonly string[] = ["Z-1", "R-1", "R-10", "R-2", "A-9"];

  it("FR-010 — l'ordre attendu est affirmé explicitement, arrivée d'abord puis identifiant", () => {
    const decision = evaluerDemande(demandeDe(mai(1), juin(1)), memeArrivee);

    expect(conflitsDe(decision)).toEqual(ORDRE_ATTENDU);
  });

  it("FR-010 — l'ordre de restitution est indépendant de l'ordre de présentation en entrée", () => {
    for (const ordreDEntree of permutations(memeArrivee)) {
      expect(conflitsDe(evaluerDemande(demandeDe(mai(1), juin(1)), ordreDEntree))).toEqual(
        ORDRE_ATTENDU,
      );
    }
  });

  it("FR-010 — l'identifiant départage selon l'ordre lexicographique, non numérique", () => {
    const decision = evaluerDemande(demandeDe(mai(10), mai(11)), [
      bloquante("R-9", mai(10), mai(11)),
      bloquante("R-10", mai(10), mai(11)),
    ]);

    expect(conflitsDe(decision)).toEqual(["R-10", "R-9"]);
  });
});

// ---------------------------------------------------------------------------
// Propriétés (fast-check) : SC-002 et SC-004
// ---------------------------------------------------------------------------

interface LigneDAgenda {
  readonly reservation: Reservation;
  readonly premiereNuit: number;
  readonly jourDeDepart: number;
  readonly estBloquante: boolean;
}

const arbitraireAgenda: fc.Arbitrary<readonly LigneDAgenda[]> = fc
  .array(
    fc.tuple(
      fc.integer({ min: 0, max: 40 }),
      fc.integer({ min: 1, max: 12 }),
      fc.boolean(),
    ),
    { maxLength: 6 },
  )
  .map((lignes) =>
    lignes.map(([premiereNuit, duree, estAnnulee], index): LigneDAgenda => {
      const jourDeDepart = premiereNuit + duree;
      const identifiant = `R-${String(index).padStart(2, "0")}`;

      return {
        reservation: estAnnulee
          ? annulee(identifiant, jourDepuisNumero(premiereNuit), jourDepuisNumero(jourDeDepart))
          : bloquante(identifiant, jourDepuisNumero(premiereNuit), jourDepuisNumero(jourDeDepart)),
        premiereNuit,
        jourDeDepart,
        estBloquante: !estAnnulee,
      };
    }),
  );

const arbitraireDemande = fc.tuple(
  fc.integer({ min: -5, max: 45 }),
  fc.integer({ min: -3, max: 14 }),
);

describe("SC-002 — aucune nuitée ne peut être attribuée deux fois", () => {
  it("SC-002 — une demande acceptée ne partage jamais de nuitée avec une réservation bloquante", () => {
    fc.assert(
      fc.property(arbitraireAgenda, arbitraireDemande, (agenda, [arrivee, duree]) => {
        const depart = arrivee + duree;
        const demande = demandeDe(jourDepuisNumero(arrivee), jourDepuisNumero(depart));
        const decision = evaluerDemande(
          demande,
          agenda.map(({ reservation }) => reservation),
        );

        if (duree <= 0) {
          expect(decision.verdict).toBe("demande invalide");
          return;
        }

        const nuiteesDemandees = nuitees(arrivee, depart);
        const bloquantesEnChevauchement = agenda
          .filter(
            ({ estBloquante, premiereNuit, jourDeDepart }) =>
              estBloquante && seChevauchent(nuiteesDemandees, nuitees(premiereNuit, jourDeDepart)),
          )
          .map(({ reservation }) => reservation.identifiant);

        if (bloquantesEnChevauchement.length === 0) {
          expect(decision).toEqual({ verdict: "acceptable" });
          return;
        }

        expect(decision.verdict).toBe("en conflit");
        expect([...conflitsDe(decision)].sort()).toEqual([...bloquantesEnChevauchement].sort());
      }),
      { numRuns: 300 },
    );
  });

  it("SC-002 — un ajout accepté conserve l'agenda sans nuitée attribuée deux fois", () => {
    fc.assert(
      fc.property(arbitraireAgenda, arbitraireDemande, (agenda, [arrivee, duree]) => {
        const depart = arrivee + duree;
        const decision = evaluerDemande(
          demandeDe(jourDepuisNumero(arrivee), jourDepuisNumero(depart)),
          agenda.map(({ reservation }) => reservation),
        );

        if (decision.verdict !== "acceptable") return;

        const nuiteesOccupees = new Set<number>();
        for (const ligne of agenda) {
          if (!ligne.estBloquante) continue;
          for (const nuit of nuitees(ligne.premiereNuit, ligne.jourDeDepart)) {
            nuiteesOccupees.add(nuit);
          }
        }

        for (const nuit of nuitees(arrivee, depart)) {
          expect(nuiteesOccupees.has(nuit)).toBe(false);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe("SC-004 — invariance par répétition et par permutation de l'ordre d'entrée", () => {
  const cinqReservations: readonly Reservation[] = [
    bloquante("R-a", mai(1), mai(5)),
    annulee("R-b", mai(6), mai(9)),
    bloquante("R-c", mai(10), mai(15)),
    bloquante("R-d", mai(15), mai(18)),
    bloquante("R-e", mai(22), mai(24)),
  ];

  it("SC-004 — la même demande évaluée 100 fois de suite produit exactement le même résultat", () => {
    const demande = demandeDe(mai(4), mai(23));
    const reference = evaluerDemande(demande, cinqReservations);

    for (let essai = 0; essai < 100; essai += 1) {
      expect(evaluerDemande(demande, cinqReservations)).toEqual(reference);
    }
  });

  it("SC-004 — les 120 permutations d'un ensemble de 5 réservations produisent le même résultat", () => {
    const demande = demandeDe(mai(4), mai(23));
    const reference = evaluerDemande(demande, cinqReservations);
    const ordres = permutations(cinqReservations);

    expect(ordres).toHaveLength(120);
    expect(reference.verdict).toBe("en conflit");
    expect(conflitsDe(reference)).toEqual(["R-a", "R-c", "R-d", "R-e"]);

    for (const ordre of ordres) {
      expect(evaluerDemande(demande, ordre)).toEqual(reference);
    }
  });

  it("SC-004 — propriété : la décision est invariante par permutation de l'agenda en entrée", () => {
    fc.assert(
      fc.property(
        arbitraireAgenda,
        arbitraireDemande,
        fc.array(fc.integer({ min: 0, max: 1_000 }), { minLength: 6, maxLength: 6 }),
        (agenda, [arrivee, duree], cles) => {
          const demande = demandeDe(jourDepuisNumero(arrivee), jourDepuisNumero(arrivee + duree));
          const reservations = agenda.map(({ reservation }) => reservation);

          const decisionInitiale = evaluerDemande(demande, reservations);
          const decisionPermutee = evaluerDemande(demande, permuter(reservations, cles));

          expect(decisionPermutee).toEqual(decisionInitiale);
        },
      ),
      { numRuns: 300 },
    );
  });

  it("SC-004 — propriété : les conflits restitués sont toujours triés par arrivée puis identifiant (FR-010)", () => {
    fc.assert(
      fc.property(arbitraireAgenda, arbitraireDemande, (agenda, [arrivee, duree]) => {
        const reservations = agenda.map(({ reservation }) => reservation);
        const decision = evaluerDemande(
          demandeDe(jourDepuisNumero(arrivee), jourDepuisNumero(arrivee + duree)),
          reservations,
        );

        const conflits = conflitsDe(decision);
        const parIdentifiant = new Map(
          reservations.map((reservation) => [reservation.identifiant, reservation] as const),
        );

        const cles = conflits.map((identifiant) => {
          const reservation = parIdentifiant.get(identifiant);
          expect(reservation).toBeDefined();
          return `${reservation?.arrivee ?? ""}|${identifiant}`;
        });

        expect(cles).toEqual([...cles].sort());
      }),
      { numRuns: 300 },
    );
  });

  it("SC-005 — propriété : l'évaluation ne modifie ni la demande ni l'agenda fournis", () => {
    fc.assert(
      fc.property(arbitraireAgenda, arbitraireDemande, (agenda, [arrivee, duree]) => {
        const demande = demandeDe(jourDepuisNumero(arrivee), jourDepuisNumero(arrivee + duree));
        const reservations = agenda.map(({ reservation }) => reservation);

        const copieDemande = structuredClone<Demande>(demande);
        const copieReservations = structuredClone<Reservation[]>(reservations);

        evaluerDemande(demande, reservations);

        expect(demande).toEqual(copieDemande);
        expect(reservations).toEqual(copieReservations);
      }),
      { numRuns: 300 },
    );
  });
});
