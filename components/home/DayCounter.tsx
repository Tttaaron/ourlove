"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Edit2, Check } from "lucide-react";
import { getConfig, setConfig } from "@/lib/supabase/data";

export function DayCounter({ startDateParam }: { startDateParam?: string }) {
    const [days, setDays] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [anniversary, setAnniversary] = useState("2023-05-20");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("ourlove-anniversary");
        if (stored) {
            setAnniversary(stored);
        } else if (startDateParam) {
            setAnniversary(startDateParam.split('T')[0]);
        }

        // 异步从 Supabase 同步
        const sync = async () => {
            const remote = await getConfig("anniversary");
            if (remote) {
                setAnniversary(remote);
                localStorage.setItem("ourlove-anniversary", remote);
            }
        };
        sync();
    }, [startDateParam]);

    useEffect(() => {
        if (!mounted) return;

        const start = new Date(`${anniversary}T00:00:00`);
        const updateDays = () => {
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - start.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            setDays(diffDays);
        };

        updateDays();
        const interval = setInterval(updateDays, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [anniversary, mounted]);

    const handleSave = () => {
        localStorage.setItem("ourlove-anniversary", anniversary);
        setIsEditing(false);
        setConfig("anniversary", anniversary);
    };

    if (!mounted) return <div className="animate-pulse h-32 bg-muted/20 rounded-2xl w-full max-w-md mx-auto my-8"></div>;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="glass-card p-8 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group w-full max-w-md mx-auto my-8 h-[380px]"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

            <div className="flex items-center gap-2 mb-4 relative group/edit">
                <p className="text-lg font-sans opacity-80 tracking-widest text-foreground">我们相爱的第</p>
                {!isEditing && (
                    <button title="编辑相爱日期" onClick={() => setIsEditing(true)} className="opacity-0 group-hover/edit:opacity-100 absolute -right-8 p-1 rounded-full hover:bg-primary/20 text-foreground/50 hover:text-primary transition-all">
                        <Edit2 className="w-3 h-3" />
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="flex items-center gap-2 mb-6">
                    <input title="相爱日期" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} className="bg-background/40 backdrop-blur-md border border-primary/40 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-foreground" autoFocus />
                    <button title="保存日期" onClick={handleSave} className="p-1.5 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors">
                        <Check className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-baseline gap-4 mt-4">
                <motion.span
                    key={days}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-8xl md:text-9xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-accent drop-shadow-[0_4px_15px_rgba(255,117,143,0.4)]"
                >
                    {days}
                </motion.span>
                <span className="text-2xl font-serif opacity-80 font-medium">天</span>
            </div>

            <motion.div
                animate={{ scale: [1, 1.25, 1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="mt-8 relative"
            >
                <div className="absolute inset-0 bg-destructive/30 blur-xl rounded-full"></div>
                <Heart className="w-10 h-10 text-destructive fill-destructive drop-shadow-[0_0_25px_rgba(239,35,60,0.6)] relative z-10" />
            </motion.div>
        </motion.div>
    );
}
