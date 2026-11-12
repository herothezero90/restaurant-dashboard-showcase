"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMenu, getCategories, getAllergens } from "../../../utils/menuUtils";
import { useError } from "./ErrorContext";
import { subscribeToDemoData } from "../../../utils/demoStore";

const MenuContext = createContext();

export function MenuProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState('hr');
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { setError } = useError();

    const [categories, setCategories] = useState([]);
    const [activeCategory, setCurrentActiveCategory] = useState(null);
    const [activeSubcategory, setActiveSubcategory] = useState(null);

    const [allergens, setAllergens] = useState([]);

    const fetchMenu = useCallback(async (currentLang = currentLanguage) => {
        setIsLoading(true);
        try {
            const data = await getMenu(currentLang);
            setMenuItems(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentLanguage, setError]);

    const fetchCategories = useCallback(async (currentLang) => {
        try {
            const data = await getCategories(currentLang);
            setCategories(data);
            setCurrentActiveCategory((current) => current || data?.[0]?.id || null);
            setActiveSubcategory((current) => current || data?.[0]?.subcategories?.[0]?.id || null);
        } catch (error) {
            setError(error.message);
        }
    }, [setError]);

    const fetchAllergens = useCallback(async (currentLang) => {
        try {
            const data = await getAllergens(currentLang);
            setAllergens(data);
        } catch (error) {
            setError(error.message);
        }
    }, [setError]);

    const refreshAll = useCallback(async (lang) => {
        await Promise.all([
            fetchMenu(lang),
            fetchCategories(lang),
            fetchAllergens(lang),
        ]);
    }, [fetchMenu, fetchCategories, fetchAllergens]);

    const setActiveCategory = (value) => {
        setCurrentActiveCategory(value);
        const subCategoryId = categories.find(category => category.id === value).subcategories?.[0]?.id || null;
        setActiveSubcategory(subCategoryId);
    };

    useEffect(() => {
        refreshAll(currentLanguage);
    }, [currentLanguage, refreshAll]);

    useEffect(() => {
        return subscribeToDemoData(() => {
            refreshAll(currentLanguage);
        });
    }, [currentLanguage, refreshAll]);

    return (
        <MenuContext.Provider value={{ menuItems, isLoading, currentLanguage, fetchMenu, setCurrentLanguage, categories, activeCategory, setActiveCategory, activeSubcategory, setActiveSubcategory, allergens }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    return useContext(MenuContext);
}
