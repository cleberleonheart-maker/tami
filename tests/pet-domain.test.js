import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PET_SCHEMA_VERSION,
  MAX_OFFLINE_MS,
  createPet,
  normalizeSave,
  applyElapsed,
  performAction,
  getActionAvailability,
  evaluateEvolution,
  getCareScore,
  getDailyQuests,
  claimQuest,
  buyItem,
  useItem,
  equipItem,
  completeMinigame,
  failMinigame,
  getMinigameCooldown,
  createMemorySequence,
  isMemoryInputCorrect,
  renamePet
} from '../pet-domain.js';

const NOW = Date.UTC(2026, 0, 2, 12, 0, 0);

test('cria um pet com necessidades, identidade e progresso válidos', () => {
  const pet = createPet('Lumi', 'orbit', NOW);
  assert.equal(pet.name, 'Lumi');
  assert.equal(pet.speciesId, 'orbit');
  assert.equal(pet.stageId, 'baby');
  assert.equal(pet.level, 1);
  assert.equal(pet.coins, 30);
  for (const value of Object.values(pet.needs)) {
    assert.ok(value >= 0 && value <= 100);
  }
});

test('rejeita identificadores herdados e repara saves corrompidos', () => {
  for (const speciesId of ['toString', 'constructor', '__proto__']) {
    const pet = createPet('Lumi', speciesId, NOW);
    assert.equal(pet.speciesId, 'tami');
  }

  const raw = JSON.parse('{"speciesId":"__proto__","stageId":"toString"}');
  const normalized = normalizeSave({ schemaVersion: PET_SCHEMA_VERSION, pet: raw }, NOW).pet;
  assert.equal(normalized.speciesId, 'tami');
  assert.equal(normalized.stageId, 'baby');

  const pet = createPet('TAMI', 'tami', NOW);
  const action = performAction(pet, 'toString', NOW);
  assert.equal(action.ok, false);
  assert.equal(action.error, 'unknown');
  assert.equal(action.pet.coins, pet.coins);
  assert.equal(action.pet.xp, pet.xp);

  const purchase = buyItem(pet, 'constructor', NOW);
  assert.equal(purchase.ok, false);
  assert.equal(purchase.error, 'unknown');
  assert.equal(purchase.pet.coins, pet.coins);
  assert.deepEqual(purchase.pet.inventory, pet.inventory);
});

test('aplica o decaimento offline e aumenta a idade', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const result = applyElapsed(pet, 60 * 60 * 1000, NOW + 60 * 60 * 1000);
  assert.ok(result.pet.needs.hunger < pet.needs.hunger);
  assert.ok(result.pet.needs.energy < pet.needs.energy);
  assert.ok(result.pet.needs.hygiene < pet.needs.hygiene);
  assert.ok(result.pet.needs.happiness < pet.needs.happiness);
  assert.equal(result.pet.ageMinutes, 60);
});

test('limita o catch-up offline a 24 horas', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const result = applyElapsed(pet, 48 * 60 * 60 * 1000, NOW + 48 * 60 * 60 * 1000);
  assert.equal(result.pet.ageMinutes, MAX_OFFLINE_MS / 60000);
  assert.equal(result.pet.needs.hunger, 0);
  assert.ok(result.events.some((event) => event.type === 'offlineCapped'));
});

test('ignora relógios no passado e mantém as necessidades entre 0 e 100', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const result = applyElapsed(pet, -5000, NOW - 5000);
  assert.deepEqual(result.pet.needs, pet.needs);
  assert.equal(result.pet.ageMinutes, 0);
  assert.ok(Object.values(result.pet.needs).every((value) => value >= 0 && value <= 100));
});

test('cuida do pet, concede recompensas e respeita o cooldown', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const first = performAction(pet, 'feed', NOW);
  assert.equal(first.ok, true);
  assert.equal(first.pet.needs.hunger, 100);
  assert.ok(first.pet.coins > pet.coins);
  assert.ok(first.pet.xp > pet.xp);
  assert.equal(first.pet.stats.fed, 1);
  assert.ok(first.events.some((event) => event.type === 'achievement'));
  const second = performAction(first.pet, 'feed', NOW + 1000);
  assert.equal(second.ok, false);
  assert.equal(second.error, 'cooldown');
});

test('bloqueia cuidado que exige moedas quando o saldo é insuficiente', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.coins = 0;
  pet.sick = true;
  const result = performAction(pet, 'medicine', NOW);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'coins');
  assert.equal(result.pet.coins, 0);
  assert.equal(result.pet.xp, 0);
  assert.equal(result.pet.stats.medicined, 0);
});

