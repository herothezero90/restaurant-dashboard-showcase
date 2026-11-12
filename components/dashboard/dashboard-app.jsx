"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChefHat,
  ExternalLink,
  GripVertical,
  Languages,
  LoaderCircle,
  LogIn,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings2,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { login } from "../../utils/auth";
import {
  addMenuItem,
  deleteMenuItem,
  getDailyMenu,
  reorder,
  updateDailyMenuPrice,
  updateDailyMenuStatus,
  updateMenuItem,
  updateMenuItemStatus,
} from "../../utils/menuUtils";
import { useError } from "../../app/(dashboard)/_context/ErrorContext";
import { useMenu } from "../../app/(dashboard)/_context/MenuContext";
import { useAuth } from "../../app/(dashboard)/_context/UserContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import { Field, Input, Select } from "./ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "./lib/utils";

const LANGUAGES = [
  { value: "hr", label: "HR" },
  { value: "en", label: "EN" },
  { value: "it", label: "IT" },
  { value: "de", label: "DE" },
  { value: "ru", label: "RU" },
];

function allergenIcon(icon) {
  if (!icon) return null;
  return icon.startsWith("/") ? icon : `/images/alergeni/${icon}`;
}

function ErrorBanner() {
  const { error, setError } = useError();
  if (!error) return null;

  return (
    <div className="admin:fixed admin:left-1/2 admin:top-4 admin:z-[1200] admin:flex admin:w-[calc(100%-2rem)] admin:max-w-xl admin:-translate-x-1/2 admin:items-center admin:justify-between admin:gap-3 admin:rounded-md admin:bg-destructive admin:px-4 admin:py-3 admin:text-sm admin:text-destructive-foreground admin:shadow-lg">
      <span>{error}</span>
      <button type="button" onClick={() => setError(null)} aria-label="Zatvori">
        <X size={18} />
      </button>
    </div>
  );
}

function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setIsLoggedIn } = useAuth();
  const { setError } = useError();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(username, password);
      setIsLoggedIn(true);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="admin:flex admin:min-h-screen admin:items-center admin:justify-center admin:bg-background admin:p-4">
      <Card className="admin:w-full admin:max-w-sm">
        <CardHeader>
          <div className="admin:mb-2 admin:flex admin:size-11 admin:items-center admin:justify-center admin:rounded-md admin:bg-primary admin:text-primary-foreground">
            <LogIn size={20} />
          </div>
          <CardTitle>Konoba Bare</CardTitle>
          <p className="admin:text-sm admin:text-muted-foreground">Menu management dashboard</p>
        </CardHeader>
        <CardContent>
          <form className="admin:grid admin:gap-4" onSubmit={handleSubmit}>
            <Field label="Username">
              <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </Field>
            <Button type="submit">Sign in</Button>
            <p className="admin:text-center admin:text-xs admin:text-muted-foreground">Demo login: username <strong>demo</strong>, password <strong>demo123</strong></p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function FilterBar({ mode, onAddItem }) {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    activeSubcategory,
    setActiveSubcategory,
    currentLanguage,
    setCurrentLanguage,
  } = useMenu();

  const subcategories = categories.find((category) => category.id === activeCategory)?.subcategories || [];

  return (
    <div className="admin:grid admin:gap-4">
          <div className="admin:flex admin:flex-wrap admin:gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant={activeCategory === category.id ? "default" : "outline"}
                className="admin:h-11 admin:px-5 admin:shadow-sm"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.id === 2 ? <Utensils size={15} /> : <ChefHat size={15} />}
                {category.name}
              </Button>
            ))}
          </div>
          <div className="admin:flex admin:gap-3 admin:overflow-x-auto admin:pb-1">
            {subcategories.map((subcategory) => (
              <Button
                key={subcategory.id}
                variant={activeSubcategory === subcategory.id ? "default" : "outline"}
                className="admin:shadow-sm"
                onClick={() => setActiveSubcategory(subcategory.id)}
              >
                {subcategory.name}
              </Button>
            ))}
          </div>
          {mode === "edit" && (
            <div className="admin:flex admin:flex-wrap admin:items-center admin:justify-between admin:gap-3">
              <div className="admin:flex admin:flex-wrap admin:items-center admin:gap-2">
                <Languages size={16} className="admin:text-muted-foreground" />
                {LANGUAGES.map((language) => (
                  <Button
                    key={language.value}
                    size="sm"
                    variant={currentLanguage === language.value ? "default" : "outline"}
                    onClick={() => setCurrentLanguage(language.value)}
                  >
                    {language.label}
                  </Button>
                ))}
              </div>
              {currentLanguage === "hr" && (
                <Button onClick={onAddItem}><Plus size={16} /> Dodaj novo jelo</Button>
              )}
            </div>
          )}
    </div>
  );
}

