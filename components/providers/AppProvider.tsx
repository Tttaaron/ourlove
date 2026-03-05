"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "pink-cherry" | "starry-night";

interface AppContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("pink-cherry");

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("pink-cherry", "starry-night");
        root.classList.add(theme);
    }, [theme]);

    // Handle system preference or saved preference here if needed.

    return (
        <AppContext.Provider value={{ theme, setTheme }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}