test('desconta o custo de um cuidado comprado', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.coins = 30;
  pet.sick = true;
  const result = performAction(pet, 'medicine', NOW);
  assert.equal(result.ok, true);
  assert.equal(result.pet.coins, 18);
  assert.equal(result.pet.stats.medicined, 1);
  assert.equal(result.pet.xp, 6);
});

test('calcula nível e pontuação de cuidado', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.needs = { hunger: 80, energy: 70, hygiene: 90, happiness: 60, health: 100 };
  assert.equal(getCareScore(pet), 75);
  const result = performAction(pet, 'play', NOW);
  assert.equal(result.pet.xp, 8);
  assert.equal(result.pet.level, 1);
});

test('evolui apenas quando nível, XP e qualidade de cuidado atendem aos limites', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.xp = 60;
  pet.level = 3;
  pet.needs = { hunger: 60, energy: 60, hygiene: 60, happiness: 60, health: 100 };
  const result = evaluateEvolution(pet, NOW);
  assert.equal(result.pet.stageId, 'teen');
  assert.ok(result.events.some((event) => event.type === 'evolved'));
  const neglected = createPet('TAMI', 'tami', NOW);
  neglected.xp = 60;
  neglected.level = 3;
  neglected.needs = { hunger: 20, energy: 20, hygiene: 20, happiness: 20, health: 40 };
  assert.equal(evaluateEvolution(neglected, NOW).pet.stageId, 'baby');
});

test('compra, usa e equipa itens respeitando o inventário', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.coins = 100;
  const bought = buyItem(pet, 'snack', NOW);
  assert.equal(bought.ok, true);
  assert.equal(bought.pet.coins, 94);
  assert.equal(bought.pet.inventory.snack, 1);
  const boughtAgain = buyItem(bought.pet, 'snack', NOW);
  assert.equal(boughtAgain.ok, true);
  assert.equal(boughtAgain.pet.coins, 88);
  assert.equal(boughtAgain.pet.inventory.snack, 2);
  assert.equal(boughtAgain.pet.xp, 0);
  assert.equal(boughtAgain.pet.stats.fed, 0);
  const used = useItem(boughtAgain.pet, 'snack', NOW);
  assert.equal(used.ok, true);
  assert.equal(used.pet.inventory.snack, 1);
  assert.equal(used.pet.needs.hunger, 100);
  const wearable = buyItem(pet, 'charm', NOW);
  const equipped = equipItem(wearable.pet, 'charm', NOW + 1000);
  assert.equal(equipped.ok, true);
  assert.equal(equipped.pet.equipped.charm, true);
  assert.equal(equipped.pet.updatedAt, NOW + 1000);

  const renamed = renamePet(wearable.pet, ' Aurora ', NOW + 2000);
  assert.equal(renamed.name, 'Aurora');
  assert.equal(renamed.updatedAt, NOW + 2000);
});

test('conclui e resgata uma missão diária somente uma vez', () => {
  let pet = createPet('TAMI', 'tami', NOW);
  const first = performAction(pet, 'feed', NOW);
  pet = first.pet;
  const second = performAction(pet, 'feed', NOW + 9 * 60 * 1000);
  pet = second.pet;
  const quest = getDailyQuests(pet, NOW + 9 * 60 * 1000).find((item) => item.id === 'feed');
  assert.equal(quest.complete, true);
  const claimed = claimQuest(pet, 'feed', NOW + 9 * 60 * 1000);
  assert.equal(claimed.ok, true);
  assert.equal(claimed.pet.coins, pet.coins + 6);
  const repeated = claimQuest(claimed.pet, 'feed', NOW + 9 * 60 * 1000);
  assert.equal(repeated.ok, false);
  assert.equal(repeated.error, 'claimed');
});

test('recompensa o minigame e bloqueia novas tentativas durante o cooldown', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const result = completeMinigame(pet, { perfect: true, now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.pet.stats.games, 1);
  assert.equal(result.pet.stats.perfectGames, 1);
  assert.equal(result.pet.coins, pet.coins + 8);
  assert.equal(result.pet.streak.count, 0);
  assert.equal(result.pet.streak.lastCareDate, '');
  assert.ok(getMinigameCooldown(result.pet, NOW + 30000) > 0);
  const repeated = completeMinigame(result.pet, { perfect: true, now: NOW + 30000 });
  assert.equal(repeated.ok, false);
  assert.equal(repeated.error, 'cooldown');
});

