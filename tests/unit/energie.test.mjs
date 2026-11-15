// La barre d'énergie d'un protocole : les kW gagnés attendent dans la barre, puis rejoignent le compteur
// d'un seul coup. Le compteur du haut affiche « énergie - held » : rien ne doit se perdre ni compter deux fois.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getEnergyBar, holdEnergy, landEnergy, releaseEnergy, startEnergyBar, stopEnergyBar } from "../../src/lib/energy.ts";

test("les kW d'un protocole attendent dans la barre, puis sont versés d'un coup", () => {
  startEnergyBar(70);
  assert.deepEqual(getEnergyBar(), { held: 0, landed: 0, max: 70 });
  holdEnergy(10); // une bonne réponse : le compteur du haut ne bouge pas encore
  assert.equal(getEnergyBar().held, 10);
  assert.equal(getEnergyBar().landed, 0, "les kW sont encore en vol");
  landEnergy(10);
  assert.equal(getEnergyBar().landed, 10);
  holdEnergy(40); landEnergy(40); // fin du protocole
  assert.equal(releaseEnergy(), 50, "le total versé est celui du protocole");
  assert.deepEqual(getEnergyBar(), { held: 0, landed: 0, max: 70 });
});

test("la barre n'affiche jamais plus que ce qui a été gagné, et quitter le protocole rend tout au compteur", () => {
  startEnergyBar(50);
  holdEnergy(10);
  landEnergy(30);
  assert.equal(getEnergyBar().landed, 10);
  stopEnergyBar();
  assert.deepEqual(getEnergyBar(), { held: 0, landed: 0, max: 0 });
});
