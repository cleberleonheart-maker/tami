export const PET_SCHEMA_VERSION = 1;
export const PET_SAVE_KEY = 'petSave';
export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
export const NEED_KEYS = Object.freeze(['hunger', 'energy', 'hygiene', 'happiness', 'health']);
export const LEVEL_XP = Object.freeze([0, 25, 60, 110, 180, 270, 390, 550, 760, 1020, 1350]);

export const SPECIES = Object.freeze({
  tami: {
    id: 'tami',
    name: ['TAMI', 'TAMI', 'TAMI'],
    trait: [
      'Adora música e fica feliz quando você cuida dela',
      'Loves music and gets happy when you care for her',
      'Le gusta la música y se pone feliz cuando la cuidas'
    ],
    main: '#00E5FF',
    accent: '#FF2FD6',
    shape: 'round'
  },
  orbit: {
    id: 'orbit',
    name: ['Órbita', 'Orbit', 'Órbita'],
    trait: [
      'Tem muita energia e se recupera rápido descansando',
      'Has lots of energy and recovers quickly while resting',
      'Tiene mucha energía y se recupera rápido descansando'
    ],
    main: '#B388FF',
    accent: '#54A0FF',
    shape: 'wide'
  },
  echo: {
    id: 'echo',
    name: ['Eco', 'Echo', 'Eco'],
    trait: [
      'Cria vínculos fortes e gosta de carinho',
      'Forms strong bonds and loves cuddles',
      'Crea vínculos fuertes y disfruta los mimos'
    ],
    main: '#30FFC0',
    accent: '#00A8C8',
    shape: 'tall'
  }
});

export const STAGES = Object.freeze({
  baby: {
    id: 'baby',
    order: 0,
    level: 1,
    xp: 0,
    care: 0,
    name: ['Bebê', 'Baby', 'Bebé'],
    description: ['Está descobrindo o mundo', 'Discovering the world', 'Descubriendo el mundo']
  },
  teen: {
    id: 'teen',
    order: 1,
    level: 3,
    xp: 60,
    care: 45,
    name: ['Jovem', 'Teen', 'Joven'],
    description: ['Cheia de novas ideias', 'Full of new ideas', 'Llena de nuevas ideas']
  },
  adult: {
    id: 'adult',
    order: 2,
    level: 6,
    xp: 270,
    care: 55,
    name: ['Adulta', 'Adult', 'Adulta'],
    description: ['Confiante e independente', 'Confident and independent', 'Segura e independiente']
  },
  legend: {
    id: 'legend',
    order: 3,
    level: 10,
    xp: 1020,
    care: 70,
    name: ['Lenda', 'Legend', 'Leyenda'],
    description: ['Uma presença especial', 'A special presence', 'Una presencia especial']
  }
});

