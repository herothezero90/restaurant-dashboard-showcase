'use client'

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getActiveMenu, getCategories, getDailyMenu } from "../../utils/menuUtils";
import ErrorNotifier from "./_components/ErrorNotifier";

const copy = {
  hr: { title: "Jelovnik", food: "Jela", drinks: "Pića", daily: "Dnevni menu", currency: "€" },
  en: { title: "Menu", food: "Food", drinks: "Drinks", daily: "Daily menu", currency: "€" },
  it: { title: "Menù", food: "Piatti", drinks: "Bevande", daily: "Menu del giorno", currency: "€" },
  de: { title: "Speisekarte", food: "Speisen", drinks: "Getränke", daily: "Tagesmenü", currency: "€" },
  ru: { title: "Меню", food: "Блюда", drinks: "Напитки", daily: "Дневное меню", currency: "€" },
};

const flags = [
  { image: "croatia_flag.png", alt: "Hrvatski", value: "hr" },
  { image: "english_flag.png", alt: "English", value: "en" },
  { image: "italy_flag.png", alt: "Italiano", value: "it" },
  { image: "german_flag.png", alt: "Deutsch", value: "de" },
  { image: "russia_flag.png", alt: "Русский", value: "ru" },
];

function AllergenList({ allergens }) {
  if (!allergens?.length) return null;

  return (
    <span className="allergen-list" aria-label="Alergeni">
      {allergens.map((allergen) => (
        allergen.icon ? (
          <span className="allergen-icon" title={allergen.name} key={allergen.id}>
            <Image
              src={`/images/alergeni/${allergen.icon}`}
              alt={allergen.name || "Alergen"}
              width={14}
              height={14}
            />
          </span>
        ) : null
      ))}
    </span>
  );
}

function MenuItem({ item, showPrice = true, currency = "€" }) {
  return (
    <article className="menu-item">
      <div className="menu-item__heading">
        <h3>{item.name}</h3>
        {showPrice && <span>{item.price} {currency}</span>}
      </div>
      {(item.description && item.description !== "-") || item.allergens?.length ? (
        <div className="menu-item__details">
          {item.description && item.description !== "-" && <p>{item.description}</p>}
          <AllergenList allergens={item.allergens} />
        </div>
      ) : null}
    </article>
  );
}

export default function UserMenu() {
  const [menu, setMenu] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState("hr");
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [dailyMenu, setDailyMenu] = useState([]);
  const [dailyMenuPrice, setDailyMenuPrice] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [menuData, categoryData, dailyData] = await Promise.all([
          getActiveMenu(currentLanguage),
          getCategories(currentLanguage),
          getDailyMenu(currentLanguage),
        ]);

        setMenu(menuData);
        setCategories(categoryData);
        setDailyMenu(dailyData.items || []);
        setDailyMenuPrice(dailyData.price || 0);
        setActiveCategory((current) => {
          if (categoryData.some((category) => category.id === current)) return current;
          return categoryData[0]?.id ?? null;
        });
      } catch (fetchError) {
        setError(fetchError.message);
      }
    }

    fetchData();
  }, [currentLanguage]);

  const activeCategoryData = categories.find((category) => category.id === activeCategory);
  const activeCategoryIndex = categories.findIndex((category) => category.id === activeCategory);
  const languageCopy = copy[currentLanguage] || copy.hr;

  const sections = useMemo(() => {
    if (!activeCategoryData) return [];

    return activeCategoryData.subcategories
      .map((subcategory) => ({
        ...subcategory,
        items: menu.filter(
          (item) => item.category_id === activeCategory && item.sub_category_id === subcategory.id
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeCategory, activeCategoryData, menu]);

  return (
    <main className="menu-page">
      <div className="menu-paper">
        <div className="menu-paper__content">
          <header className="menu-header">
            <div className="language-picker" aria-label="Odabir jezika">
              {flags.map((flag) => (
                <button
                  className={currentLanguage === flag.value ? "is-active" : ""}
                  onClick={() => setCurrentLanguage(flag.value)}
                  type="button"
                  aria-label={flag.alt}
                  aria-pressed={currentLanguage === flag.value}
                  key={flag.value}
                >
                  <Image src={`/images/${flag.image}`} alt="" width={28} height={19} />
                </button>
              ))}
            </div>

            <p className="menu-eyebrow">Konoba</p>
            <h1>Bare</h1>
            <div className="menu-title-row">
              <span aria-hidden="true" />
              <p>{languageCopy.title}</p>
              <span aria-hidden="true" />
            </div>

            <nav className="menu-switcher" aria-label="Vrsta jelovnika">
              {categories.map((category, index) => (
                <button
                  className={activeCategory === category.id ? "is-active" : ""}
                  onClick={() => setActiveCategory(category.id)}
                  type="button"
                  aria-pressed={activeCategory === category.id}
                  key={category.id}
                >
                  {index === 0 ? languageCopy.food : index === 1 ? languageCopy.drinks : category.name}
                </button>
              ))}
            </nav>
          </header>

          {activeCategoryIndex === 0 && dailyMenu.length > 0 && (
            <section className="daily-section">
              <div className="section-heading section-heading--daily">
                <span aria-hidden="true">✦</span>
                <h2>{languageCopy.daily}</h2>
                <strong>{dailyMenuPrice} {languageCopy.currency}</strong>
              </div>
              <div className="menu-items-grid">
                {dailyMenu.map((item) => (
                  <MenuItem key={item.id} item={item} showPrice={false} currency={languageCopy.currency} />
                ))}
              </div>
            </section>
          )}

          <div className="menu-sections">
            {sections.map((section) => (
              <section className="menu-section" key={section.id}>
                <div className="section-heading">
                  <span aria-hidden="true" />
                  <h2>{section.name}</h2>
                  <span aria-hidden="true" />
                </div>
                <div className="menu-items-grid">
                  {section.items.map((item) => (
                    <MenuItem key={item.id} item={item} currency={languageCopy.currency} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="menu-footer">
            <span aria-hidden="true">✦</span>
            <p>Konoba Bare</p>
            <span aria-hidden="true">✦</span>
          </footer>
        </div>
      </div>
      <ErrorNotifier error={error} setError={setError} />
    </main>
  );
}
