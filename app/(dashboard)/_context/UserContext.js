"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { checkToken, clearDemoAuth } from "../../../utils/auth";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
   
    useEffect(() => {
        async function checkUser() {
            try {
                await checkToken();
                setIsLoggedIn(true);
            } catch {
                clearDemoAuth();
                setIsLoggedIn(false);
            } finally {
                setLoading(false)
            }
        }
        checkUser();
    }, []);

    return (
        <UserContext.Provider value={{ loading, isLoggedIn, setIsLoggedIn }}>
            {children}
        </UserContext.Provider>
    );
}

export function useAuth() {
    return useContext(UserContext);
}
