import {
  PET_SCHEMA_VERSION,
  SPECIES,
  STAGES,
  ACTIONS,
  SHOP_ITEMS,
  ACHIEVEMENTS,
  NEED_KEYS,
  LEVEL_XP,
  createPet,
  applyElapsed,
  performAction,
  getActionAvailability,
  getDailyQuests,
  claimQuest,
  buyItem,
  useItem,
  equipItem,
  getItemAvailability,
  getMinigameCooldown,
  createMemorySequence,
  isMemoryInputCorrect,
  completeMinigame,
  renamePet,
  normalizeSave,
  getMood,
  getCareScore
} from './pet-domain.js';

export * from './pet-domain.js';

const TEXT = {
  petTab: ['Pet', 'Pet', 'Mascota'],
  adoptTitle: ['Adote seu pet', 'Adopt your pet', 'Adopta tu mascota'],
  adoptSubtitle: ['Escolha uma companheira e cuide dela todos os dias.', 'Choose a companion and care for her every day.', 'Elige una compañera y cuida de ella todos los días.'],
  chooseSpecies: ['Escolha a espécie', 'Choose a species', 'Elige la especie'],
  petName: ['Nome do pet', 'Pet name', 'Nombre de la mascota'],
  petNamePlaceholder: ['Digite um nome', 'Type a name', 'Escribe un nombre'],
  adopt: ['Adotar agora', 'Adopt now', 'Adoptar ahora'],
  buy: ['Comprar por {cost}', 'Buy for {cost}', 'Comprar por {cost}'],
  use: ['Usar', 'Use', 'Usar'],
  equip: ['Equipar', 'Equip', 'Equipar'],
  unequip: ['Remover', 'Unequip', 'Retirar'],
  owned: ['Adquirido', 'Owned', 'Adquirido'],
  complete: ['Concluída', 'Completed', 'Completada'],
  level: ['Nível', 'Level', 'Nivel'],
  xp: ['Experiência', 'Experience', 'Experiencia'],
  coins: ['Moedas', 'Coins', 'Monedas'],
  bond: ['Vínculo', 'Bond', 'Vínculo'],
  careScore: ['Cuidado', 'Care', 'Cuidado'],
  stage: ['Fase', 'Stage', 'Fase'],
  needsTitle: ['Necessidades', 'Needs', 'Necesidades'],
  hunger: ['Fome', 'Hunger', 'Hambre'],
  energy: ['Energia', 'Energy', 'Energía'],
  hygiene: ['Higiene', 'Hygiene', 'Higiene'],
  happiness: ['Felicidade', 'Happiness', 'Felicidad'],
  health: ['Saúde', 'Health', 'Salud'],
  actionsTitle: ['Cuidados', 'Care actions', 'Cuidados'],
  shopTitle: ['Loja', 'Shop', 'Tienda'],
  shopSubtitle: ['Itens para deixar seu pet mais feliz.', 'Items to make your pet happier.', 'Objetos para hacer feliz a tu mascota.'],
  gameTitle: ['Desafio musical', 'Music challenge', 'Desafío musical'],
  gameSubtitle: ['Repita a melodia nas quatro cores.', 'Repeat the melody using the four colors.', 'Repite la melodía con los cuatro colores.'],
  gameIdle: ['Escolha a dificuldade para começar.', 'Choose a difficulty to start.', 'Elige la dificultad para empezar.'],
  gameWatch: ['Observe a melodia.', 'Watch the melody.', 'Observa la melodía.'],
  gameYourTurn: ['Agora é sua vez.', 'Your turn now.', 'Ahora es tu turno.'],
  gameSuccess: ['Melodia perfeita!', 'Perfect melody!', '¡Melodía perfecta!'],
  gameFailed: ['Quase! Tente outra vez.', 'Almost! Try again.', '¡Casi! Inténtalo otra vez.'],
  gameStart: ['Começar', 'Start', 'Empezar'],
  difficultyEasy: ['Fácil', 'Easy', 'Fácil'],
  difficultyNormal: ['Normal', 'Normal', 'Normal'],
  difficultyHard: ['Difícil', 'Hard', 'Difícil'],
  gameReward: ['Recompensa: 8 moedas, 12 XP e carinho.', 'Reward: 8 coins, 12 XP and affection.', 'Recompensa: 8 monedas, 12 XP y cariño.'],
  gameCooldown: ['O próximo desafio estará disponível em {time}.', 'The next challenge will be available in {time}.', 'El próximo desafío estará disponible en {time}.'],
  questsTitle: ['Missões do dia', 'Daily missions', 'Misiones del día'],
  questsSubtitle: ['Complete as missões para ganhar recompensas.', 'Complete missions to earn rewards.', 'Completa las misiones para ganar recompensas.'],
  streak: ['Sequência de cuidados', 'Care streak', 'Racha de cuidados'],
  claim: ['Resgatar', 'Claim', 'Reclamar'],
  claimed: ['Resgatado', 'Claimed', 'Reclamado'],
  questProgress: ['{current} de {target}', '{current} of {target}', '{current} de {target}'],
  achievementsTitle: ['Conquistas', 'Achievements', 'Logros'],
  achievementsSubtitle: ['Marcos da vida do seu pet.', 'Milestones in your pet’s life.', 'Hitos en la vida de tu mascota.'],
  unlocked: ['Conquistado', 'Unlocked', 'Desbloqueado'],
  locked: ['Bloqueado', 'Locked', 'Bloqueado'],
  settingsTitle: ['Configurações', 'Settings', 'Ajustes'],
  rename: ['Renomear pet', 'Rename pet', 'Renombrar mascota'],
  renamePlaceholder: ['Nome do pet', 'Pet name', 'Nombre de la mascota'],
  saveName: ['Salvar nome', 'Save name', 'Guardar nombre'],
  exportSave: ['Exportar save', 'Export save', 'Exportar partida'],
  importSave: ['Importar save', 'Import save', 'Importar partida'],
  resetPet: ['Recomeçar', 'Start over', 'Empezar de nuevo'],
  resetConfirm: ['Clique novamente para confirmar', 'Click again to confirm', 'Pulsa otra vez para confirmar'],
  lifetimeCare: ['Cuidados realizados', 'Care actions', 'Cuidados realizados'],
  gamesWon: ['Desafios vencidos', 'Challenges won', 'Desafíos ganados'],
  perfectGames: ['Melodias perfeitas', 'Perfect melodies', 'Melodías perfectas'],
  createdAt: ['Adotado em', 'Adopted on', 'Adoptada el'],
  inventory: ['Inventário', 'Inventory', 'Inventario'],
  home: ['Pet', 'Pet', 'Mascota'],
  shop: ['Loja', 'Shop', 'Tienda'],
  game: ['Jogo', 'Game', 'Juego'],
  quests: ['Missões', 'Missions', 'Misiones'],
  achievements: ['Conquistas', 'Achievements', 'Logros'],
  settings: ['Ajustes', 'Settings', 'Ajustes'],
  cooldown: ['Aguarde {time}', 'Wait {time}', 'Espera {time}'],
  notEnoughCoins: ['Moedas insuficientes.', 'Not enough coins.', 'Monedas insuficientes.'],
  notSick: ['O pet não está doente.', 'The pet is not sick.', 'La mascota no está enferma.'],
  alreadySleeping: ['O pet já está dormindo.', 'The pet is already sleeping.', 'La mascota ya está durmiendo.'],
  notSleeping: ['O pet já está acordado.', 'The pet is already awake.', 'La mascota ya está despierta.'],
  unknownAction: ['Ação indisponível.', 'Action unavailable.', 'Acción no disponible.'],
  actionDone: ['Cuidado realizado!', 'Care action completed!', '¡Cuidado realizado!'],
  saved: ['Progresso salvo.', 'Progress saved.', 'Progreso guardado.'],
  saveFailed: ['Não foi possível salvar. O progresso continua nesta sessão.', 'Could not save. Progress remains in this session.', 'No se pudo guardar. El progreso sigue en esta sesión.'],
  levelUp: ['Seu pet chegou ao nível {level}.', 'Your pet reached level {level}.', 'Tu mascota llegó al nivel {level}.'],
  evolved: ['Seu pet evoluiu para a fase {stage}.', 'Your pet evolved into the {stage} stage.', 'Tu mascota evolucionó a la fase {stage}.'],
  achievementUnlocked: ['Conquista desbloqueada: {name}.', 'Achievement unlocked: {name}.', 'Logro desbloqueado: {name}.'],
  questComplete: ['Missão concluída: {name}.', 'Mission completed: {name}.', 'Misión completada: {name}.'],
  sick: ['Seu pet ficou doente. Use um tônico ou cuide das necessidades.', 'Your pet became ill. Use a tonic or restore their needs.', 'Tu mascota se enfermó. Usa un tónico o restaura sus necesidades.'],
  recovered: ['Seu pet se recuperou.', 'Your pet recovered.', 'Tu mascota se recuperó.'],
  needCritical: ['A necessidade {name} está muito baixa.', 'The {name} need is very low.', 'La necesidad de {name} está muy baja.'],
  offlineCapped: ['O tempo offline foi limitado a 24 horas.', 'Offline time was capped at 24 hours.', 'El tiempo sin conexión se limitó a 24 horas.'],
  importError: ['Não foi possível importar esse save.', 'Could not import that save.', 'No se pudo importar esa partida.'],
  exportDone: ['Save exportado.', 'Save exported.', 'Partida exportada.'],
  resetDone: ['O pet foi removido. Você pode adotar outro.', 'The pet was removed. You can adopt another.', 'La mascota fue eliminada. Puedes adoptar otra.'],
  renamed: ['Nome atualizado.', 'Name updated.', 'Nombre actualizado.'],
  bought: ['Item comprado.', 'Item purchased.', 'Objeto comprado.'],
  used: ['Item usado.', 'Item used.', 'Objeto usado.'],
  equipped: ['Item equipado.', 'Item equipped.', 'Objeto equipado.'],
  unequipped: ['Item removido.', 'Item removed.', 'Objeto retirado.'],
  gameRewardToast: ['Desafio vencido!', 'Challenge won!', '¡Desafío ganado!'],
  gameTooSoon: ['Espere um pouco antes de jogar novamente.', 'Wait a little before playing again.', 'Espera un poco antes de jugar otra vez.'],
  notOwned: ['Você ainda não tem este item.', 'You do not own this item yet.', 'Todavía no tienes este objeto.'],
  stageLocked: ['Este item exige a fase {stage}.', 'This item requires the {stage} stage.', 'Este objeto exige la fase {stage}.'],
  mood_happy: ['Feliz', 'Happy', 'Feliz'],
  mood_amazing: ['Maravilhosa', 'Amazing', 'Maravillosa'],
  mood_sad: ['Triste', 'Sad', 'Triste'],
  mood_tired: ['Cansada', 'Tired', 'Cansada'],
  mood_hungry: ['Com fome', 'Hungry', 'Con hambre'],
  mood_dirty: ['Precisa de banho', 'Needs a bath', 'Necesita un baño'],
  mood_sick: ['Doente', 'Sick', 'Enferma'],
  mood_sleeping: ['Dormindo', 'Sleeping', 'Durmiendo'],
  mood_okay: ['Tranquila', 'Calm', 'Tranquila']
};

