"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getConfig, setConfig } from "@/lib/supabase/data";

type Theme = "pink-cherry" | "starry-night";

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
    theme: "pink-cherry",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "pink-cherry",
    storageKey = "ourlove-theme",
}: {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 1. 先从 localStorage 加载
        const storedTheme = localStorage.getItem(storageKey) as Theme | null;
        if (storedTheme) {
            setThemeState(storedTheme);
        }
        setMounted(true);

        // 2. 异步从 Supabase 同步
        const syncTheme = async () => {
            const remoteTheme = await getConfig("theme");
            if (remoteTheme && remoteTheme !== storedTheme) {
                setThemeState(remoteTheme as Theme);
                localStorage.setItem(storageKey, remoteTheme);
            }
        };
        syncTheme();
    }, [storageKey]);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("pink-cherry", "starry-night");
        root.classList.add(theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
        // 同步到 Supabase
        setConfig("theme", newTheme);
    };

    if (!mounted) {
        return (
            <div style={{ visibility: "hidden" }}>
                {children}
            </div>
        );
    }

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
