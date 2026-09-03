import { describe, expect, it } from "vitest";
import { APP_NAME } from "../../src/index.js";

// Test de fumée : garantit que le harnais tourne avant la première spec.
// Il sera conservé — c'est lui qui détecte une casse de la chaîne elle-même.
describe("harnais", () => {
  it("charge le module racine", () => {
    expect(APP_NAME).toBe("apricale-booking");
  });
});
