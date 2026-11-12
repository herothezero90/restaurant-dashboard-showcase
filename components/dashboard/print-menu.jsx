"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChefHat, Download, Globe2, LayoutList, ListChecks, LoaderCircle, X } from "lucide-react";
import { getActiveMenu, getCategories, getDailyMenu } from "../../utils/menuUtils";
import { Box, Container, HStack, Text, VStack } from "@chakra-ui/react";
import { geist, geistMono } from "../../app/(dashboard)/fonts";
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
    .replace(/[\u0300-\u036f]/g, "")
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

  const renderItems = () => {
    if (mode === "daily") {
      return (
        <>
          <Text fontSize="30px" fontWeight="bold" mb={6} textAlign="left">
            {DAILY_TITLE[dataLanguage] || DAILY_TITLE.hr}
          </Text>
          <VStack spacing={6} align="stretch" color="#444654">
            {daily.items.map((item, index) => (
              <Box key={item.id} minH="50px">
                <Box display="grid" gridTemplateColumns="1fr 100px 140px" gap={4} alignItems="center" mb={2}>
                  <Text fontWeight="bold" fontSize="16px" m={0} p={0}>
                    {item.name}
                  </Text>
                  <HStack justify="flex-end" spacing={1} wrap="wrap">
                    {item.allergens?.map((allergen) =>
                      allergen.icon ? (
                        <Box key={allergen.id} p="1px">
                          <Image src={`/images/alergeni/${allergen.icon}`} alt={allergen.name || "Alergen"} width={16} height={16} />
                        </Box>
                      ) : null
                    )}
                    {item.amount && (
                      <Text fontSize="16px" m={0} p={0}>
                        {item.amount}
                      </Text>
                    )}
                  </HStack>
                  <Text fontWeight="bold" fontSize="20px" textAlign="right" m={0} p={0} pr={2} whiteSpace="nowrap" overflow="visible">
                    {index === daily.items.length - 1 ? `${daily.price} €` : ""}
                  </Text>
                </Box>
                {item.description && item.description !== "-" && (
                  <Text fontSize="16px" mt={1}>
                    {item.description}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        </>
      );
    }

    if (mode === "custom" && selected.length === 0) return null;

    const ids = mode === "custom" ? selected : subcategories.map((subcategory) => subcategory.id);

    return ids.map((subId, index) => {
      const subcategory = subcategories.find((entry) => entry.id === subId);
      const items = menu.filter((item) => item.sub_category_id === subId);

      if (!subcategory || items.length === 0) return null;

      return (
        <Box key={subId} mb={6} className={mode === "full" && index !== 0 ? "page-break" : undefined}>
          <Text fontSize="30px" fontWeight="bold" mb={10} mt={2} textAlign="left">
            {subcategory.name}
          </Text>
          <VStack spacing={4} align="stretch" color="#444654">
            {items.map((item) => (
              <Box key={item.id} minH="50px">
                <Box display="grid" gridTemplateColumns="1fr 100px 140px" gap={2} alignItems="center" mb={2}>
                  <Text fontWeight="bold" fontSize="16px" m={0} p={0}>
                    {item.name}
                  </Text>
                  <HStack justify="flex-end" spacing={1} wrap="wrap">
                    {item.allergens?.map((allergen) =>
                      allergen.icon ? (
                        <Box key={allergen.id} p="1px">
                          <Image src={`/images/alergeni/${allergen.icon}`} alt={allergen.name || "Alergen"} width={18} height={18} />
                        </Box>
                      ) : null
                    )}
                    {item.amount && (
                      <Text fontSize="16px" m={0} p={0}>
                        {item.amount}
                      </Text>
                    )}
                  </HStack>
                  <Text fontWeight="bold" fontSize="16px" textAlign="right" m={0} p={0} pr={2} whiteSpace="nowrap" overflow="visible">
                    {item.price} €
                  </Text>
                </Box>
                {item.description && (
                  <Text fontSize="14px" mt={1}>
                    {item.description}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      );
    });
  };

  return (
    <Box minH="100vh" w="100%">
      <div className={`dashboard-theme ${geist.variable} ${geistMono.variable}`}>
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

        <div className="admin:mx-auto admin:w-full admin:max-w-5xl admin:px-5 admin:py-6">
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
                  {subcategories
                    .filter((subcategory) => subcategory.name.toLowerCase() !== "dnevni menu")
                    .map((subcategory) => (
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
        </div>
      </div>

      <Container maxW="container.lg" mx="auto" px={5}>
        <Box position="relative">
          {mode === "custom" && <Box className="page-break-preview-overlay" />}
          <Box
            ref={printableRef}
            id="printable"
            className={mode === "custom" ? "with-page-breaks" : ""}
            fontFamily="'Open Sans', sans-serif"
          >
            <VStack spacing={2} align="stretch" color="#444654">
              {renderItems()}
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
