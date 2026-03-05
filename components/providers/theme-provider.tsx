"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

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
    supabaseKey = "theme_preference",
}: {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
    supabaseKey?: string;
}) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [mounted, setMounted] = useState(false);

    // 初始化 Supabase 客户端 (如无环境变量则会在 client 里优雅降级或静默失败，这里做展示用)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy"
    );

    useEffect(() => {
        const root = document.documentElement;

        // 1. 初始化时优先从 localStorage 取
        const storedTheme = localStorage.getItem(storageKey) as Theme | null;
        if (storedTheme) {
            setThemeState(storedTheme);
        }

        // 2. 尝试从 Supabase 同步用户偏好 (假设用户已登录且有 users 表，为了稳健性，加了try/catch或简单执行)
        const fetchUserTheme = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.user_metadata?.[supabaseKey]) {
                    const remoteTheme = user.user_metadata[supabaseKey] as Theme;
                    if (remoteTheme && remoteTheme !== storedTheme) {
                        setThemeState(remoteTheme);
                        localStorage.setItem(storageKey, remoteTheme);
                    }
                }
            } catch (e) {
                console.warn("Supabase theme sync skipped", e);
            }
        };

        // fetchUserTheme(); // 如已上线 auth 可取消注释开启远程同步

        setMounted(true);
    }, [storageKey, supabase, supabaseKey]);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("pink-cherry", "starry-night");
        root.classList.add(theme);
    }, [theme]);

    const setTheme = async (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);

        // 尝试同步到 Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.auth.updateUser({
                    data: { [supabaseKey]: newTheme }
                });
            }
        } catch (e) {
            // 忽略未登录错误
        }
    };

    // 防止 SSR 渲染客户端不一致导致的 Hydration mismatch
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