function MobileFilterBar({ mode, openDaily }) {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    activeSubcategory,
    setActiveSubcategory,
    currentLanguage,
    setCurrentLanguage,
  } = useMenu();
  const subcategories = categories.find((category) => category.id === activeCategory)?.subcategories || [];

  return (
    <div className="admin:fixed admin:inset-x-0 admin:top-0 admin:z-50 admin:border-b admin:border-border admin:bg-background admin:px-2 admin:py-2 admin:shadow-sm admin:md:hidden">
      <div className="admin:flex admin:items-center admin:justify-between admin:gap-2">
        <div className="admin:flex admin:gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={activeCategory === category.id ? "default" : "secondary"}
              onClick={() => setActiveCategory(category.id)}
              aria-label={category.name}
            >
              {category.id === 2 ? <Utensils size={17} /> : <ChefHat size={17} />}
            </Button>
          ))}
        </div>
        {mode === "edit" ? (
          <div className="admin:flex admin:gap-1">
            {LANGUAGES.map((language) => (
              <Button
                key={language.value}
                size="sm"
                variant={currentLanguage === language.value ? "default" : "ghost"}
                onClick={() => setCurrentLanguage(language.value)}
              >
                {language.label}
              </Button>
            ))}
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={openDaily}>
            <ChefHat size={16} /> Dnevni
          </Button>
        )}
      </div>
      <div className="admin:mt-2 admin:flex admin:gap-2 admin:overflow-x-auto admin:pb-1">
        {subcategories.map((subcategory) => (
          <Button
            key={subcategory.id}
            size="sm"
            variant={activeSubcategory === subcategory.id ? "secondary" : "ghost"}
            onClick={() => setActiveSubcategory(subcategory.id)}
          >
            {subcategory.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function MobileBottomNav({ mode, setMode }) {
  return (
    <div className="admin:fixed admin:inset-x-0 admin:bottom-0 admin:z-50 admin:grid admin:grid-cols-3 admin:gap-2 admin:border-t admin:border-border admin:bg-background admin:p-2 admin:shadow-lg admin:md:hidden">
      <Button size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>
        <Pencil size={16} /> Unos
      </Button>
      <Button size="sm" variant={mode === "activate" ? "default" : "outline"} onClick={() => setMode("activate")}>
        <Check size={16} /> Aktivacija
      </Button>
      <Button size="sm" variant="outline" onClick={() => window.open("/menu", "_blank")} aria-label="Trenutni menu">
        <MenuIcon size={18} />
      </Button>
    </div>
  );
}

function DailyMenuToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || "Dnevni menu"}
      onClick={onChange}
      className={cn(
        "admin:inline-flex admin:size-8 admin:shrink-0 admin:items-center admin:justify-center admin:rounded-sm admin:border admin:text-sm admin:font-bold admin:leading-none admin:transition-colors admin:focus-visible:outline-none admin:focus-visible:ring-2 admin:focus-visible:ring-ring admin:focus-visible:ring-offset-2 admin:focus-visible:ring-offset-background",
        checked
          ? "admin:border-primary admin:bg-primary admin:text-primary-foreground"
          : "admin:border-border admin:bg-muted admin:text-muted-foreground admin:opacity-60"
      )}
    >
      D
    </button>
  );
}

function AllergenList({ allergens }) {
  if (!allergens?.length) return <span className="admin:text-xs admin:text-muted-foreground">Bez alergena</span>;

  return (
    <div className="admin:flex admin:flex-wrap admin:gap-1">
      {allergens.map((allergen) => (
        <span
          key={allergen.id}
          title={allergen.name}
          className="admin:flex admin:size-7 admin:items-center admin:justify-center admin:rounded-full admin:border admin:border-border admin:bg-background"
        >
          {allergenIcon(allergen.icon) ? (
            <Image src={allergenIcon(allergen.icon)} alt={allergen.name} width={16} height={16} className="admin:size-4" />
          ) : (
            <span className="admin:text-[10px]">{allergen.name.slice(0, 1)}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function SortableMenuRow({ item, mode, sorting, onEdit, onDelete, onToggleActive, onToggleDaily }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(item.id) });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(sorting && "admin:!bg-[#f5f5f5]")}>
      {mode === "activate" && (
        <TableCell className="admin:w-[72px]">
          {sorting ? (
            <Button size="icon" variant="ghost" {...attributes} {...listeners} className="admin:cursor-grab admin:touch-none">
              <GripVertical size={18} />
            </Button>
          ) : (
            <input
              type="checkbox"
              checked={item.active}
              onChange={() => onToggleActive(item)}
              className="admin:size-4 admin:rounded admin:border-input admin:accent-primary"
              aria-label={`Aktivno: ${item.name}`}
            />
          )}
        </TableCell>
      )}
      {mode === "activate" && (
        <TableCell className="admin:w-[72px]">
          {!sorting && (
            <DailyMenuToggle
              checked={item.daily_menu}
              label={`Dnevni menu: ${item.name}`}
              onChange={() => onToggleDaily(item)}
            />
          )}
        </TableCell>
      )}
      <TableCell className="admin:min-w-[190px] admin:font-medium admin:text-foreground">{item.name || "Bez naziva"}</TableCell>
      <TableCell className="admin:min-w-[260px] admin:max-w-[420px] admin:text-muted-foreground">{item.description && item.description !== "-" ? item.description : ""}</TableCell>
      {item.category_id === 2 && <TableCell className="admin:min-w-[110px]">{item.amount || "—"}</TableCell>}
      <TableCell className="admin:min-w-[150px]"><AllergenList allergens={item.allergens} /></TableCell>
      <TableCell className="admin:min-w-[100px] admin:text-right admin:font-medium">{item.price} €</TableCell>
      {mode === "edit" && (
        <TableCell className="admin:w-[120px]">
          <div className="admin:flex admin:justify-end admin:gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(item)} aria-label={`Uredi ${item.name}`}>
              <Pencil size={16} />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(item)} className="admin:text-destructive admin:hover:bg-destructive/10" aria-label={`Izbriši ${item.name}`}>
              <Trash2 size={16} />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

function MobileMenuCard({ item, mode, sorting, onEdit, onDelete, onToggleActive, onToggleDaily, dragProps }) {
  return (
    <Card className="admin:relative">
      <CardContent className="admin:grid admin:gap-3 admin:pt-5">
        <div className="admin:flex admin:items-start admin:justify-between admin:gap-3">
          <div>
            <h3 className="admin:font-semibold admin:text-foreground">{item.name || "Bez naziva"}</h3>
            {item.description && item.description !== "-" && (
              <p className="admin:mt-1 admin:text-sm admin:text-muted-foreground">{item.description}</p>
            )}
          </div>
          {sorting && (
            <Button size="icon" variant="outline" className="admin:cursor-grab admin:touch-none" {...dragProps}>
              <GripVertical size={18} />
            </Button>
          )}
        </div>
        <div className="admin:flex admin:flex-wrap admin:items-center admin:justify-between admin:gap-2">
          <AllergenList allergens={item.allergens} />
          <span className="admin:text-sm admin:font-medium">{item.amount ? `${item.amount} · ` : ""}{item.price} €</span>
        </div>
        {!sorting && mode === "edit" && (
          <div className="admin:flex admin:gap-2 admin:border-t admin:border-border admin:pt-3">
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil size={15} /> Uredi</Button>
            <Button size="sm" variant="ghost" className="admin:text-destructive" onClick={() => onDelete(item)}><Trash2 size={15} /> Izbriši</Button>
          </div>
        )}
        {!sorting && mode === "activate" && (
          <div className="admin:flex admin:gap-2 admin:border-t admin:border-border admin:pt-3">
            <Button size="sm" variant={item.active ? "default" : "outline"} onClick={() => onToggleActive(item)}>
              {item.active ? <Check size={15} /> : <X size={15} />} {item.active ? "Aktivno" : "Neaktivno"}
            </Button>
            <DailyMenuToggle
              checked={item.daily_menu}
              label={`Dnevni menu: ${item.name}`}
              onChange={() => onToggleDaily(item)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SortableMobileMenuCard(props) {
  const { item } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(item.id) });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <MobileMenuCard {...props} dragProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function MenuGrid({ mode, onEdit, openDaily }) {
  const {
    menuItems,
    activeCategory,
    activeSubcategory,
    currentLanguage,
    fetchMenu,
  } = useMenu();
  const { setError } = useError();
  const [localItems, setLocalItems] = useState([]);
  const [sorting, setSorting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredItems = useMemo(
    () => menuItems.filter(
      (item) => item.category_id === activeCategory && item.sub_category_id === activeSubcategory
    ),
    [menuItems, activeCategory, activeSubcategory]
  );

  useEffect(() => {
    setLocalItems(filteredItems);
  }, [filteredItems]);

  const runAction = async (action) => {
    try {
      await action();
      await fetchMenu(currentLanguage);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (item) => {
    if (currentLanguage !== "hr") {
      setError("Brisanje je dostupno samo na hrvatskom jeziku.");
      return;
    }
    if (!window.confirm(`Sigurno želite izbrisati "${item.name}"?`)) return;
    await runAction(() => deleteMenuItem(item.id));
  };

  const handleToggleActive = async (item) => {
    const next = !item.active;
    if (!window.confirm(`Sigurno želite ${next ? "aktivirati" : "deaktivirati"} "${item.name}"?`)) return;
    await runAction(() => updateMenuItemStatus(item.id, next));
  };

  const handleToggleDaily = async (item) => {
    const next = !item.daily_menu;
    if (!window.confirm(`Sigurno želite ${next ? "dodati u" : "ukloniti iz"} dnevnog menija "${item.name}"?`)) return;
    await runAction(() => updateDailyMenuStatus(item.id, next));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setLocalItems((items) => {
      const oldIndex = items.findIndex((item) => String(item.id) === active.id);
      const newIndex = items.findIndex((item) => String(item.id) === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const saveOrder = async () => {
    await runAction(() => reorder(localItems.map((item, index) => ({ id: item.id, order_no: index + 1 }))));
    setSorting(false);
  };

  return (
    <div className="admin:grid admin:gap-4">
      {mode === "activate" && (
        <div className="admin:hidden admin:items-center admin:justify-between admin:gap-3 admin:md:flex">
          <div className="admin:flex admin:gap-2">
            {sorting ? (
              <>
                <Button variant="outline" onClick={() => { setLocalItems(filteredItems); setSorting(false); }}>Otkaži</Button>
                <Button onClick={saveOrder}><Save size={16} /> Spremi redoslijed</Button>
              </>
            ) : (
              <Button onClick={() => setSorting(true)}><GripVertical size={16} /> Promijeni redoslijed</Button>
            )}
          </div>
          <Button variant="secondary" onClick={openDaily}>
            <ChefHat size={16} /> Dnevni menu
          </Button>
        </div>
      )}

      {localItems.length === 0 ? (
        <Card><CardContent className="admin:py-10 admin:text-center admin:text-sm admin:text-muted-foreground">Nema stavki za odabrani filter.</CardContent></Card>
      ) : (
        <>
          <Card className="admin:hidden admin:w-full admin:overflow-hidden admin:border-border admin:md:block">
            <div className="admin:overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localItems.map((item) => String(item.id))} strategy={verticalListSortingStrategy}>
                <Table className="admin:min-w-[900px] admin:table-fixed">
                  <TableHeader>
                    <TableRow className="admin:bg-card admin:hover:bg-card">
                      {mode === "activate" && <TableHead className="admin:w-[110px]">{sorting ? "Redoslijed" : "Aktivno"}</TableHead>}
                      {mode === "activate" && <TableHead className="admin:w-[88px]">Dnevni</TableHead>}
                      <TableHead className="admin:w-[24%]">Naziv</TableHead>
                      <TableHead>Opis</TableHead>
                      {activeCategory === 2 && <TableHead>Količina</TableHead>}
                      <TableHead className="admin:w-[180px]">Alergeni</TableHead>
                      <TableHead className="admin:w-[110px] admin:text-right">Cijena</TableHead>
                      {mode === "edit" && <TableHead className="admin:w-[120px] admin:text-right">Akcije</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localItems.map((item) => (
                      <SortableMenuRow
                        key={item.id}
                        item={item}
                        mode={mode}
                        sorting={sorting}
                        onEdit={onEdit}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                        onToggleDaily={handleToggleDaily}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
            </div>
          </Card>
          <div className="admin:grid admin:gap-3 admin:md:hidden">
            {mode === "activate" && (
              <div className="admin:flex admin:justify-end">
                {sorting ? (
                  <div className="admin:flex admin:gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setLocalItems(filteredItems); setSorting(false); }}>Otkaži</Button>
                    <Button size="sm" onClick={saveOrder}><Save size={15} /> Spremi</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setSorting(true)}><GripVertical size={15} /> Promijeni redoslijed</Button>
                )}
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localItems.map((item) => String(item.id))} strategy={verticalListSortingStrategy}>
                {localItems.map((item) => (
                  <SortableMobileMenuCard
                    key={item.id}
                    item={item}
                    mode={mode}
                    sorting={sorting}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onToggleDaily={handleToggleDaily}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}
    </div>
  );
}

function ItemDialog({ open, onOpenChange, initialItem }) {
  const { categories, allergens, currentLanguage, fetchMenu } = useMenu();
  const { setError } = useError();
  const editing = Boolean(initialItem);
  const isCroatian = currentLanguage === "hr";

  const createDraft = () => ({
    id: initialItem?.id,
    name: initialItem?.name || "",
    description: initialItem?.description || "",
    category_id: initialItem?.category_id || categories[0]?.id || 1,
    sub_category_id: initialItem?.sub_category_id || categories[0]?.subcategories?.[0]?.id || 1,
    amount: initialItem?.amount || "",
    price: initialItem?.price ?? 0,
    allergens: initialItem?.allergens?.map((allergen) => allergen.id) || [],
  });

  const [draft, setDraft] = useState(createDraft);

  useEffect(() => {
    if (open) setDraft(createDraft());
  }, [open, initialItem]);

  const selectedCategory = categories.find((category) => category.id === Number(draft.category_id));
  const subcategories = selectedCategory?.subcategories || [];

  const setValue = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const changeCategory = (value) => {
    const categoryId = Number(value);
    const category = categories.find((entry) => entry.id === categoryId);
    setDraft((current) => ({
      ...current,
      category_id: categoryId,
      sub_category_id: category?.subcategories?.[0]?.id || null,
      amount: categoryId === 1 ? "" : current.amount,
    }));
  };

  const toggleAllergen = (id) => {
    setDraft((current) => ({
      ...current,
      allergens: current.allergens.includes(id)
        ? current.allergens.filter((allergenId) => allergenId !== id)
        : [...current.allergens, id],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        await updateMenuItem(
          draft.id,
          draft.name,
          draft.description,
          Number(draft.category_id),
          Number(draft.sub_category_id),
          draft.amount,
          Number(draft.price),
          currentLanguage,
          draft.allergens
        );
      } else {
        await addMenuItem(
          Number(draft.category_id),
          Number(draft.sub_category_id),
          draft.name,
          draft.description,
          Number(draft.price),
          draft.amount,
          draft.allergens
        );
      }
      await fetchMenu(currentLanguage);
      onOpenChange(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogTitle>{editing ? `Uredi (${currentLanguage.toUpperCase()})` : "Dodaj novo jelo"}</DialogTitle>
        <DialogDescription>
          {!isCroatian && editing
            ? "Na drugim jezicima mijenjaju se samo naziv i opis."
            : "Promjene se odmah prikazuju na jelovniku."}
        </DialogDescription>
        <form className="admin:mt-6 admin:grid admin:gap-4 admin:rounded-md admin:border admin:border-border admin:bg-white admin:p-4" onSubmit={handleSubmit}>
          <Field label={`Naziv (${currentLanguage})`}>
            <Input required value={draft.name} onChange={(event) => setValue("name", event.target.value)} />
          </Field>
          <Field label={`Opis (${currentLanguage})`}>
            <Input value={draft.description} onChange={(event) => setValue("description", event.target.value)} />
          </Field>

          {isCroatian && (
            <>
              {Number(draft.category_id) === 2 && (
                <Field label="Količina">
                  <Input value={draft.amount} onChange={(event) => setValue("amount", event.target.value)} />
                </Field>
              )}
              <Field label="Cijena">
                <Input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setValue("price", event.target.value)} />
              </Field>
              <div className="admin:grid admin:gap-4 admin:md:grid-cols-2">
                <Field label="Vrsta">
                  <Select value={draft.category_id} onChange={(event) => changeCategory(event.target.value)}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </Select>
                </Field>
                <Field label="Podkategorija">
                  <Select value={draft.sub_category_id || ""} onChange={(event) => setValue("sub_category_id", Number(event.target.value))}>
                    {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Alergeni">
                <div className="admin:flex admin:flex-wrap admin:gap-2">
                  {allergens.map((allergen) => {
                    const selected = draft.allergens.includes(allergen.id);
                    return (
                      <Button
                        key={allergen.id}
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleAllergen(allergen.id)}
                      >
                        {allergenIcon(allergen.icon) && <Image src={allergenIcon(allergen.icon)} alt="" width={16} height={16} className="admin:size-4" />}
                        {allergen.name}
                      </Button>
                    );
                  })}
                </div>
              </Field>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Otkaži</Button>
            <Button type="submit"><Save size={16} /> {editing ? "Ažuriraj" : "Spremi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DailyMenuDialog({ open, onOpenChange }) {
  const { setError } = useError();
  const [items, setItems] = useState([]);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (!open) return;
    getDailyMenu("hr")
      .then((data) => {
        setItems(data.items);
        setPrice(data.price);
      })
      .catch((error) => setError(error.message));
  }, [open, setError]);

  const save = async () => {
    if (Number(price) <= 0) {
      setError("Cijena mora biti veća od 0.");
      return;
    }
    try {
      await updateDailyMenuPrice(Number(price));
      onOpenChange(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Dnevni menu</DialogTitle>
        <DialogDescription>{items.length} stavki trenutno je uključeno u dnevni menu.</DialogDescription>
        <div className="admin:mt-5 admin:overflow-hidden admin:rounded-md admin:border admin:border-border admin:bg-white">
          <Table>
            <TableHeader>
              <TableRow className="admin:bg-[#fcfcfc] admin:hover:bg-[#fcfcfc]">
                <TableHead className="admin:w-12">#</TableHead>
                <TableHead>Naziv jela</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="admin:text-center admin:text-muted-foreground">
                    Nema stavki u dnevnom meniju.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="admin:text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="admin:font-medium">{item.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="admin:mt-5">
          <Field label="Cijena dnevnog menija">
            <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Otkaži</Button>
          <Button onClick={save}><Save size={16} /> Ažuriraj cijenu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Dashboard() {
  const { isLoading, currentLanguage } = useMenu();
  const [mode, setMode] = useState("activate");
  const [itemDialog, setItemDialog] = useState({ open: false, item: null });
  const [dailyOpen, setDailyOpen] = useState(false);

  return (
    <main className="admin:min-h-screen admin:bg-background admin:text-foreground">
      <MobileFilterBar mode={mode} openDaily={() => setDailyOpen(true)} />
      <header className="admin:hidden admin:border-b admin:border-border admin:bg-card admin:text-center admin:md:block">
        <div className="admin:w-full admin:px-6 admin:py-5">
          <h1 className="admin:text-3xl admin:font-semibold admin:tracking-tight admin:text-foreground admin:md:text-5xl">Konoba Bare</h1>
        </div>
      </header>

      <div className="admin:grid admin:w-full admin:gap-6 admin:px-2 admin:pb-20 admin:pt-28 admin:md:px-6 admin:md:py-6">
        <div className="admin:hidden admin:flex-wrap admin:justify-center admin:gap-3 admin:md:flex">
          <Button variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>
            <Pencil size={16} /> Unos i izmjena
          </Button>
          <Button variant={mode === "activate" ? "default" : "outline"} onClick={() => setMode("activate")}>
            <Check size={16} /> Aktivacija
          </Button>
          <Button variant="secondary" onClick={() => window.open("/menu", "_blank")}><MenuIcon size={16} /> Trenutni menu</Button>
          <Button variant="secondary" onClick={() => window.open("/menu_print", "_blank")}><Printer size={16} /> Print</Button>
        </div>

        <div className="admin:hidden admin:md:block">
          <FilterBar
            mode={mode}
            onAddItem={() => setItemDialog({ open: true, item: null })}
          />
        </div>

        {mode === "edit" && currentLanguage === "hr" && (
          <div className="admin:flex admin:justify-end admin:md:hidden">
            <Button onClick={() => setItemDialog({ open: true, item: null })}><Plus size={16} /> Dodaj novo jelo</Button>
          </div>
        )}

        {isLoading ? (
          <Card><CardContent className="admin:flex admin:items-center admin:justify-center admin:gap-2 admin:py-16 admin:text-sm admin:text-muted-foreground"><LoaderCircle className="admin:animate-spin" size={18} /> Učitavanje...</CardContent></Card>
        ) : (
          <MenuGrid mode={mode} openDaily={() => setDailyOpen(true)} onEdit={(item) => setItemDialog({ open: true, item })} />
        )}
      </div>

      <ItemDialog
        open={itemDialog.open}
        initialItem={itemDialog.item}
        onOpenChange={(open) => setItemDialog((current) => ({ ...current, open }))}
      />
      <DailyMenuDialog open={dailyOpen} onOpenChange={setDailyOpen} />
      <MobileBottomNav mode={mode} setMode={setMode} />
    </main>
  );
}

export default function DashboardApp() {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return <div className="admin:flex admin:min-h-screen admin:items-center admin:justify-center admin:bg-background"><LoaderCircle className="admin:animate-spin" /></div>;
  }

  return (
    <>
      <ErrorBanner />
      {isLoggedIn ? <Dashboard /> : <LoginScreen />}
    </>
  );
}