const SPEECH = {
  happy: [
    'Estou muito feliz com você por aqui!',
    'I am really happy with you taking care of me!',
    '¡Estoy muy feliz de que me cuides!'
  ],
  amazing: [
    'Hoje está tudo perfeito!',
    'Everything feels perfect today!',
    '¡Hoy todo está perfecto!'
  ],
  sad: [
    'Eu sentiu sua falta. Pode cuidar de mim?',
    'I missed you. Could you take care of me?',
    'Te extrañé. ¿Puedes cuidarme?'
  ],
  tired: [
    'Estou com sono. Talvez eu durma um pouco.',
    'I am sleepy. Maybe I should rest for a while.',
    'Tengo sueño. Quizá debería descansar un poco.'
  ],
  hungry: [
    'Meu belly está requesting some food.',
    'My belly is requesting some food.',
    'Mi barriga está pidiendo comida.'
  ],
  dirty: [
    'Um banho deixaria tudo mais gostoso.',
    'A bath would make everything feel better.',
    'Un baño haría que todo se sintiera mejor.'
  ],
  sick: [
    'Não estou me sentindo bem. Cuide de mim?',
    'I am not feeling well. Could you care for me?',
    'No me siento bien. ¿Puedes cuidarme?'
  ],
  sleeping: [
    'Estou dormindo e sonhando com novas músicas.',
    'I am sleeping and dreaming about new music.',
    'Estoy durmiendo y soñando con música nueva.'
  ],
  okay: [
    'Estou bem aqui. Vamos nos divertir!',
    'I am doing well here. Let us have fun!',
    'Estoy bien aquí. ¡Divirtámonos!'
  ]
};

