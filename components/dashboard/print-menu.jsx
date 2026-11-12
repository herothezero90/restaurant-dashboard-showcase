"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChefHat, Download, Globe2, LayoutList, ListChecks, LoaderCircle, X } from "lucide-react";
import { getActiveMenu, getCategories, getDailyMenu } from "../../utils/menuUtils";
import { openSans } from "../../app/(dashboard)/fonts";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "./lib/utils";

const LANGUAGES = [
  { value: "hr", label: "HR", flag: "croatia_flag.png" },
  { value: "en", label: "EN", flag: "english_flag.png" },
  { value: "it", label: "IT", flag: "italy_flag.png" },
  { value: "de", label: "DE", flag: "german_flag.png" },
  { value: "ru", label: "RU", flag: "russia_flag.png" },
];

const MODES = [
  { value: "full", label: "Cijeli menu", icon: LayoutList },
  { value: "daily", label: "Dnevni menu", icon: ChefHat },
  { value: "custom", label: "Odabir kategorija", icon: ListChecks },
];

const DAILY_TITLE = {
  hr: "Dnevni menu",
  en: "Daily Menu",
  it: "Menu del giorno",
  de: "Tagesmenü",
  ru: "Дневное меню",
};

const PDF_OPTIONS = {
  margin: 0.5,
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  pagebreak: { mode: ["css"] },
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function Chip({ children, tone = "muted" }) {
  return (
    <span
      className={cn(
        "admin:mx-0.5 admin:inline-flex admin:h-6 admin:items-center admin:gap-1 admin:rounded-md admin:px-2 admin:align-middle admin:text-xs admin:font-medium admin:leading-none",
        tone === "primary" && "admin:bg-primary admin:text-primary-foreground",
        tone === "muted" && "admin:border admin:border-border admin:bg-background admin:text-foreground"
      )}
    >
      {children}
    </span>
  );
}

function Hint({ mode }) {
  return (
    <p className="admin:m-0 admin:text-sm admin:leading-7 admin:text-muted-foreground">
      {mode === "custom" ? (
        <>
          Odaberi kategorije za print. Isprekidane crte u pregledu označavaju gdje počinje nova stranica. Zatim odaberi jezik ili
          <Chip><Globe2 size={12} /> Svi jezici</Chip>
          i klikni
          <Chip tone="primary"><Download size={12} /> Preuzmi PDF</Chip>
        </>
      ) : (
        <>
          Odaberi jezik ili
          <Chip><Globe2 size={12} /> Svi jezici</Chip>
          i klikni
          <Chip tone="primary"><Download size={12} /> Preuzmi PDF</Chip>
        </>
      )}
    </p>
  );
}

function PrintItem({ item, price }) {
  return (
    <div className="print-item">
      <div className="print-item__row">
        <strong>{item.name}</strong>
        <span className="print-item__meta">
          {item.allergens?.map((allergen) =>
            allergen.icon ? (
              <Image key={allergen.id} src={`/images/alergeni/${allergen.icon}`} alt={allergen.name || ""} width={16} height={16} />
            ) : null
          )}
          {item.amount && <span>{item.amount}</span>}
        </span>
        <span className="print-item__price">{price}</span>
      </div>
      {item.description && item.description !== "-" && <p>{item.description}</p>}
    </div>
  );
}

export default function PrintMenu() {
  const [language, setLanguage] = useState("hr");
  const [dataLanguage, setDataLanguage] = useState("hr");
  const [mode, setMode] = useState("full");
  const [selected, setSelected] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [daily, setDaily] = useState({ items: [], price: 0 });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const printableRef = useRef(null);

  const loadData = useCallback(async (lang) => {
    const [menuData, categoryData, dailyData] = await Promise.all([
      getActiveMenu(lang),
      getCategories(lang),
      getDailyMenu(lang),
    ]);
    setMenu(menuData);
    setCategories(categoryData);
    setDaily({ items: dailyData.items || [], price: dailyData.price || 0 });
    setDataLanguage(lang);
  }, []);

  useEffect(() => {
    loadData(language === "all" ? "hr" : language).catch((loadError) => setError(loadError.message));
  }, [language, loadData]);

  const subcategories = useMemo(
    () => categories.flatMap((category) => category.subcategories),
    [categories]
  );

  const sections = useMemo(() => {
    const ids = mode === "custom" ? selected : subcategories.map((subcategory) => subcategory.id);
    return ids
      .map((id) => ({
        subcategory: subcategories.find((entry) => entry.id === id),
        items: menu.filter((item) => item.sub_category_id === id),
      }))
      .filter((section) => section.subcategory && section.items.length > 0);
  }, [menu, mode, selected, subcategories]);

  const changeMode = (value) => {
    setMode(value);
    setSelected([]);
  };

  const toggleSubcategory = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const fileName = (lang) => {
    if (mode === "daily") return `dnevni-menu-${lang}.pdf`;
    if (mode === "custom") {
      const names = subcategories.filter((entry) => selected.includes(entry.id)).map((entry) => slug(entry.name));
      return `menu-${lang}-${names.join("-")}.pdf`;
    }
    return `cijeli-menu-${lang}.pdf`;
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const imported = await import("html2pdf.js");
      const html2pdf = imported.default || imported;
      const languages = language === "all" ? LANGUAGES.map((entry) => entry.value) : [language];

      for (const lang of languages) {
        if (lang !== dataLanguage || languages.length > 1) {
          await loadData(lang);
          await wait(600);
        }
        await html2pdf().set({ ...PDF_OPTIONS, filename: fileName(lang) }).from(printableRef.current).save();
      }

      if (language === "all") await loadData("hr");
    } catch (exportError) {
      setError(exportError.message || "PDF nije moguće izraditi.");
    } finally {
      setExporting(false);
    }
  };

  const canExport = mode !== "custom" || selected.length > 0;
  const sheetLanguage = dataLanguage;

  return (
    <main className="admin:min-h-screen admin:bg-background admin:text-foreground">
      {error && (
        <div className="admin:fixed admin:left-1/2 admin:top-4 admin:z-[1200] admin:flex admin:w-[calc(100%-2rem)] admin:max-w-xl admin:-translate-x-1/2 admin:items-center admin:justify-between admin:gap-3 admin:rounded-md admin:bg-destructive admin:px-4 admin:py-3 admin:text-sm admin:text-destructive-foreground admin:shadow-lg">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Zatvori">
            <X size={18} />
          </button>
        </div>
      )}

      <header className="admin:border-b admin:border-border admin:bg-card admin:text-center">
        <div className="admin:w-full admin:px-6 admin:py-5">
          <h1 className="admin:m-0 admin:text-3xl admin:font-semibold admin:tracking-tight admin:text-foreground admin:md:text-5xl">Print jelovnika</h1>
        </div>
      </header>

      <div className="admin:mx-auto admin:grid admin:w-full admin:max-w-5xl admin:gap-6 admin:px-3 admin:py-6 admin:md:px-6">
        <Card>
          <CardContent className="admin:grid admin:gap-5 admin:pt-5">
            <div className="admin:flex admin:flex-wrap admin:items-center admin:justify-between admin:gap-3">
              <div className="admin:flex admin:flex-wrap admin:gap-2">
                {MODES.map(({ value, label, icon: Icon }) => (
                  <Button key={value} variant={mode === value ? "default" : "outline"} onClick={() => changeMode(value)}>
                    <Icon size={16} /> {label}
                  </Button>
                ))}
              </div>
              <Button onClick={exportPdf} disabled={!canExport || exporting}>
                {exporting ? <LoaderCircle size={16} className="admin:animate-spin" /> : <Download size={16} />}
                {exporting ? "Izrada PDF-a..." : "Preuzmi PDF"}
              </Button>
            </div>

            <div className="admin:flex admin:flex-wrap admin:items-center admin:gap-2">
              {LANGUAGES.map((entry) => (
                <Button
                  key={entry.value}
                  size="sm"
                  variant={language === entry.value ? "default" : "outline"}
                  onClick={() => setLanguage(entry.value)}
                  disabled={exporting}
                >
                  <Image src={`/images/${entry.flag}`} alt="" width={20} height={14} className="admin:h-3.5 admin:w-5 admin:rounded-[2px] admin:object-cover" />
                  {entry.label}
                </Button>
              ))}
              <span className="admin:mx-1 admin:h-6 admin:w-px admin:bg-border" aria-hidden="true" />
              <Button size="sm" variant={language === "all" ? "default" : "outline"} onClick={() => setLanguage("all")} disabled={exporting}>
                <Globe2 size={15} /> Svi jezici
              </Button>
            </div>

            <div className="admin:rounded-md admin:bg-muted admin:px-4 admin:py-3">
              <Hint mode={mode} />
            </div>

            {mode === "custom" && (
              <div className="admin:flex admin:flex-wrap admin:gap-2">
                {subcategories.map((subcategory) => (
                  <Button
                    key={subcategory.id}
                    size="sm"
                    variant={selected.includes(subcategory.id) ? "default" : "outline"}
                    onClick={() => toggleSubcategory(subcategory.id)}
                  >
                    {subcategory.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="admin:overflow-hidden admin:bg-muted">
          <div className="admin:overflow-x-auto admin:p-3 admin:md:p-8">
            <div className="print-preview">
              {mode === "custom" && <div className="print-preview__breaks" aria-hidden="true" />}
              <div ref={printableRef} className={cn("print-sheet", openSans.className)}>
                {mode === "daily" ? (
                  <section>
                    <h2 className="print-sheet__title">
                      {DAILY_TITLE[sheetLanguage] || DAILY_TITLE.hr}
                      <span>{daily.price} €</span>
                    </h2>
                    {daily.items.length === 0 ? (
                      <p className="print-sheet__empty">Nema stavki u dnevnom meniju.</p>
                    ) : (
                      daily.items.map((item) => <PrintItem key={item.id} item={item} />)
                    )}
                  </section>
                ) : sections.length === 0 ? (
                  <p className="print-sheet__empty">
                    {mode === "custom" ? "Odaberi barem jednu kategoriju za pregled." : "Nema aktivnih stavki."}
                  </p>
                ) : (
                  sections.map(({ subcategory, items }, index) => (
                    <section key={subcategory.id} className={mode === "full" && index > 0 ? "page-break" : undefined}>
                      <h2 className="print-sheet__title">{subcategory.name}</h2>
                      {items.map((item) => (
                        <PrintItem key={item.id} item={item} price={`${item.price} €`} />
                      ))}
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