export const ACTIONS = Object.freeze({
  feed: {
    id: 'feed',
    cooldown: 8 * 60 * 1000,
    cost: 0,
    xp: 6,
    coins: 2,
    bond: 2,
    effects: { hunger: 30, happiness: 3, energy: 1, hygiene: -2 },
    stat: 'fed',
    label: ['Alimentar', 'Feed', 'Alimentar'],
    description: ['Oferece uma refeição', 'Offers a meal', 'Ofrece una comida']
  },
  clean: {
    id: 'clean',
    cooldown: 12 * 60 * 1000,
    cost: 0,
    xp: 5,
    coins: 1,
    bond: 1,
    effects: { hygiene: 38, happiness: 2 },
    stat: 'cleaned',
    label: ['Limpar', 'Clean', 'Limpiar'],
    description: ['Cuida da higiene', 'Takes care of hygiene', 'Cuida la higiene']
  },
  play: {
    id: 'play',
    cooldown: 20 * 60 * 1000,
    cost: 0,
    xp: 8,
    coins: 3,
    bond: 3,
    effects: { happiness: 28, energy: -8, hunger: -4 },
    stat: 'played',
    label: ['Brincar', 'Play', 'Jugar'],
    description: ['Faz uma sessão de brincadeira', 'Starts a play session', 'Inicia una sesión de juego']
  },
  rest: {
    id: 'rest',
    cooldown: 30 * 60 * 1000,
    cost: 0,
    xp: 5,
    coins: 1,
    bond: 1,
    effects: { energy: 30, happiness: 1 },
    stat: 'rested',
    label: ['Descansar', 'Rest', 'Descansar'],
    description: ['Recupera energia agora', 'Restores energy now', 'Recupera energía ahora']
  },
  cuddle: {
    id: 'cuddle',
    cooldown: 20 * 60 * 1000,
    cost: 0,
    xp: 4,
    coins: 1,
    bond: 5,
    effects: { happiness: 10, energy: -1 },
    stat: 'cuddled',
    label: ['Carinho', 'Cuddle', 'Caricia'],
    description: ['Aumenta o vínculo', 'Increases the bond', 'Aumenta el vínculo']
  },
  sleep: {
    id: 'sleep',
    cooldown: 30 * 60 * 1000,
    cost: 0,
    xp: 2,
    coins: 0,
    bond: 0,
    effects: { energy: 10 },
    stat: '',
    label: ['Dormir', 'Sleep', 'Dormir'],
    description: ['Dorme e recupera energia', 'Sleeps and restores energy', 'Duerme y recupera energía']
  },
  wake: {
    id: 'wake',
    cooldown: 0,
    cost: 0,
    xp: 2,
    coins: 0,
    bond: 0,
    effects: {},
    stat: '',
    label: ['Acordar', 'Wake up', 'Despertar'],
    description: ['Acorda e começa o dia', 'Wakes up and starts the day', 'Despierta y empieza el día']
  },
  medicine: {
    id: 'medicine',
    cooldown: 10 * 60 * 1000,
    cost: 12,
    xp: 6,
    coins: 0,
    bond: 1,
    effects: { health: 35, happiness: 2 },
    stat: 'medicined',
    label: ['Medicar', 'Medicine', 'Medicar'],
    description: ['Ajuda a recuperar a saúde', 'Helps restore health', 'Ayuda a recuperar la salud']
  }
});

export const SHOP_ITEMS = Object.freeze({
  snack: {
    id: 'snack',
    kind: 'consumable',
    cost: 6,
    effects: { hunger: 18, happiness: 4 },
    xp: 2,
    name: ['Lanchinho', 'Snack', 'Tentempié'],
    description: ['Uma refeição extra', 'An extra meal', 'Una comida extra']
  },
  tonic: {
    id: 'tonic',
    kind: 'consumable',
    cost: 12,
    effects: { health: 30, happiness: 2 },
    xp: 3,
    name: ['Tônico', 'Tonic', 'Tónico'],
    description: ['Ajuda a recuperar a saúde', 'Helps restore health', 'Ayuda a recuperar la salud']
  },
  ball: {
    id: 'ball',
    kind: 'bonus',
    cost: 18,
    name: ['Bola', 'Ball', 'Pelota'],
    description: ['Brincar rende 8 pontos a mais', 'Playing gives 8 extra points', 'Jugar da 8 puntos extra']
  },
  blanket: {
    id: 'blanket',
    kind: 'wearable',
    cost: 26,
    name: ['Cobertor', 'Blanket', 'Manta'],
    description: ['Melhora a recuperação de energia', 'Improves energy recovery', 'Mejora la recuperación de energía']
  },
  charm: {
    id: 'charm',
    kind: 'wearable',
    cost: 38,
    name: ['Amuleto', 'Charm', 'Amuleto'],
    description: ['Aumenta o ganho de vínculo', 'Increases bond gain', 'Aumenta la ganancia de vínculo']
  },
  headphones: {
    id: 'headphones',
    kind: 'wearable',
    cost: 32,
    name: ['Fones', 'Headphones', 'Auriculares'],
    description: ['Deixa o pet mais feliz ao brincar', 'Makes the pet happier while playing', 'Pone más feliz al pet al jugar']
  },
  crown: {
    id: 'crown',
    kind: 'wearable',
    cost: 60,
    unlockStage: 'adult',
    name: ['Coroa', 'Crown', 'Corona'],
    description: ['Uma coroa para pets adultos', 'A crown for adult pets', 'Una corona para pets adultos']
  }
});