const LANG_INDEX = { pt: 0, en: 1, es: 2 };
const VIEW_IDS = ['home', 'shop', 'game', 'quests', 'achievements', 'settings'];
const NEED_LABELS = {
  hunger: 'hunger',
  energy: 'energy',
  hygiene: 'hygiene',
  happiness: 'happiness',
  health: 'health'
};
const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

function translate(lang, key, vars = {}) {
  const row = TEXT[key] || TEXT.petTab;
  let value = row[LANG_INDEX[lang] ?? 0] ?? row[0] ?? key;
  for (const name of Object.keys(vars || {})) value = value.split('{' + name + '}').join(String(vars[name]));
  return value;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&' + 'amp;',
    '<': '&' + 'lt;',
    '>': '&' + 'gt;',
    '"': '&' + 'quot;',
    "'": '&' + '#39;'
  }[character]));
}

function formatDuration(milliseconds) {
  const seconds = Math.max(1, Math.ceil(milliseconds / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

function formatDate(timestamp, lang) {
  try {
    return new Intl.DateTimeFormat(LOCALE[lang] || 'pt-BR', { dateStyle: 'medium' }).format(new Date(timestamp));
  } catch (error) {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function createPetRuntime(options = {}) {
  const load = typeof options.load === 'function' ? options.load : async () => null;
  const save = typeof options.save === 'function' ? options.save : async () => false;
  const notify = typeof options.notify === 'function' ? options.notify : () => {};
  const speak = typeof options.speak === 'function' ? options.speak : () => {};
  const exportFile = typeof options.exportFile === 'function' ? options.exportFile : () => '';
  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const getLang = typeof options.lang === 'function' ? options.lang : () => 'pt';
  let pet = null;
  let root = null;
  let boundRoot = null;
  let selectedSpecies = 'tami';
  let selectedName = '';
  let view = 'home';
  let game = null;
  let gameTimers = [];
  let resetArmed = false;
  let saveWarningShown = false;
  let interval = 0;

  function lang() {
    const code = getLang();
    return LANG_INDEX[code] === undefined ? 'pt' : code;
  }

  function text(key, vars) {
    return translate(lang(), key, vars);
  }

  function persist(candidate = pet) {
    return Promise.resolve(save({ schemaVersion: PET_SCHEMA_VERSION, pet: candidate })).then((result) => {
      if (result === false) {
        if (!saveWarningShown) {
          saveWarningShown = true;
          notify(text('saveFailed'));
        }
        return false;
      }
      saveWarningShown = false;
      return true;
    }).catch(() => {
      if (!saveWarningShown) {
        saveWarningShown = true;
        notify(text('saveFailed'));
      }
      return false;
    });
  }

  function announceEvents(events) {
    const messages = [];
    let spoken = '';
    let spokenPriority = 0;
    for (const event of events || []) {
      let message = '';
      let priority = 0;
      if (event.type === 'levelUp') {
        message = text('levelUp', { level: event.level });
        priority = 1;
      } else if (event.type === 'evolved') {
        const stage = STAGES[event.stageId];
        message = text('evolved', { stage: stage ? stage.name[LANG_INDEX[lang()]] : event.stageId });
        priority = 4;
      } else if (event.type === 'achievement') {
        const achievement = ACHIEVEMENTS.find((item) => item.id === event.id);
        message = text('achievementUnlocked', {
          name: achievement ? achievement.name[LANG_INDEX[lang()]] : event.id
        });
        priority = 3;
      } else if (event.type === 'becameSick') {
        message = text('sick');
        priority = 2;
      } else if (event.type === 'recovered') {
        message = text('recovered');
        priority = 2;
      } else if (event.type === 'needCritical') {
        message = text('needCritical', { name: text(NEED_LABELS[event.need] || 'health').toLowerCase() });
      } else if (event.type === 'offlineCapped') {
        message = text('offlineCapped');
      }
      if (!message) continue;
      messages.push(message);
      if (priority > spokenPriority) {
        spoken = message;
        spokenPriority = priority;
      }
    }
    if (messages.length) notify(messages.join(' • '));
    if (spoken) speak(spoken);
  }

  function petAvatarHtml() {
    const species = SPECIES[pet.speciesId] || SPECIES.tami;
    const mood = getMood(pet);
    const equipped = Object.keys(pet.equipped || {}).filter((itemId) => pet.equipped[itemId]);
    const accessoryClass = equipped.length ? `pet-accessory-${equipped[0]}` : '';
    return `<button type="button" class="pet-visual pet-species-${species.id} pet-species-${species.shape} pet-stage-${pet.stageId} ${pet.sick ? 'is-sick' : ''} ${pet.sleeping ? 'is-sleeping' : ''} ${accessoryClass}" style="--pet-main:${species.main};--pet-accent:${species.accent}" data-pet-speak aria-label="${escapeHtml(pet.name)}">
      <span class="pet-aura"></span>
      <span class="pet-shadow"></span>
      <span class="pet-character">
        <span class="pet-ear pet-ear-left"></span>
        <span class="pet-ear pet-ear-right"></span>
        <span class="pet-head">
          <span class="pet-eye pet-eye-left"></span>
          <span class="pet-eye pet-eye-right"></span>
          <span class="pet-blush pet-blush-left"></span>
          <span class="pet-blush pet-blush-right"></span>
          <span class="pet-mouth"></span>
          <span class="pet-mark"></span>
        </span>
        <span class="pet-body"></span>
        <span class="pet-arm pet-arm-left"></span>
        <span class="pet-arm pet-arm-right"></span>
      </span>
      <span class="pet-mood">${escapeHtml(text('mood_' + mood))}</span>
    </button>`;
  }

  function renderAdoption() {
    const speciesCards = Object.values(SPECIES).map((species) => {
      const selected = selectedSpecies === species.id;
      return `<button type="button" class="pet-species-card ${selected ? 'selected' : ''}" data-pet-species="${species.id}" style="--pet-main:${species.main};--pet-accent:${species.accent}">
        <span class="pet-species-preview pet-species-${species.id}"><span class="pet-species-head"></span></span>
        <span class="pet-species-name">${escapeHtml(species.name[LANG_INDEX[lang()]])}</span>
        <span class="pet-species-trait">${escapeHtml(species.trait[LANG_INDEX[lang()]])}</span>
        <span class="pet-species-check"></span>
      </button>`;
    }).join('');
    root.innerHTML = `<section class="pet-adoption">
      <div class="pet-adoption-copy">
        <span class="pet-kicker">${escapeHtml(text('petTab'))}</span>
        <h2>${escapeHtml(text('adoptTitle'))}</h2>
        <p>${escapeHtml(text('adoptSubtitle'))}</p>
      </div>
      <h3 class="pet-section-title">${escapeHtml(text('chooseSpecies'))}</h3>
      <div class="pet-species-grid">${speciesCards}</div>
      <label class="pet-name-label" for="pet-name-input">${escapeHtml(text('petName'))}</label>
      <input class="pet-name-input" id="pet-name-input" type="text" maxlength="18" value="${escapeHtml(selectedName)}" placeholder="${escapeHtml(text('petNamePlaceholder'))}" autocomplete="off">
      <button type="button" class="btn pet-primary-button" data-pet-adopt>${escapeHtml(text('adopt'))}</button>
    </section>`;
  }

  function renderNeeds() {
    return NEED_KEYS.map((need) => {
      const value = Math.round(pet.needs[need]);
      const tone = value <= 20 ? 'critical' : value <= 45 ? 'low' : 'good';
      return `<div class="pet-need-row">
        <div class="pet-need-label"><span>${escapeHtml(text(NEED_LABELS[need]))}</span><strong>${value}%</strong></div>
        <div class="pet-meter" role="progressbar" aria-label="${escapeHtml(text(NEED_LABELS[need]))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span class="pet-meter-fill tone-${tone}" style="width:${value}%"></span></div>
      </div>`;
    }).join('');
  }

  function renderActions() {
    const timestamp = now();
    const actionIds = ['feed', 'clean', 'play', 'rest', 'cuddle'];
    actionIds.push(pet.sleeping ? 'wake' : 'sleep');
    actionIds.push('medicine');
    return actionIds.map((actionId) => {
      const action = ACTIONS[actionId];
      const availability = getActionAvailability(pet, actionId, timestamp);
      let note = action.description[LANG_INDEX[lang()]];
      if (!availability.allowed && availability.reason === 'cooldown') note = text('cooldown', { time: formatDuration(availability.remaining) });
      if (!availability.allowed && availability.reason === 'coins') note = text('notEnoughCoins');
      if (!availability.allowed && availability.reason === 'notSick') note = text('notSick');
      return `<button type="button" class="pet-action-button" data-pet-action="${actionId}" ${availability.allowed ? '' : 'disabled'}>
        <span class="pet-action-mark action-${actionId}">${escapeHtml(action.label[LANG_INDEX[lang()]].slice(0, 1))}</span>
        <span class="pet-action-copy"><strong>${escapeHtml(action.label[LANG_INDEX[lang()]])}</strong><small>${escapeHtml(note)}</small></span>
      </button>`;
    }).join('');
  }

  function renderHome() {
    const stage = STAGES[pet.stageId] || STAGES.baby;
    const species = SPECIES[pet.speciesId] || SPECIES.tami;
    const currentLevelXp = LEVEL_XP[pet.level - 1] || 0;
    const nextLevelXp = LEVEL_XP[pet.level] ?? currentLevelXp;
    const xpRange = Math.max(1, nextLevelXp - currentLevelXp);
    const xpProgress = pet.level >= LEVEL_XP.length ? 100 : Math.round(((pet.xp - currentLevelXp) / xpRange) * 100);
    const nextStage = Object.values(STAGES).find((item) => item.order === stage.order + 1);
    const action = ACTIONS;
    return `<div class="pet-home-grid">
      <section class="pet-hero-card">
        <div class="pet-hero-copy">
          <span class="pet-kicker">${escapeHtml(stage.name[LANG_INDEX[lang()]])}</span>
          <h2>${escapeHtml(pet.name)}</h2>
          <p>${escapeHtml(species.trait[LANG_INDEX[lang()]])}</p>
        </div>
        ${petAvatarHtml()}
        <div class="pet-stage-description">${escapeHtml(stage.description[LANG_INDEX[lang()]])}</div>
        <div class="pet-stat-grid">
          <div class="pet-stat"><span>${escapeHtml(text('level'))}</span><strong>${pet.level}</strong></div>
          <div class="pet-stat"><span>${escapeHtml(text('coins'))}</span><strong>${pet.coins}</strong></div>
          <div class="pet-stat"><span>${escapeHtml(text('bond'))}</span><strong>${pet.bond}</strong></div>
          <div class="pet-stat"><span>${escapeHtml(text('careScore'))}</span><strong>${getCareScore(pet)}</strong></div>
        </div>
        <div class="pet-xp-block">
          <div><span>${escapeHtml(text('xp'))}</span><strong>${pet.xp}${nextLevelXp > currentLevelXp ? ` / ${nextLevelXp}` : ''}</strong></div>
          <div class="pet-meter xp"><span class="pet-meter-fill tone-good" style="width:${Math.max(0, Math.min(100, xpProgress))}%"></span></div>
        </div>
        ${nextStage ? `<div class="pet-next-stage"><span>${escapeHtml(text('stage'))}</span><strong>${escapeHtml(nextStage.name[LANG_INDEX[lang()]])}</strong><small>${escapeHtml(text('level'))} ${nextStage.level} · ${escapeHtml(text('careScore'))} ${nextStage.care}</small></div>` : ''}
      </section>
      <section class="pet-panel">
        <div class="pet-panel-title"><h3>${escapeHtml(text('needsTitle'))}</h3><span>${escapeHtml(stage.name[LANG_INDEX[lang()]])}</span></div>
        <div class="pet-needs">${renderNeeds()}</div>
      </section>
      <section class="pet-panel pet-actions-panel">
        <div class="pet-panel-title"><h3>${escapeHtml(text('actionsTitle'))}</h3><span>${escapeHtml(action.play.label[LANG_INDEX[lang()]])} +${action.play.xp} XP</span></div>
        <div class="pet-action-grid">${renderActions()}</div>
      </section>
    </div>`;
  }

  function renderShop() {
    const items = Object.values(SHOP_ITEMS).map((item) => {
      const owned = pet.inventory[item.id] || 0;
      const availability = getItemAvailability(pet, item.id);
      let button = '';
      if (owned <= 0) {
        button = `<button type="button" class="pet-shop-button" data-pet-shop-action="buy" data-pet-item="${item.id}" ${availability.allowed ? '' : 'disabled'}>${escapeHtml(text('buy', { cost: item.cost }))}</button>`;
      } else if (item.kind === 'consumable') {
        button = `<button type="button" class="pet-shop-button" data-pet-shop-action="use" data-pet-item="${item.id}">${escapeHtml(text('use'))}</button>`;
      } else if (item.kind === 'wearable') {
        const equipped = !!pet.equipped[item.id];
        button = `<button type="button" class="pet-shop-button ${equipped ? 'active' : ''}" data-pet-shop-action="equip" data-pet-item="${item.id}">${escapeHtml(text(equipped ? 'unequip' : 'equip'))}</button>`;
      } else {
        button = `<button type="button" class="pet-shop-button" disabled>${escapeHtml(text('owned'))}</button>`;
      }
      let note = item.description[LANG_INDEX[lang()]];
      if (owned <= 0 && !availability.allowed && availability.reason === 'coins') note = text('notEnoughCoins');
      if (owned <= 0 && !availability.allowed && availability.reason === 'stage') {
        const unlockStage = STAGES[item.unlockStage];
        note = text('stageLocked', { stage: unlockStage ? unlockStage.name[LANG_INDEX[lang()]] : item.unlockStage });
      }
      return `<article class="pet-shop-item ${owned > 0 ? 'owned' : ''}">
        <span class="pet-item-mark item-${item.id}">${escapeHtml(item.id.slice(0, 2).toUpperCase())}</span>
        <div class="pet-shop-copy"><h4>${escapeHtml(item.name[LANG_INDEX[lang()]])}</h4><p>${escapeHtml(note)}</p><small>${escapeHtml(text('coins'))}: ${item.cost}${owned > 0 ? ` · ${escapeHtml(text('owned'))}: ${owned}` : ''}</small></div>
        ${button}
      </article>`;
    }).join('');
    return `<section class="pet-page">
      <div class="pet-page-heading"><div><span class="pet-kicker">${escapeHtml(text('shop'))}</span><h2>${escapeHtml(text('shopTitle'))}</h2><p>${escapeHtml(text('shopSubtitle'))}</p></div><div class="pet-wallet">${escapeHtml(text('coins'))}<strong>${pet.coins}</strong></div></div>
      <div class="pet-shop-grid">${items}</div>
    </section>`;
  }

  function renderGame() {
    const cooldown = getMinigameCooldown(pet, now());
    const padLabels = ['1', '2', '3', '4'];
    const pads = padLabels.map((label, index) => `<button type="button" class="pet-pad pet-pad-${index}" data-pet-pad="${index}" ${game && game.phase !== 'input' ? 'disabled' : ''} aria-label="${escapeHtml(text('game'))} ${index + 1}">${label}</button>`).join('');
    let body = '';
    if (!game) {
      body = `<div class="pet-game-start">
        <p>${escapeHtml(text('gameIdle'))}</p>
        <div class="pet-difficulty-grid">
          <button type="button" class="pet-difficulty" data-pet-game-start="easy"><strong>${escapeHtml(text('difficultyEasy'))}</strong><small>3</small></button>
          <button type="button" class="pet-difficulty" data-pet-game-start="normal"><strong>${escapeHtml(text('difficultyNormal'))}</strong><small>4</small></button>
          <button type="button" class="pet-difficulty" data-pet-game-start="hard"><strong>${escapeHtml(text('difficultyHard'))}</strong><small>6</small></button>
        </div>
      </div>`;
    } else {
      let status = text('gameWatch');
      if (game.phase === 'input') status = text('gameYourTurn');
      if (game.phase === 'success') status = text('gameSuccess');
      if (game.phase === 'failed') status = text('gameFailed');
      const progress = game.phase === 'input' ? `${game.input.length} / ${game.sequence.length}` : `${game.sequence.length}`;
      body = `<div class="pet-game-active">
        <div class="pet-game-status"><strong>${escapeHtml(status)}</strong><span>${escapeHtml(progress)}</span></div>
        <div class="pet-pad-grid">${pads}</div>
        ${game.phase === 'success' || game.phase === 'failed' ? `<button type="button" class="btn pet-secondary-button" data-pet-game-start="normal">${escapeHtml(text('gameStart'))}</button>` : ''}
      </div>`;
    }
    const cooldownText = cooldown > 0 ? `<div class="pet-game-cooldown">${escapeHtml(text('gameCooldown', { time: formatDuration(cooldown) }))}</div>` : '';
    return `<section class="pet-page">
      <div class="pet-page-heading"><div><span class="pet-kicker">${escapeHtml(text('game'))}</span><h2>${escapeHtml(text('gameTitle'))}</h2><p>${escapeHtml(text('gameSubtitle'))}</p></div></div>
      ${body}${cooldownText}
      <div class="pet-reward-note">${escapeHtml(text('gameReward'))}</div>
    </section>`;
  }

  function renderQuests() {
    const quests = getDailyQuests(pet, now());
    const rows = quests.map((quest) => {
      const canClaim = quest.complete && !quest.claimed;
      return `<article class="pet-quest ${quest.complete ? 'complete' : ''}">
        <div class="pet-quest-copy"><h4>${escapeHtml(quest.description[LANG_INDEX[lang()]])}</h4><div class="pet-quest-progress"><div class="pet-meter"><span class="pet-meter-fill tone-${quest.complete ? 'good' : 'low'}" style="width:${Math.min(100, (quest.progress / quest.target) * 100)}%"></span></div><span>${escapeHtml(text('questProgress', { current: quest.progress, target: quest.target }))}</span></div></div>
        <div class="pet-quest-reward"><span>${escapeHtml(text('coins'))} +${quest.reward}</span><button type="button" class="pet-shop-button" data-pet-claim="${quest.id}" ${canClaim ? '' : 'disabled'}>${escapeHtml(text(quest.claimed ? 'claimed' : canClaim ? 'claim' : 'complete'))}</button></div>
      </article>`;
    }).join('');
    return `<section class="pet-page">
      <div class="pet-page-heading"><div><span class="pet-kicker">${escapeHtml(text('quests'))}</span><h2>${escapeHtml(text('questsTitle'))}</h2><p>${escapeHtml(text('questsSubtitle'))}</p></div><div class="pet-streak"><span>${escapeHtml(text('streak'))}</span><strong>${pet.streak.count}</strong></div></div>
      <div class="pet-quest-list">${rows}</div>
    </section>`;
  }

  function renderAchievements() {
    const items = ACHIEVEMENTS.map((achievement) => {
      const unlocked = pet.achievements.includes(achievement.id);
      return `<article class="pet-achievement ${unlocked ? 'unlocked' : ''}">
        <span class="pet-achievement-mark">${unlocked ? '✓' : '—'}</span>
        <div><h4>${escapeHtml(achievement.name[LANG_INDEX[lang()]])}</h4><p>${escapeHtml(achievement.description[LANG_INDEX[lang()]])}</p><small>${escapeHtml(text(unlocked ? 'unlocked' : 'locked'))}</small></div>
      </article>`;
    }).join('');
    return `<section class="pet-page">
      <div class="pet-page-heading"><div><span class="pet-kicker">${escapeHtml(text('achievements'))}</span><h2>${escapeHtml(text('achievementsTitle'))}</h2><p>${escapeHtml(text('achievementsSubtitle'))}</p></div></div>
      <div class="pet-achievement-grid">${items}</div>
    </section>`;
  }

  function renderSettings() {
    const inventoryCount = Object.values(pet.inventory).reduce((sum, count) => sum + count, 0);
    return `<section class="pet-page">
      <div class="pet-page-heading"><div><span class="pet-kicker">${escapeHtml(text('settings'))}</span><h2>${escapeHtml(text('settingsTitle'))}</h2></div></div>
      <section class="pet-panel pet-settings-panel">
        <h3>${escapeHtml(text('rename'))}</h3>
        <div class="pet-rename-row"><input id="pet-rename-input" type="text" maxlength="18" value="${escapeHtml(pet.name)}" placeholder="${escapeHtml(text('renamePlaceholder'))}"><button type="button" class="btn pet-secondary-button" data-pet-rename>${escapeHtml(text('saveName'))}</button></div>
        <div class="pet-settings-stats">
          <div><span>${escapeHtml(text('lifetimeCare'))}</span><strong>${pet.stats.totalCare}</strong></div>
          <div><span>${escapeHtml(text('gamesWon'))}</span><strong>${pet.stats.games}</strong></div>
          <div><span>${escapeHtml(text('perfectGames'))}</span><strong>${pet.stats.perfectGames}</strong></div>
          <div><span>${escapeHtml(text('inventory'))}</span><strong>${inventoryCount}</strong></div>
        </div>
        <div class="pet-created">${escapeHtml(text('createdAt'))}: ${escapeHtml(formatDate(pet.createdAt, lang()))}</div>
        <div class="pet-settings-actions">
          <button type="button" class="btn pet-secondary-button" data-pet-export>${escapeHtml(text('exportSave'))}</button>
          <button type="button" class="btn pet-secondary-button" data-pet-import>${escapeHtml(text('importSave'))}</button>
          <button type="button" class="btn pet-danger-button" data-pet-reset>${escapeHtml(text(resetArmed ? 'resetConfirm' : 'resetPet'))}</button>
        </div>
        <input type="file" id="pet-import-file" accept="application/json,.json" hidden>
      </section>
    </section>`;
  }

  function render(container) {
    if (container) root = container;
    if (!root) return;
    if (!pet) {
      renderAdoption();
      return;
    }
    if (!VIEW_IDS.includes(view)) view = 'home';
    const tabs = [
      ['home', text('home')],
      ['shop', text('shop')],
      ['game', text('game')],
      ['quests', text('quests')],
      ['achievements', text('achievements')],
      ['settings', text('settings')]
    ];
    const navigation = tabs.map(([id, label]) => `<button type="button" class="pet-view-tab ${view === id ? 'active' : ''}" data-pet-view="${id}">${escapeHtml(label)}</button>`).join('');
    const content = view === 'shop' ? renderShop()
      : view === 'game' ? renderGame()
      : view === 'quests' ? renderQuests()
      : view === 'achievements' ? renderAchievements()
      : view === 'settings' ? renderSettings()
      : renderHome();
    root.innerHTML = `<div class="pet-app-shell">${navigation}<div class="pet-view-content">${content}</div></div>`;
  }

  function attachEvents() {
    if (!root || boundRoot === root) return;
    boundRoot = root;
    root.addEventListener('click', (event) => {
      const target = event.target;
      const viewButton = target.closest('[data-pet-view]');
      if (viewButton) {
        view = viewButton.dataset.petView;
        render();
        return;
      }
      const speciesButton = target.closest('[data-pet-species]');
      if (speciesButton) {
        selectedSpecies = speciesButton.dataset.petSpecies;
        if (!selectedName || selectedName === SPECIES[selectedSpecies].name[0]) selectedName = '';
        render();
        return;
      }
      if (target.closest('[data-pet-adopt]')) {
        adoptPet();
        return;
      }
      const actionButton = target.closest('[data-pet-action]');
      if (actionButton) {
        performCare(actionButton.dataset.petAction);
        return;
      }
      const shopButton = target.closest('[data-pet-shop-action]');
      if (shopButton) {
        handleShop(shopButton.dataset.petShopAction, shopButton.dataset.petItem);
        return;
      }
      const claimButton = target.closest('[data-pet-claim]');
      if (claimButton) {
        claimDaily(claimButton.dataset.petClaim);
        return;
      }
      const gameStart = target.closest('[data-pet-game-start]');
      if (gameStart) {
        startGame(gameStart.dataset.petGameStart);
        return;
      }
      const pad = target.closest('[data-pet-pad]');
      if (pad) {
        playPad(Number(pad.dataset.petPad));
        return;
      }
      if (target.closest('[data-pet-speak]')) {
        speakPet();
        return;
      }
      if (target.closest('[data-pet-rename]')) {
        renameCurrentPet();
        return;
      }
      if (target.closest('[data-pet-export]')) {
        exportSave();
        return;
      }
      if (target.closest('[data-pet-import]')) {
        const input = root.querySelector('#pet-import-file');
        if (input) input.click();
        return;
      }
      if (target.closest('[data-pet-reset]')) {
        resetCurrentPet();
      }
    });
    root.addEventListener('input', (event) => {
      if (event.target && event.target.id === 'pet-name-input') selectedName = event.target.value;
    });
    root.addEventListener('change', (event) => {
      if (event.target && event.target.id === 'pet-import-file') importSaveFile(event.target);
    });
  }

  function attach() {
    attachEvents();
  }

  function adoptPet() {
    const timestamp = now();
    const fallback = SPECIES[selectedSpecies].name[LANG_INDEX[lang()]];
    pet = createPet(selectedName, selectedSpecies, timestamp);
    selectedName = '';
    view = 'home';
    persist().then(() => {
      render();
      notify(text('actionDone'));
    });
  }

  async function performCare(actionId) {
    if (!pet) return;
    const beforeQuests = getDailyQuests(pet, now());
    const result = performAction(pet, actionId, now());
    if (!result.ok) {
      const messages = {
        cooldown: text('cooldown', { time: formatDuration(result.remaining) }),
        coins: text('notEnoughCoins'),
        notSick: text('notSick'),
        alreadySleeping: text('alreadySleeping'),
        notSleeping: text('notSleeping')
      };
      notify(messages[result.error] || text('unknownAction'));
      return;
    }
    pet = result.pet;
    const afterQuests = getDailyQuests(pet, now());
    await persist();
    render();
    announceEvents(result.events);
    notify(text('actionDone'));
    for (const quest of afterQuests) {
      const before = beforeQuests.find((item) => item.id === quest.id);
      if (!before || before.complete || !quest.complete) continue;
      notify(text('questComplete', { name: quest.description[LANG_INDEX[lang()]] }));
    }
  }

  async function handleShop(action, itemId) {
    if (!pet) return;
    let result;
    if (action === 'buy') result = buyItem(pet, itemId, now());
    else if (action === 'use') result = useItem(pet, itemId, now());
    else if (action === 'equip') result = equipItem(pet, itemId);
    else return;
    if (!result.ok) {
      const messages = {
        coins: text('notEnoughCoins'),
        stage: text('stageLocked', { stage: STAGES[SHOP_ITEMS[itemId] && SHOP_ITEMS[itemId].unlockStage]?.name[LANG_INDEX[lang()]] || '' }),
        notOwned: text('notOwned'),
        notConsumable: text('unknownAction'),
        notWearable: text('unknownAction')
      };
      notify(messages[result.error] || text('unknownAction'));
      return;
    }
    pet = result.pet;
    await persist();
    render();
    notify(text(action === 'buy' ? 'bought' : action === 'use' ? 'used' : pet.equipped[itemId] ? 'equipped' : 'unequipped'));
    announceEvents(result.events);
  }

  async function claimDaily(questId) {
    if (!pet) return;
    const result = claimQuest(pet, questId, now());
    if (!result.ok) return;
    pet = result.pet;
    await persist();
    render();
    announceEvents(result.events);
  }

  function clearGameTimers() {
    for (const timer of gameTimers) clearTimeout(timer);
    gameTimers = [];
  }

  function flashPad(index) {
    const pad = root && root.querySelector(`[data-pet-pad="${index}"]`);
    if (!pad) return;
    pad.classList.add('active');
    const timer = setTimeout(() => pad.classList.remove('active'), 320);
    gameTimers.push(timer);
  }

  function startGame(difficulty) {
    if (!pet) return;
    if (getMinigameCooldown(pet, now()) > 0) {
      notify(text('gameTooSoon'));
      return;
    }
    clearGameTimers();
    const lengths = { easy: 3, normal: 4, hard: 6 };
    const length = lengths[difficulty] || lengths.normal;
    game = {
      sequence: createMemorySequence(length),
      input: [],
      phase: 'playing',
      difficulty
    };
    render();
    let delay = 320;
    for (const index of game.sequence) {
      const timer = setTimeout(() => flashPad(index), delay);
      gameTimers.push(timer);
      delay += 620;
    }
    const finish = setTimeout(() => {
      if (!game || game.phase !== 'playing') return;
      game.phase = 'input';
      render();
    }, delay);
    gameTimers.push(finish);
  }

  async function playPad(index) {
    if (!game || game.phase !== 'input') return;
    game.input.push(index);
    flashPad(index);
    if (!isMemoryInputCorrect(game.sequence, game.input)) {
      game.phase = 'failed';
      render();
      return;
    }
    if (game.input.length === game.sequence.length) {
      const result = completeMinigame(pet, { perfect: true, now: now() });
      if (!result.ok) {
        game.phase = 'failed';
        render();
        notify(text('gameTooSoon'));
        return;
      }
      pet = result.pet;
      game.phase = 'success';
      await persist();
      render();
      notify(text('gameRewardToast'));
      announceEvents(result.events);
      speak(text('gameRewardToast'));
    } else {
      render();
    }
  }

  function speakPet() {
    if (!pet) return;
    const mood = getMood(pet);
    const lines = SPEECH[mood] || SPEECH.okay;
    const message = lines[LANG_INDEX[lang()]];
    speak(message);
  }

  function renameCurrentPet() {
    if (!pet) return;
    const input = root && root.querySelector('#pet-rename-input');
    if (!input) return;
    pet = renamePet(pet, input.value);
    persist().then(() => {
      render();
      notify(text('renamed'));
    });
  }

  function exportSave() {
    if (!pet) return;
    try {
      const payload = JSON.stringify({ schemaVersion: PET_SCHEMA_VERSION, pet }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${pet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pet'}-tami.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify(text('exportDone'));
    } catch (error) {
      notify(text('importError'));
    }
  }

  async function importSaveFile(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > 200000) {
      notify(text('importError'));
      return;
    }
    try {
      const content = await file.text();
      const normalized = normalizeSave(JSON.parse(content), now());
      if (!normalized.pet) throw new Error('empty-pet');
      pet = normalized.pet;
      const elapsed = now() - pet.lastTickAt;
      const result = applyElapsed(pet, elapsed, now());
      pet = result.pet;
      await persist();
      render();
      announceEvents(result.events);
      notify(text('saved'));
    } catch (error) {
      notify(text('importError'));
    }
  }

  async function resetCurrentPet() {
    if (!resetArmed) {
      resetArmed = true;
      render();
      return;
    }
    resetArmed = false;
    pet = null;
    game = null;
    view = 'home';
    clearGameTimers();
    await persist();
    render();
    notify(text('resetDone'));
  }

  async function tick() {
    if (!pet) return;
    const timestamp = now();
    const result = applyElapsed(pet, timestamp - pet.lastTickAt, timestamp);
    pet = result.pet;
    await persist();
    render();
    announceEvents(result.events);
  }

  async function init(container) {
    if (container) root = container;
    try {
      const raw = await load();
      const normalized = normalizeSave(raw, now());
      pet = normalized.pet;
      if (pet) {
        const result = applyElapsed(pet, now() - pet.lastTickAt, now());
        pet = result.pet;
        await persist();
        announceEvents(result.events);
      }
    } catch (error) {
      pet = null;
      notify(text('importError'));
    }
    render();
    attach();
    if (interval) clearInterval(interval);
    interval = setInterval(() => tick().catch(() => {}), 60000);
    return pet;
  }

  function destroy() {
    if (interval) clearInterval(interval);
    interval = 0;
    clearGameTimers();
  }

  function getState() {
    return pet ? clonePet(pet) : null;
  }

  return {
    init,
    render,
    tick,
    destroy,
    getState,
    adopt: adoptPet,
    act: performCare,
    claim: claimDaily,
    buy: handleShop,
    startGame,
    exportSave,
    importSaveFile
  };
}

function clonePet(value) {
  return JSON.parse(JSON.stringify(value));
}
