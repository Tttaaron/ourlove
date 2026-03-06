"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getConfig, setConfig } from "@/lib/supabase/data";

type Perspective = "boy" | "girl" | null;

interface UserContextType {
    boyBirthday: string | null;
    girlBirthday: string | null;
    perspective: Perspective;
    isInitialized: boolean;
    setBirthdays: (boy: string, girl: string) => void;
    login: (birthday: string) => boolean;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [boyBirthday, setBoyBirthday] = useState<string | null>(null);
    const [girlBirthday, setGirlBirthday] = useState<string | null>(null);
    const [perspective, setPerspective] = useState<Perspective>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // 1. 先从 localStorage 快速加载
        const storedBoy = localStorage.getItem("ourlove-boy-bd");
        const storedGirl = localStorage.getItem("ourlove-girl-bd");
        const storedPerspective = localStorage.getItem("ourlove-perspective") as Perspective;

        if (storedBoy) setBoyBirthday(storedBoy);
        if (storedGirl) setGirlBirthday(storedGirl);
        if (storedPerspective) setPerspective(storedPerspective);

        setIsInitialized(true);

        // 2. 异步从 Supabase 同步（跨设备同步的关键）
        const syncFromSupabase = async () => {
            const remoteBoy = await getConfig("boy_birthday");
            const remoteGirl = await getConfig("girl_birthday");

            if (remoteBoy && remoteBoy !== storedBoy) {
                setBoyBirthday(remoteBoy);
                localStorage.setItem("ourlove-boy-bd", remoteBoy);
            }
            if (remoteGirl && remoteGirl !== storedGirl) {
                setGirlBirthday(remoteGirl);
                localStorage.setItem("ourlove-girl-bd", remoteGirl);
            }
        };
        syncFromSupabase();
    }, []);

    const setBirthdays = (boy: string, girl: string) => {
        setBoyBirthday(boy);
        setGirlBirthday(girl);
        localStorage.setItem("ourlove-boy-bd", boy);
        localStorage.setItem("ourlove-girl-bd", girl);
        // 同步到 Supabase
        setConfig("boy_birthday", boy);
        setConfig("girl_birthday", girl);
    };

    const login = (birthday: string): boolean => {
        if (!boyBirthday || !girlBirthday) return false;

        const normalize = (dateStr: string) => dateStr.replace(/\D/g, "");
        const normalizedInput = normalize(birthday);

        let newPerspective: Perspective = null;
        if (normalizedInput === normalize(boyBirthday)) {
            newPerspective = "boy";
        } else if (normalizedInput === normalize(girlBirthday)) {
            newPerspective = "girl";
        }

        if (newPerspective) {
            setPerspective(newPerspective);
            localStorage.setItem("ourlove-perspective", newPerspective);
            return true;
        }

        return false;
    };

    const logout = () => {
        setPerspective(null);
        localStorage.removeItem("ourlove-perspective");
    };

    return (
        <UserContext.Provider value={{
            boyBirthday,
            girlBirthday,
            perspective,
            isInitialized,
            setBirthdays,
            login,
            logout
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
