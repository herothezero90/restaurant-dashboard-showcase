import {
  addMenuEntry,
  deleteMenuEntry,
  getAllergensForLang,
  getCategoriesForLang,
  getDailyMenuState,
  getMenuItems,
  reorderMenuEntries,
  updateDailyMenuPrice as updateDailyMenuPriceStore,
  updateDailyMenuStatus as updateDailyMenuStatusStore,
  updateMenuEntry,
  updateMenuItemStatus as updateMenuItemStatusStore,
} from "./demoStore";

export async function getMenu(lang = "hr") {
  return getMenuItems(lang);
}

export async function getActiveMenu(lang = "hr") {
  const menu = await getMenuItems(lang);
  return menu.filter((item) => item.active);
}

export async function getDailyMenu(lang = "hr") {
  return getDailyMenuState(lang);
}

export async function getCategories(lang = "hr") {
  return getCategoriesForLang(lang);
}

export async function getAllergens(lang = "hr") {
  return getAllergensForLang(lang);
}

export async function updateMenuItemStatus(id, active) {
  return updateMenuItemStatusStore(id, active);
}

export async function updateDailyMenuStatus(id, daily_menu) {
  return updateDailyMenuStatusStore(id, daily_menu);
}

export async function updateDailyMenuPrice(price) {
  return updateDailyMenuPriceStore(price);
}

export async function updateMenuItem(id, name, description, category, sub_category, amount, price, lang, allergens) {
  return updateMenuEntry({
    id,
    name,
    description,
    category_id: category,
    sub_category_id: sub_category,
    amount,
    price,
    lang,
    allergens,
  });
}

export async function addMenuItem(category, sub_category, name, description, price, amount, allergens) {
  return addMenuEntry({
    category_id: category,
    sub_category_id: sub_category,
    name,
    description,
    price,
    amount,
    allergens,
  });
}

export async function deleteMenuItem(id) {
  return deleteMenuEntry(id);
}

export async function reorder(items) {
  return reorderMenuEntries(items);
}
