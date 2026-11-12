const DATA_KEY = "restoran-showcase:data:v1";
const AUTH_KEY = "restoran-showcase:auth";
const DATA_EVENT = "restoran-showcase:data-change";
const RESERVATION_EVENT = "restoran-showcase:reservations-change";

let seedPromise = null;
let seedCache = null;

function hasWindow() {
  return typeof window !== "undefined";
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrice(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return 0;
  return Number(parsed.toFixed(2));
}

function ensureTranslations(source, languages) {
  const translations = {};
  for (const lang of languages) {
    const langKey = lang.name || lang;
    const fallback = source?.translations?.[langKey] || source?.translations?.hr || {};
    translations[langKey] = {
      name: normalizeText(fallback.name),
      description: normalizeText(fallback.description),
    };
  }
  return translations;
}

function ensureStateShape(seed) {
  const languages = Array.isArray(seed.languages) ? seed.languages : [];
  const categories = Array.isArray(seed.categories)
    ? seed.categories.map((category) => ({
        id: category.id,
        translations: ensureTranslations(category, languages),
        subcategories: Array.isArray(category.subcategories)
          ? category.subcategories.map((subcategory) => ({
              id: subcategory.id,
              category_id: subcategory.category_id ?? category.id,
              translations: ensureTranslations(subcategory, languages),
            }))
          : [],
      }))
    : [];

  const allergens = Array.isArray(seed.allergens)
    ? seed.allergens.map((allergen) => ({
        id: allergen.id,
        icon: allergen.icon || "",
        translations: ensureTranslations(allergen, languages),
      }))
    : [];

  const menu = Array.isArray(seed.menu)
    ? seed.menu.map((item) => ({
        id: item.id,
        order_no: Number(item.order_no) || 0,
        category_id: item.category_id ?? item.category,
        sub_category_id: item.sub_category_id ?? item.sub_category,
        amount: normalizeText(item.amount),
        price: normalizePrice(item.price),
        active: Boolean(item.active),
        daily_menu: Boolean(item.daily_menu),
        allergens: Array.isArray(item.allergens)
          ? item.allergens.map((value) => Number(value)).filter((value) => !Number.isNaN(value))
          : [],
        translations: ensureTranslations(item, languages),
      }))
    : [];

  const reservations = Array.isArray(seed.reservations) ? seed.reservations : [];
  const nextMenuId = seed.nextIds?.menu ?? (menu.reduce((max, item) => Math.max(max, item.id), 0) + 1);
  const nextReservationId =
    seed.nextIds?.reservation ?? (reservations.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1);

  return {
    version: seed.version ?? 1,
    languages,
    categories,
    allergens,
    menu,
    dailyMenuPrice: normalizePrice(seed.dailyMenuPrice ?? 0),
    reservations: reservations.map((reservation, index) => ({
      id: reservation.id ?? index + 1,
      ...reservation,
    })),
    nextIds: {
      menu: nextMenuId,
      reservation: nextReservationId,
    },
  };
}

function clearSeedCache() {
  seedCache = null;
  seedPromise = null;
}

function mergeMenuTranslations(localTranslations, seedTranslations, languages) {
  const merged = { ...(localTranslations || {}) };
  for (const lang of languages) {
    const langKey = lang.name || lang;
    const local = merged[langKey] || {};
    const seed = seedTranslations?.[langKey] || seedTranslations?.hr || {};
    merged[langKey] = {
      name: normalizeText(local.name) || normalizeText(seed.name),
      description: normalizeText(local.description) || normalizeText(seed.description),
    };
  }
  return merged;
}

function mergeMenuFromSeed(localMenu, seedMenu, languages) {
  const seedById = new Map(seedMenu.map((item) => [item.id, item]));
  return localMenu.map((item) => {
    const seedItem = seedById.get(item.id);
    if (!seedItem) return item;
    return {
      ...item,
      translations: mergeMenuTranslations(item.translations, seedItem.translations, languages),
    };
  });
}

async function loadSeed({ force = false } = {}) {
  if (force) clearSeedCache();
  if (seedCache) return seedCache;

  if (!seedPromise) {
    seedPromise = fetch("/demo-seed.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ne mogu učitati demo seed.");
        }
        return response.json();
      })
      .then((seed) => {
        seedCache = ensureStateShape(seed);
        return seedCache;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  return seedPromise;
}

async function readState() {
  const seed = await loadSeed();

  if (!hasWindow()) {
    return clone(seed);
  }

  const raw = window.localStorage.getItem(DATA_KEY);
  if (!raw) {
    const fresh = clone(seed);
    window.localStorage.setItem(DATA_KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    const languages = parsed.languages || seed.languages;
    const menu = parsed.menu
      ? mergeMenuFromSeed(parsed.menu, seed.menu, languages)
      : seed.menu;
    const normalized = ensureStateShape({
      ...seed,
      ...parsed,
      languages,
      categories: parsed.categories || seed.categories,
      allergens: parsed.allergens || seed.allergens,
      menu,
      reservations: parsed.reservations || seed.reservations,
      dailyMenuPrice: parsed.dailyMenuPrice ?? seed.dailyMenuPrice,
      nextIds: parsed.nextIds || seed.nextIds,
    });
    const serialized = JSON.stringify(normalized);
    if (serialized !== raw) {
      window.localStorage.setItem(DATA_KEY, serialized);
    }
    return clone(normalized);
  } catch {
    const fresh = clone(seed);
    window.localStorage.setItem(DATA_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function writeState(state) {
  if (!hasWindow()) return;
  const serialized = JSON.stringify(state);
  window.localStorage.setItem(DATA_KEY, serialized);
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: state }));
}

function emitReservationChange() {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(RESERVATION_EVENT));
}

function createMenuItemDraft(state, payload) {
  const languages = state.languages;
  const hrText = {
    name: normalizeText(payload.name),
    description: normalizeText(payload.description),
  };
  const translations = {};

  for (const lang of languages) {
    const langKey = lang.name;
    translations[langKey] = {
      name: hrText.name,
      description: hrText.description,
    };
  }

  return {
    id: state.nextIds.menu,
    order_no: payload.order_no,
    category_id: payload.category_id,
    sub_category_id: payload.sub_category_id,
    amount: normalizeText(payload.amount),
    price: normalizePrice(payload.price),
    active: payload.active ?? true,
    daily_menu: payload.daily_menu ?? false,
    allergens: Array.isArray(payload.allergens) ? payload.allergens.slice() : [],
    translations,
  };
}

function getLocalizedText(translations, lang) {
  const fallback = translations?.hr || {};
  const current = translations?.[lang] || fallback;
  return {
    name: normalizeText(current.name || fallback.name),
    description: normalizeText(current.description || fallback.description),
  };
}

function sortMenu(items) {
  return [...items].sort((a, b) => {
    if (a.sub_category_id !== b.sub_category_id) {
      return a.sub_category_id - b.sub_category_id;
    }
    return a.order_no - b.order_no;
  });
}

function formatAllergen(allergen, lang) {
  const text = getLocalizedText(allergen.translations, lang);
  return {
    id: allergen.id,
    icon: allergen.icon,
    name: text.name,
    description: text.description,
  };
}

function formatMenuItem(item, state, lang) {
  const text = getLocalizedText(item.translations, lang);
  return {
    id: item.id,
    order_no: item.order_no,
    category_id: item.category_id,
    sub_category_id: item.sub_category_id,
    name: text.name,
    description: text.description,
    amount: item.amount,
    price: item.price,
    active: Boolean(item.active),
    daily_menu: Boolean(item.daily_menu),
    allergens: item.allergens
      .map((allergenId) => {
        const allergen = state.allergens.find((entry) => entry.id === allergenId);
        return allergen ? formatAllergen(allergen, lang) : null;
      })
      .filter(Boolean),
  };
}

async function updateState(mutator) {
  const state = await readState();
  const nextState = await mutator(clone(state));
  const normalized = ensureStateShape(nextState);
  writeState(normalized);
  return clone(normalized);
}

export async function getDemoState() {
  return readState();
}

export async function getMenuItems(lang = "hr") {
  const state = await readState();
  return sortMenu(state.menu).map((item) => formatMenuItem(item, state, lang));
}

export async function getCategoriesForLang(lang = "hr") {
  const state = await readState();
  return state.categories.map((category) => {
    const text = getLocalizedText(category.translations, lang);
    return {
      id: category.id,
      name: text.name,
      subcategories: category.subcategories.map((subcategory) => {
        const subText = getLocalizedText(subcategory.translations, lang);
        return {
          id: subcategory.id,
          name: subText.name,
        };
      }),
    };
  });
}

export async function getAllergensForLang(lang = "hr") {
  const state = await readState();
  return state.allergens.map((allergen) => {
    const text = getLocalizedText(allergen.translations, lang);
    return {
      id: allergen.id,
      icon: `/images/alergeni/${allergen.icon}`,
      name: text.name,
      description: text.description,
    };
  });
}

export async function addMenuEntry(payload) {
  return updateState(async (state) => {
    const sameGroup = state.menu.filter(
      (item) => item.category_id === payload.category_id && item.sub_category_id === payload.sub_category_id
    );
    const nextOrderNo = sameGroup.reduce((max, item) => Math.max(max, item.order_no), 0) + 1;
    const draft = createMenuItemDraft(state, {
      ...payload,
      order_no: nextOrderNo,
    });
    state.menu.push(draft);
    state.nextIds.menu += 1;
    return state;
  });
}

export async function updateMenuEntry(payload) {
  return updateState(async (state) => {
    const item = state.menu.find((entry) => entry.id === payload.id);
    if (!item) return state;

    const previousCategory = item.category_id;
    const previousSubCategory = item.sub_category_id;

    item.category_id = payload.category_id;
    item.sub_category_id = payload.sub_category_id;
    item.amount = normalizeText(payload.amount);
    item.price = normalizePrice(payload.price);
    item.allergens = Array.isArray(payload.allergens) ? payload.allergens.slice() : [];

    const lang = payload.lang || "hr";
    item.translations[lang] = {
      name: normalizeText(payload.name),
      description: normalizeText(payload.description),
    };

    if (lang === "hr") {
      for (const language of state.languages) {
        const langKey = language.name;
        item.translations[langKey] = {
          name: normalizeText(payload.name),
          description: normalizeText(payload.description),
        };
      }
    }

    if (previousCategory !== payload.category_id || previousSubCategory !== payload.sub_category_id) {
      const sameGroup = state.menu.filter(
        (entry) =>
          entry.id !== item.id &&
          entry.category_id === payload.category_id &&
          entry.sub_category_id === payload.sub_category_id
      );
      item.order_no = sameGroup.reduce((max, entry) => Math.max(max, entry.order_no), 0) + 1;
    }

    return state;
  });
}

export async function updateMenuItemStatus(id, active) {
  return updateState(async (state) => {
    const item = state.menu.find((entry) => entry.id === id);
    if (item) item.active = Boolean(active);
    return state;
  });
}

export async function updateDailyMenuStatus(id, dailyMenu) {
  return updateState(async (state) => {
    const item = state.menu.find((entry) => entry.id === id);
    if (item) item.daily_menu = Boolean(dailyMenu);
    return state;
  });
}

export async function updateDailyMenuPrice(price) {
  return updateState(async (state) => {
    state.dailyMenuPrice = normalizePrice(price);
    return state;
  });
}

export async function deleteMenuEntry(id) {
  return updateState(async (state) => {
    state.menu = state.menu.filter((item) => item.id !== id);
    return state;
  });
}

export async function reorderMenuEntries(items) {
  return updateState(async (state) => {
    const orderMap = new Map(items.map((item) => [item.id, item.order_no]));
    state.menu = state.menu.map((item) => {
      if (!orderMap.has(item.id)) return item;
      return {
        ...item,
        order_no: orderMap.get(item.id),
      };
    });
    return state;
  });
}

export async function getDailyMenuState(lang = "hr") {
  const state = await readState();
  return {
    items: sortMenu(state.menu)
      .filter((item) => item.daily_menu)
      .map((item) => formatMenuItem(item, state, lang)),
    price: state.dailyMenuPrice,
  };
}

export async function resetDemoData() {
  const seed = await loadSeed({ force: true });
  const fresh = clone(seed);
  writeState(fresh);
  return clone(fresh);
}

export function subscribeToDemoData(listener) {
  if (!hasWindow()) {
    return () => {};
  }

  const handleDataEvent = () => listener();
  const handleStorageEvent = (event) => {
    if (event.key === DATA_KEY) {
      listener();
    }
  };

  window.addEventListener(DATA_EVENT, handleDataEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(DATA_EVENT, handleDataEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

export async function getReservations() {
  const state = await readState();
  return clone(state.reservations);
}

export async function addReservation(reservation) {
  return updateState(async (state) => {
    state.reservations = [
      ...state.reservations,
      {
        id: state.nextIds.reservation,
        createdAt: new Date().toISOString(),
        ...reservation,
      },
    ];
    state.nextIds.reservation += 1;
    return state;
  }).then(() => {
    emitReservationChange();
  });
}

export function subscribeToReservations(listener) {
  if (!hasWindow()) {
    return () => {};
  }

  const handleReservationEvent = () => listener();
  const handleStorageEvent = (event) => {
    if (event.key === DATA_KEY) {
      listener();
    }
  };

  window.addEventListener(RESERVATION_EVENT, handleReservationEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(RESERVATION_EVENT, handleReservationEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

export { DATA_KEY as DEMO_DATA_KEY, AUTH_KEY as DEMO_AUTH_KEY };
