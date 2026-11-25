import test from 'node:test';
import assert from 'node:assert/strict';
import { createPetRuntime } from '../pet.js';
import { PET_SCHEMA_VERSION, createPet } from '../pet-domain.js';

const NOW = Date.UTC(2026, 0, 2, 12, 0, 0);

function createRoot() {
  return {
    innerHTML: '',
    addEventListener() {},
    querySelector() {
      return null;
    }
  };
}

test('inicializa um pet existente sem tratá-lo como save corrompido', async () => {
  const pet = createPet('Lumi', 'orbit', NOW);
  const notifications = [];
  const runtime = createPetRuntime({
    load: async () => ({ schemaVersion: PET_SCHEMA_VERSION, pet }),
    save: async () => true,
    notify: (message) => notifications.push(message),
    now: () => NOW
  });
  try {
    const state = await runtime.init(createRoot());
    assert.equal(state.name, 'Lumi');
    assert.equal(state.speciesId, 'orbit');
    assert.deepEqual(notifications, []);
  } finally {
    runtime.destroy();
  }
});

test('corrige o relógio durante a inicialização e informa a correção', async () => {
  const pet = createPet('Lumi', 'tami', NOW + 10000);
  const notifications = [];
  const runtime = createPetRuntime({
    load: async () => ({ schemaVersion: PET_SCHEMA_VERSION, pet }),
    save: async () => true,
    notify: (message) => notifications.push(message),
    now: () => NOW
  });
  try {
    const state = await runtime.init(createRoot());
    assert.equal(state.lastTickAt, NOW);
    assert.ok(notifications.some((message) => message.includes('relógio')));
  } finally {
    runtime.destroy();
  }
});

test('mantém a navegação do Pet em uma barra rolável e mostra o custo do remédio', async () => {
  const pet = createPet('Lumi', 'tami', NOW);
  const runtime = createPetRuntime({
    load: async () => ({ schemaVersion: PET_SCHEMA_VERSION, pet }),
    save: async () => true,
    now: () => NOW
  });
  const root = createRoot();
  try {
    await runtime.init(root);
    assert.match(root.innerHTML, /class="pet-view-tabs"/);
    assert.match(root.innerHTML, /Custa 12 moedas\./);
  } finally {
    runtime.destroy();
  }
});

test('avisa quando uma missão é concluída ao usar um item', async () => {
  const pet = createPet('Lumi', 'tami', NOW);
  pet.inventory.snack = 1;
  pet.daily.counters.fed = 1;
  const notifications = [];
  const runtime = createPetRuntime({
    load: async () => ({ schemaVersion: PET_SCHEMA_VERSION, pet }),
    save: async () => true,
    notify: (message) => notifications.push(message),
    now: () => NOW
  });
  try {
    await runtime.init(createRoot());
    await runtime.buy('use', 'snack');
    const last = notifications[notifications.length - 1];
    assert.ok(last.includes('Missão concluída'));
    assert.ok(last.includes('Alimente seu pet 2 vezes'));
  } finally {
    runtime.destroy();
  }
});

test('informa falha de salvamento sem esconder o sucesso da ação', async () => {
  const notifications = [];
  const runtime = createPetRuntime({
    load: async () => null,
    save: async () => false,
    notify: (message) => notifications.push(message),
    now: () => NOW
  });
  try {
    await runtime.adopt();
    await runtime.buy('buy', 'snack');
    const last = notifications[notifications.length - 1];
    assert.ok(last.includes('Não foi possível salvar'));
    assert.ok(last.includes('Item comprado'));
  } finally {
    runtime.destroy();
  }
});

test('permite comprar consumíveis repetidamente', async () => {
  const notifications = [];
  const runtime = createPetRuntime({
    load: async () => null,
    save: async () => true,
    notify: (message) => notifications.push(message),
    now: () => NOW
  });
  try {
    await runtime.adopt();
    await runtime.buy('buy', 'snack');
    await runtime.buy('buy', 'snack');
    const state = runtime.getState();
    assert.equal(state.coins, 18);
    assert.equal(state.inventory.snack, 2);
    assert.equal(notifications.filter((message) => message.includes('Item comprado')).length, 2);
  } finally {
    runtime.destroy();
  }
});
