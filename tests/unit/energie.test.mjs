// La batterie d'un protocole : les kW gagnés attendent dans la batterie, puis rejoignent le compteur d'un seul coup,
// au branchement sur la capsule. Le compteur du haut affiche « énergie - held » : rien ne doit se perdre ni compter
// deux fois. Chaque bonne réponse allume une cellule ; la dernière s'allume à la fin du protocole.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fillBattery, getEnergyBar, holdEnergy, landEnergy, releaseEnergy, startEnergyBar, stopEnergyBar } from "../../src/lib/energy.ts";

test("les kW d'un protocole attendent dans la batterie, puis sont versés d'un coup au branchement", () => {
  startEnergyBar(70, 4);
  assert.deepEqual(getEnergyBar(), { held: 0, landed: 0, max: 70, cells: 4, lit: 0 });
  holdEnergy(10); // une bonne réponse : le compteur du haut ne bouge pas encore
  assert.equal(getEnergyBar().held, 10);
  assert.equal(getEnergyBar().landed, 0, "les kW sont encore en vol");
  landEnergy(10);
  assert.equal(getEnergyBar().landed, 10);
  assert.equal(getEnergyBar().lit, 1, "l'éclair a allumé une cellule");
  holdEnergy(40); landEnergy(40, false); // fin du protocole : kW versés sans éclair
  assert.equal(getEnergyBar().lit, 1);
  fillBattery(); // le grand éclair charge la dernière cellule
  assert.equal(getEnergyBar().lit, 4, "la batterie est pleine");
  assert.equal(releaseEnergy(), 50, "le total versé est celui du protocole");
  assert.equal(getEnergyBar().held, 0);
});

test("les cellules ne dépassent jamais la batterie, la dernière attend la fin, et quitter rend tout au compteur", () => {
  startEnergyBar(50, 3, 5); // reprise : plus de vérifications réussies que de cellules de vérification
  assert.equal(getEnergyBar().lit, 2, "la dernière cellule reste réservée à la fin du protocole");
  holdEnergy(10);
  landEnergy(30);
  assert.equal(getEnergyBar().landed, 10, "jamais plus que ce qui a été gagné");
  assert.equal(getEnergyBar().lit, 2, "une bonne réponse ne peut pas allumer la dernière cellule");
  stopEnergyBar();
  assert.deepEqual(getEnergyBar(), { held: 0, landed: 0, max: 0, cells: 0, lit: 0 });
});