export const DAILY_QUESTS = Object.freeze([
  {
    id: 'feed',
    counter: 'fed',
    target: 2,
    reward: 6,
    xp: 4,
    description: ['Alimente seu pet 2 vezes', 'Feed your pet twice', 'Alimenta a tu mascota 2 veces']
  },
  {
    id: 'clean',
    counter: 'cleaned',
    target: 1,
    reward: 5,
    xp: 3,
    description: ['Limpe seu pet uma vez', 'Clean your pet once', 'Limpia a tu mascota una vez']
  },
  {
    id: 'play',
    counter: 'played',
    target: 2,
    reward: 7,
    xp: 5,
    description: ['Brinque com seu pet 2 vezes', 'Play with your pet twice', 'Juega con tu mascota 2 veces']
  },
  {
    id: 'rest',
    counter: 'rested',
    target: 1,
    reward: 4,
    xp: 3,
    description: ['Faça seu pet descansar', 'Let your pet rest', 'Haz descansar a tu mascota']
  },
  {
    id: 'game',
    counter: 'game',
    target: 1,
    reward: 8,
    xp: 5,
    description: ['Vença um desafio musical', 'Win a music challenge', 'Gana un desafío musical']
  }
]);

export const ACHIEVEMENTS = Object.freeze([
  {
    id: 'firstCare',
    name: ['Primeiro cuidado', 'First care', 'Primer cuidado'],
    description: ['Cuide do seu pet pela primeira vez', 'Care for your pet for the first time', 'Cuida de tu mascota por primera vez'],
    test: (pet) => pet.stats.totalCare >= 1
  },
  {
    id: 'caretaker',
    name: ['Carinhosa', 'Caretaker', 'Cuidadora'],
    description: ['Complete 25 cuidados', 'Complete 25 care actions', 'Completa 25 cuidados'],
    test: (pet) => pet.stats.totalCare >= 25
  },
  {
    id: 'level5',
    name: ['Em evolução', 'Growing strong', 'En evolución'],
    description: ['Alcance o nível 5', 'Reach level 5', 'Alcanza el nivel 5'],
    test: (pet) => pet.level >= 5
  },
  {
    id: 'bond80',
    name: ['Melhor amiga', 'Best friend', 'Mejor amiga'],
    description: ['Chegue a 80 pontos de vínculo', 'Reach 80 bond points', 'Llega a 80 puntos de vínculo'],
    test: (pet) => pet.bond >= 80
  },
  {
    id: 'grown',
    name: ['Nova fase', 'New phase', 'Nueva fase'],
    description: ['Evolua para a fase jovem', 'Evolve to the teen phase', 'Evoluciona a la fase joven'],
    test: (pet) => stageOrder(pet.stageId) > stageOrder('baby')
  },
  {
    id: 'perfect',
    name: ['Melodia perfeita', 'Perfect melody', 'Melodía perfecta'],
    description: ['Vença um desafio sem erros', 'Win a challenge without mistakes', 'Gana un desafío sin errores'],
    test: (pet) => pet.stats.perfectGames >= 1
  },
  {
    id: 'streak7',
    name: ['Semana seguida', 'Week streak', 'Racha semanal'],
    description: ['Cuide do pet por 7 dias seguidos', 'Care for your pet 7 days in a row', 'Cuida de la mascota 7 días seguidos'],
    test: (pet) => pet.streak.count >= 7
  },
  {
    id: 'collector',
    name: ['Colecionadora', 'Collector', 'Coleccionadora'],
    description: ['Tenha 10 itens no inventário', 'Own 10 items in the inventory', 'Ten 10 objetos en el inventario'],
    test: (pet) => Object.values(pet.inventory).reduce((sum, count) => sum + count, 0) >= 10
  },
  {
    id: 'healthy',
    name: ['Recuperada', 'Recovered', 'Recuperada'],
    description: ['Ajude o pet a se recuperar de uma doença', 'Help the pet recover from illness', 'Ayuda a la mascota a recuperarse de una enfermedad'],
    test: (pet) => pet.stats.recoveries >= 1
  }
]);

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const clone = (value) => JSON.parse(JSON.stringify(value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const integer = (value, fallback = 0) => Math.max(0, Math.floor(finite(value, fallback)));
const stageOrder = (id) => STAGES[id] ? STAGES[id].order : 0;

function dayKey(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function previousDayKey(timestamp) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() - 1);
  return dayKey(date.getTime());
}

function updateStreakState(pet, timestamp) {
  const today = dayKey(timestamp);
  if (pet.streak.lastCareDate === today) return;
  pet.streak.count = pet.streak.lastCareDate === previousDayKey(timestamp) ? pet.streak.count + 1 : 1;
  pet.streak.lastCareDate = today;
}

function refreshStreakState(pet, timestamp) {
  if (!pet.streak.lastCareDate) return;
  const today = dayKey(timestamp);
  const previous = previousDayKey(timestamp);
  if (pet.streak.lastCareDate !== today && pet.streak.lastCareDate !== previous) pet.streak.count = 0;
}

function safeName(value, fallback = 'TAMI') {
  const name = String(value || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 18);
  return name || fallback;
}

export function getLevelForXp(xp) {
  const value = Math.max(0, finite(xp));
  let level = 1;
  for (let index = 1; index < LEVEL_XP.length; index++) {
    if (value < LEVEL_XP[index]) break;
    level = index + 1;
  }
  return level;
}

export function getCareScore(pet) {
  if (!pet || !pet.needs) return 0;
  const total = NEED_KEYS.filter((key) => key !== 'health').reduce((sum, key) => sum + clamp(pet.needs[key]), 0);
  return Math.round((total / 4) * 10) / 10;
}

export function getMood(pet) {
  if (!pet || !pet.needs) return 'okay';
  if (pet.sick) return 'sick';
  if (pet.sleeping) return 'sleeping';
  if (clamp(pet.needs.hunger) <= 20) return 'hungry';
  if (clamp(pet.needs.hygiene) <= 20) return 'dirty';
  if (clamp(pet.needs.energy) <= 20) return 'tired';
  if (clamp(pet.needs.happiness) >= 80 && getCareScore(pet) >= 75) return 'amazing';
  if (clamp(pet.needs.happiness) >= 65) return 'happy';
  if (getCareScore(pet) < 30) return 'sad';
  return 'okay';
}

export function createPet(name, speciesId = 'tami', now = Date.now()) {
  if (typeof speciesId === 'number') {
    now = speciesId;
    speciesId = 'tami';
  }
  const timestamp = finite(now, Date.now());
  const safeSpecies = SPECIES[speciesId] ? speciesId : 'tami';
  const fallbackName = SPECIES[safeSpecies].name[0];
  return {
    id: `pet-${timestamp.toString(36)}`,
    name: safeName(name, fallbackName),
    speciesId: safeSpecies,
    stageId: 'baby',
    ageMinutes: 0,
    xp: 0,
    level: 1,
    coins: 30,
    needs: { hunger: 82, energy: 88, hygiene: 90, happiness: 78, health: 100 },
    bond: 20,
    sick: false,
    sleeping: false,
    lastTickAt: timestamp,
    lastActionAt: {},
    lastGameAt: 0,
    stats: {
      fed: 0,
      cleaned: 0,
      played: 0,
      rested: 0,
      cuddled: 0,
      medicined: 0,
      games: 0,
      perfectGames: 0,
      recoveries: 0,
      totalCare: 0
    },
    inventory: {},
    equipped: {},
    achievements: [],
    daily: { date: dayKey(timestamp), counters: {}, claimed: [] },
    streak: { count: 0, lastCareDate: '' },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function normalizePet(raw, now = Date.now()) {
  const timestamp = finite(now, Date.now());
  const source = raw && typeof raw === 'object' ? raw : {};
  const speciesId = SPECIES[source.speciesId] ? source.speciesId : 'tami';
  const needs = source.needs && typeof source.needs === 'object' ? source.needs : {};
  const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
  const inventory = {};
  if (source.inventory && typeof source.inventory === 'object') {
    for (const itemId of Object.keys(SHOP_ITEMS)) {
      const count = integer(source.inventory[itemId]);
      if (count > 0) inventory[itemId] = count;
    }
  }
  const equipped = {};
  if (source.equipped && typeof source.equipped === 'object') {
    for (const itemId of Object.keys(SHOP_ITEMS)) {
      if (SHOP_ITEMS[itemId].kind === 'wearable' && inventory[itemId] > 0 && source.equipped[itemId]) {
        equipped[itemId] = true;
      }
    }
  }
  const equippedIds = Object.keys(equipped);
  if (equippedIds.length > 1) {
    for (const itemId of equippedIds.slice(1)) delete equipped[itemId];
  }
  const lastActionAt = {};
  if (source.lastActionAt && typeof source.lastActionAt === 'object') {
    for (const actionId of Object.keys(ACTIONS)) {
      const value = finite(source.lastActionAt[actionId]);
      if (value > 0) lastActionAt[actionId] = value;
    }
  }
  const achievements = Array.isArray(source.achievements)
    ? [...new Set(source.achievements.filter((id) => ACHIEVEMENTS.some((item) => item.id === id)))]
    : [];
  const dailySource = source.daily && typeof source.daily === 'object' ? source.daily : {};
  const counters = {};
  if (dailySource.counters && typeof dailySource.counters === 'object') {
    for (const key of ['fed', 'cleaned', 'played', 'rested', 'cuddled', 'medicined', 'game']) {
      counters[key] = integer(dailySource.counters[key]);
    }
  }
  const claimed = Array.isArray(dailySource.claimed)
    ? [...new Set(dailySource.claimed.filter((id) => DAILY_QUESTS.some((quest) => quest.id === id)))]
    : [];
  const xp = Math.max(0, finite(source.xp));
  const stageId = STAGES[source.stageId] ? source.stageId : 'baby';
  return {
    id: String(source.id || `pet-${timestamp.toString(36)}`),
    name: safeName(source.name, SPECIES[speciesId].name[0]),
    speciesId,
    stageId,
    ageMinutes: Math.max(0, finite(source.ageMinutes)),
    xp,
    level: Math.max(1, integer(source.level, getLevelForXp(xp)), getLevelForXp(xp)),
    coins: Math.max(0, integer(source.coins)),
    needs: {
      hunger: clamp(needs.hunger, 0, 100),
      energy: clamp(needs.energy, 0, 100),
      hygiene: clamp(needs.hygiene, 0, 100),
      happiness: clamp(needs.happiness, 0, 100),
      health: clamp(needs.health, 0, 100)
    },
    bond: clamp(source.bond),
    sick: !!source.sick,
    sleeping: !!source.sleeping,
    lastTickAt: Math.max(0, finite(source.lastTickAt, timestamp)),
    lastActionAt,
    lastGameAt: Math.max(0, finite(source.lastGameAt)),
    stats: {
      fed: integer(stats.fed),
      cleaned: integer(stats.cleaned),
      played: integer(stats.played),
      rested: integer(stats.rested),
      cuddled: integer(stats.cuddled),
      medicined: integer(stats.medicined),
      games: integer(stats.games),
      perfectGames: integer(stats.perfectGames),
      recoveries: integer(stats.recoveries),
      totalCare: integer(stats.totalCare)
    },
    inventory,
    equipped,
    achievements,
    daily: {
      date: String(dailySource.date || dayKey(timestamp)),
      counters,
      claimed
    },
    streak: {
      count: integer(source.streak && source.streak.count),
      lastCareDate: String(source.streak && source.streak.lastCareDate || '')
    },
    createdAt: Math.max(0, finite(source.createdAt, timestamp)),
    updatedAt: Math.max(0, finite(source.updatedAt, timestamp))
  };
}

export function normalizeSave(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return { schemaVersion: PET_SCHEMA_VERSION, pet: null };
  const version = integer(raw.schemaVersion, PET_SCHEMA_VERSION);
  if (version > PET_SCHEMA_VERSION) throw new Error('unsupported-schema');
  if (!raw.pet) return { schemaVersion: PET_SCHEMA_VERSION, pet: null };
  return { schemaVersion: PET_SCHEMA_VERSION, pet: normalizePet(raw.pet, now) };
}

function grantXpState(pet, amount, events) {
  const before = pet.level;
  pet.xp = Math.max(0, pet.xp + Math.max(0, integer(amount)));
  pet.level = getLevelForXp(pet.xp);
  if (pet.level > before) events.push({ type: 'levelUp', level: pet.level });
}

function grantCoinsState(pet, amount) {
  pet.coins = Math.max(0, pet.coins + integer(amount));
}

function checkAchievementsState(pet, events) {
  for (const achievement of ACHIEVEMENTS) {
    if (pet.achievements.includes(achievement.id)) continue;
    let unlocked = false;
    try {
      unlocked = !!achievement.test(pet);
    } catch (error) {
      unlocked = false;
    }
    if (!unlocked) continue;
    pet.achievements.push(achievement.id);
    events.push({ type: 'achievement', id: achievement.id });
  }
}

function evaluateEvolutionState(pet, events) {
  let order = stageOrder(pet.stageId);
  while (order < 3) {
    const next = Object.values(STAGES).find((stage) => stage.order === order + 1);
    if (!next) break;
    if (pet.level < next.level || pet.xp < next.xp || getCareScore(pet) < next.care) break;
    pet.stageId = next.id;
    order = next.order;
    events.push({ type: 'evolved', stageId: next.id });
  }
}

export function refreshDailyState(pet, now = Date.now()) {
  const next = clone(pet);
  const today = dayKey(now);
  if (next.daily.date !== today) {
    next.daily = { date: today, counters: {}, claimed: [] };
  }
  return next;
}

export function applyElapsed(pet, elapsedMs, now = Date.now()) {
  const next = clone(pet);
  const events = [];
  const elapsed = finite(elapsedMs);
  const timestamp = finite(now, Date.now());
  if (elapsed <= 0) return { pet: next, events };
  const effective = Math.min(elapsed, MAX_OFFLINE_MS);
  if (elapsed > MAX_OFFLINE_MS) events.push({ type: 'offlineCapped' });
  const previous = { ...next.needs };
  const species = SPECIES[next.speciesId] || SPECIES.tami;
  const energyRate = species.id === 'orbit' ? 2.4 : 3;
  const hungerRate = species.id === 'orbit' ? 4.5 : 4;
  const hygieneRate = species.id === 'echo' ? 2.4 : 3;
  const happinessRate = species.id === 'echo' ? 2.6 : 2.2;
  let remaining = effective;
  while (remaining > 0) {
    const step = Math.min(remaining, 60 * 1000);
    const hours = step / (60 * 60 * 1000);
    if (next.sleeping) {
      next.needs.energy = clamp(next.needs.energy + 12 * hours);
      next.needs.hunger = clamp(next.needs.hunger - hungerRate * 0.5 * hours);
      next.needs.hygiene = clamp(next.needs.hygiene - hygieneRate * 0.35 * hours);
      next.needs.happiness = clamp(next.needs.happiness + 0.5 * hours);
    } else {
      next.needs.energy = clamp(next.needs.energy - energyRate * hours);
      next.needs.hunger = clamp(next.needs.hunger - hungerRate * hours);
      next.needs.hygiene = clamp(next.needs.hygiene - hygieneRate * hours);
      next.needs.happiness = clamp(next.needs.happiness - happinessRate * hours);
    }
    const average = (next.needs.hunger + next.needs.energy + next.needs.hygiene + next.needs.happiness) / 4;
    if (average < 30) next.needs.health = clamp(next.needs.health - 3 * hours);
    else if (average < 50) next.needs.health = clamp(next.needs.health - 1 * hours);
    else if (average > 75) next.needs.health = clamp(next.needs.health + 1.5 * hours);
    remaining -= step;
  }
  next.ageMinutes += effective / 60000;
  if (!next.sick && (next.needs.hygiene <= 10 || next.needs.hunger <= 5)) {
    next.sick = true;
    events.push({ type: 'becameSick' });
  }
  if (next.sick && next.needs.hygiene >= 50 && next.needs.hunger >= 40 && next.needs.health >= 70) {
    next.sick = false;
    next.stats.recoveries += 1;
    events.push({ type: 'recovered' });
  }
  for (const need of NEED_KEYS) {
    if (next.needs[need] <= 20 && previous[need] > 20) events.push({ type: 'needCritical', need });
  }
  next.lastTickAt = timestamp;
  next.updatedAt = timestamp;
  refreshStreakState(next, timestamp);
  evaluateEvolutionState(next, events);
  checkAchievementsState(next, events);
  return { pet: next, events };
}

export function evaluateEvolution(pet, now = Date.now()) {
  const next = clone(pet);
  const events = [];
  evaluateEvolutionState(next, events);
  next.updatedAt = finite(now, Date.now());
  return { pet: next, events };
}

export function getActionAvailability(pet, actionId, now = Date.now()) {
  const action = ACTIONS[actionId];
  if (!action) return { allowed: false, reason: 'unknown', remaining: 0 };
  const timestamp = finite(now, Date.now());
  const last = finite(pet.lastActionAt && pet.lastActionAt[actionId]);
  const remaining = action.cooldown > 0 && last > 0 ? Math.min(action.cooldown, Math.max(0, action.cooldown - (timestamp - last))) : 0;
  if (remaining > 0) return { allowed: false, reason: 'cooldown', remaining };
  if (actionId === 'medicine' && !pet.sick) return { allowed: false, reason: 'notSick', remaining: 0 };
  if (actionId === 'sleep' && pet.sleeping) return { allowed: false, reason: 'alreadySleeping', remaining: 0 };
  if (actionId === 'wake' && !pet.sleeping) return { allowed: false, reason: 'notSleeping', remaining: 0 };
  if (pet.coins < action.cost) return { allowed: false, reason: 'coins', remaining: 0 };
  return { allowed: true, reason: '', remaining: 0 };
}

export function performAction(pet, actionId, now = Date.now()) {
  const action = ACTIONS[actionId];
  const availability = getActionAvailability(pet, actionId, now);
  if (!action) return { ok: false, pet: clone(pet), events: [], error: 'unknown' };
  if (!availability.allowed) return { ok: false, pet: clone(pet), events: [], error: availability.reason, remaining: availability.remaining };
  const next = refreshDailyState(pet, now);
  const events = [];
  const timestamp = finite(now, Date.now());
  if (actionId === 'sleep') next.sleeping = true;
  if (actionId === 'wake') next.sleeping = false;
  const effects = { ...action.effects };
  if (actionId === 'play') {
    if (next.inventory.ball) effects.happiness += 8;
    if (next.equipped.headphones) effects.happiness += 4;
    if (next.speciesId === 'tami') effects.happiness += 3;
  }
  if (actionId === 'rest' && next.equipped.blanket) effects.energy += 8;
  for (const need of Object.keys(effects)) next.needs[need] = clamp(next.needs[need] + effects[need]);
  let bondGain = action.bond;
  if (next.equipped.charm) bondGain += 2;
  if (next.speciesId === 'echo') bondGain += 1;
  next.bond = clamp(next.bond + bondGain);
  next.lastActionAt[actionId] = timestamp;
  if (action.stat) {
    next.stats[action.stat] = integer(next.stats[action.stat]) + 1;
    next.stats.totalCare += 1;
    updateStreakState(next, timestamp);
    const counter = action.stat === 'medicined' ? 'medicined' : action.stat;
    next.daily.counters[counter] = integer(next.daily.counters[counter]) + 1;
  }
  grantCoinsState(next, action.coins);
  grantXpState(next, action.xp, events);
  if (actionId === 'medicine') {
    next.sick = false;
    next.stats.recoveries += 1;
    events.push({ type: 'recovered' });
  }
  evaluateEvolutionState(next, events);
  checkAchievementsState(next, events);
  next.updatedAt = timestamp;
  return { ok: true, pet: next, events, error: '' };
}

export function getItemAvailability(pet, itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return { allowed: false, reason: 'unknown' };
  if (item.unlockStage && stageOrder(pet.stageId) < stageOrder(item.unlockStage)) {
    return { allowed: false, reason: 'stage' };
  }
  if (pet.coins < item.cost) return { allowed: false, reason: 'coins' };
  return { allowed: true, reason: '' };
}

export function buyItem(pet, itemId, now = Date.now()) {
  const item = SHOP_ITEMS[itemId];
  const availability = getItemAvailability(pet, itemId);
  if (!item) return { ok: false, pet: clone(pet), events: [], error: 'unknown' };
  if (!availability.allowed) return { ok: false, pet: clone(pet), events: [], error: availability.reason };
  const next = clone(pet);
  next.coins -= item.cost;
  next.inventory[itemId] = integer(next.inventory[itemId]) + 1;
  next.updatedAt = finite(now, Date.now());
  const events = [{ type: 'itemBought', itemId }];
  checkAchievementsState(next, events);
  return { ok: true, pet: next, events, error: '' };
}

export function useItem(pet, itemId, now = Date.now()) {
  const item = SHOP_ITEMS[itemId];
  if (!item || item.kind !== 'consumable') return { ok: false, pet: clone(pet), events: [], error: 'notConsumable' };
  if (integer(pet.inventory[itemId]) <= 0) return { ok: false, pet: clone(pet), events: [], error: 'notOwned' };
  const next = refreshDailyState(pet, now);
  const events = [];
  const timestamp = finite(now, Date.now());
  for (const need of Object.keys(item.effects)) next.needs[need] = clamp(next.needs[need] + item.effects[need]);
  next.inventory[itemId] -= 1;
  if (next.inventory[itemId] <= 0) delete next.inventory[itemId];
  if (itemId === 'snack') {
    next.stats.fed += 1;
    next.stats.totalCare += 1;
    next.daily.counters.fed = integer(next.daily.counters.fed) + 1;
    updateStreakState(next, timestamp);
  }
  if (itemId === 'tonic') {
    if (next.sick) {
      next.stats.recoveries += 1;
      events.push({ type: 'recovered' });
    }
    next.sick = false;
    next.stats.medicined += 1;
    next.stats.totalCare += 1;
    next.daily.counters.medicined = integer(next.daily.counters.medicined) + 1;
    updateStreakState(next, timestamp);
  }
  grantXpState(next, item.xp, events);
  evaluateEvolutionState(next, events);
  checkAchievementsState(next, events);
  next.updatedAt = timestamp;
  return { ok: true, pet: next, events, error: '' };
}

export function equipItem(pet, itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item || item.kind !== 'wearable') return { ok: false, pet: clone(pet), error: 'notWearable' };
  if (integer(pet.inventory[itemId]) <= 0) return { ok: false, pet: clone(pet), error: 'notOwned' };
  const next = clone(pet);
  if (next.equipped[itemId]) delete next.equipped[itemId];
  else {
    next.equipped = { [itemId]: true };
  }
  return { ok: true, pet: next, error: '' };
}

export function getDailyQuests(pet, now = Date.now()) {
  const today = dayKey(now);
  const counters = pet.daily && pet.daily.date === today ? pet.daily.counters : {};
  const claimed = pet.daily && pet.daily.date === today ? pet.daily.claimed : [];
  return DAILY_QUESTS.map((quest) => {
    const progress = integer(counters[quest.counter]);
    return {
      ...quest,
      progress,
      complete: progress >= quest.target,
      claimed: claimed.includes(quest.id)
    };
  });
}

export function claimQuest(pet, questId, now = Date.now()) {
  const next = refreshDailyState(pet, now);
  const quest = getDailyQuests(next, now).find((item) => item.id === questId);
  if (!quest) return { ok: false, pet: next, events: [], error: 'unknown' };
  if (!quest.complete) return { ok: false, pet: next, events: [], error: 'incomplete' };
  if (quest.claimed) return { ok: false, pet: next, events: [], error: 'claimed' };
  next.daily.claimed.push(questId);
  next.coins += quest.reward;
  next.bond = clamp(next.bond + 1);
  const events = [];
  grantXpState(next, quest.xp, events);
  evaluateEvolutionState(next, events);
  checkAchievementsState(next, events);
  next.updatedAt = finite(now, Date.now());
  return { ok: true, pet: next, events, error: '' };
}

export function getMinigameCooldown(pet, now = Date.now()) {
  const last = finite(pet.lastGameAt);
  if (!last) return 0;
  return Math.max(0, 60 * 1000 - Math.max(0, finite(now) - last));
}

export function createMemorySequence(length = 4, random = Math.random) {
  const size = Math.max(2, Math.min(8, integer(length, 4)));
  const sequence = [];
  for (let index = 0; index < size; index++) sequence.push(Math.floor(random() * 4) % 4);
  return sequence;
}

export function isMemoryInputCorrect(sequence, input) {
  const expected = Array.isArray(sequence) ? sequence : [];
  const received = Array.isArray(input) ? input : [];
  if (received.length > expected.length) return false;
  return expected.every((value, index) => index >= received.length || value === received[index]);
}

export function completeMinigame(pet, options = {}) {
  const now = finite(options.now, Date.now());
  if (getMinigameCooldown(pet, now) > 0) {
    return { ok: false, pet: clone(pet), events: [], error: 'cooldown' };
  }
  const next = refreshDailyState(pet, now);
  const events = [];
  next.stats.games += 1;
  if (options.perfect) next.stats.perfectGames += 1;
  next.daily.counters.game = integer(next.daily.counters.game) + 1;
  next.needs.happiness = clamp(next.needs.happiness + 12);
  next.needs.energy = clamp(next.needs.energy - 3);
  next.bond = clamp(next.bond + 2);
  next.coins += 8;
  next.lastGameAt = now;
  updateStreakState(next, now);
  grantXpState(next, 12, events);
  evaluateEvolutionState(next, events);
  checkAchievementsState(next, events);
  next.updatedAt = now;
  return { ok: true, pet: next, events, error: '' };
}

export function renamePet(pet, name) {
  const next = clone(pet);
  next.name = safeName(name, next.name);
  next.updatedAt = Date.now();
  return next;
}
