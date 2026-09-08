// SF-001 — Détection de chevauchement de réservations.
// Logique pure : aucune horloge, aucun aléa, aucune entrée/sortie (FR-013).

export type JourCalendaire = string;

export type StatutReservation = "confirmée" | "annulée";

export interface Demande {
  readonly arrivee: JourCalendaire;
  readonly depart: JourCalendaire;
}

export interface Reservation {
  readonly identifiant: string;
  readonly arrivee: JourCalendaire;
  readonly depart: JourCalendaire;
  readonly statut: StatutReservation;
}

export type Decision =
  | { readonly verdict: "acceptable" }
  | { readonly verdict: "demande invalide" }
  | { readonly verdict: "en conflit"; readonly reservationsEnConflit: readonly string[] };

const estBloquante = (reservation: Reservation): boolean => reservation.statut !== "annulée";

const seChevauchent = (demande: Demande, reservation: Reservation): boolean =>
  demande.arrivee < reservation.depart && reservation.arrivee < demande.depart;

const comparerReservations = (gauche: Reservation, droite: Reservation): number => {
  if (gauche.arrivee !== droite.arrivee) {
    return gauche.arrivee < droite.arrivee ? -1 : 1;
  }
  if (gauche.identifiant === droite.identifiant) return 0;
  return gauche.identifiant < droite.identifiant ? -1 : 1;
};

export const evaluerDemande = (
  demande: Demande,
  reservationsExistantes: readonly Reservation[],
): Decision => {
  if (demande.depart <= demande.arrivee) {
    return { verdict: "demande invalide" };
  }

  const bloquantesEnConflit = reservationsExistantes
    .filter(estBloquante)
    .filter((reservation) => seChevauchent(demande, reservation));

  if (bloquantesEnConflit.length === 0) {
    return { verdict: "acceptable" };
  }

  const reservationsEnConflit = [...bloquantesEnConflit]
    .sort(comparerReservations)
    .map((reservation) => reservation.identifiant);

  return { verdict: "en conflit", reservationsEnConflit };
};