test('registra a falha do minigame sem conceder recompensa', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  const result = failMinigame(pet, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.pet.lastGameAt, NOW);
  assert.equal(result.pet.stats.games, 0);
  assert.equal(result.pet.xp, 0);
  assert.equal(result.pet.coins, pet.coins);
  assert.ok(getMinigameCooldown(result.pet, NOW) > 0);
});

test('gera sequências determinísticas e limitadas para o minigame', () => {
  const sequence = createMemorySequence(4, () => 0.75);
  assert.equal(sequence.length, 4);
  assert.deepEqual(sequence, [3, 3, 3, 3]);
  assert.equal(createMemorySequence(99, () => 0).length, 8);
});

test('valida cada tecla do minigame contra a sequência correta', () => {
  const sequence = [0, 1, 2, 3];
  assert.equal(isMemoryInputCorrect(sequence, [0]), true);
  assert.equal(isMemoryInputCorrect(sequence, [0, 1]), true);
  assert.equal(isMemoryInputCorrect(sequence, [0, 2]), false);
  assert.equal(isMemoryInputCorrect(sequence, [0, 1, 2, 3]), true);
  assert.equal(isMemoryInputCorrect(sequence, [0, 1, 2, 3, 0]), false);
});

test('detecta doença e recuperação em ticks de um minuto', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.needs.hygiene = 10;
  pet.needs.hunger = 20;
  const sick = applyElapsed(pet, 60 * 1000, NOW + 60 * 1000);
  assert.equal(sick.pet.sick, true);
  assert.ok(sick.events.some((event) => event.type === 'becameSick'));

  sick.pet.needs.hygiene = 60;
  sick.pet.needs.hunger = 60;
  sick.pet.needs.health = 80;
  const recovered = applyElapsed(sick.pet, 60 * 1000, NOW + 2 * 60 * 1000);
  assert.equal(recovered.pet.sick, false);
  assert.equal(recovered.pet.stats.recoveries, 1);
  assert.ok(recovered.events.some((event) => event.type === 'recovered'));
});

test('reconstrói o progresso ao normalizar sem ignorar o requisito de cuidado', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.xp = 60;
  pet.level = 99;
  pet.stageId = 'baby';
  const normalized = normalizeSave({ schemaVersion: PET_SCHEMA_VERSION, pet }, NOW).pet;
  assert.equal(normalized.level, 3);
  assert.equal(normalized.stageId, 'teen');

  const neglected = createPet('TAMI', 'tami', NOW);
  neglected.xp = 60;
  neglected.needs = { hunger: 20, energy: 20, hygiene: 20, happiness: 20, health: 40 };
  const normalizedNeglected = normalizeSave({ schemaVersion: PET_SCHEMA_VERSION, pet: neglected }, NOW).pet;
  assert.equal(normalizedNeglected.stageId, 'baby');

  neglected.stageId = 'teen';
  const earned = normalizeSave({ schemaVersion: PET_SCHEMA_VERSION, pet: neglected }, NOW).pet;
  assert.equal(earned.stageId, 'teen');
});

test('corrige timestamps quando o relógio do aparelho volta', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.lastTickAt = NOW + 10000;
  pet.lastActionAt.feed = NOW + 5000;
  pet.lastGameAt = NOW + 5000;
  const result = applyElapsed(pet, -10000, NOW);
  assert.ok(result.events.some((event) => event.type === 'clockAdjusted'));
  assert.equal(result.pet.lastTickAt, NOW);
  assert.equal(result.pet.lastActionAt.feed, 0);
  assert.equal(result.pet.lastGameAt, 0);
  assert.equal(getActionAvailability(result.pet, 'feed', NOW).allowed, true);
  assert.equal(getMinigameCooldown(result.pet, NOW), 0);
});

test('normaliza saves antigos, rejeita schemas futuros e limita campos inválidos', () => {
  const pet = createPet('TAMI', 'tami', NOW);
  pet.needs.hunger = 999;
  pet.coins = -10;
  const normalized = normalizeSave({ schemaVersion: PET_SCHEMA_VERSION, pet }, NOW);
  assert.equal(normalized.pet.needs.hunger, 100);
  assert.equal(normalized.pet.coins, 0);
  assert.throws(() => normalizeSave({ schemaVersion: PET_SCHEMA_VERSION + 1, pet }, NOW), /unsupported-schema/);
});
