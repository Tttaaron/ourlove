"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { motion } from "framer-motion";
import { Heart, Stars } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "pink-cherry" ? "starry-night" : "pink-cherry");
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`
        fixed top-4 right-4 p-3 rounded-full z-50 shadow-[0_4px_20px_rgba(0,0,0,0.15)] 
        transition-all duration-500 glass-card flex items-center justify-center overflow-hidden
      `}
            style={{
                boxShadow: theme === "pink-cherry"
                    ? "0 4px 20px rgba(255,105,180,0.4)"
                    : "0 4px 20px rgba(59,130,246,0.5)"
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    rotate: theme === "starry-night" ? 360 : 0,
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
                className="relative flex items-center justify-center w-6 h-6"
            >
                <motion.div
                    animate={{
                        opacity: theme === "pink-cherry" ? 1 : 0,
                        scale: theme === "pink-cherry" ? 1 : 0.2,
                        rotate: theme === "pink-cherry" ? 0 : -90,
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {/* 粉色樱花主题的爱心 */}
                    <Heart className="w-full h-full fill-accent text-accent animate-pulse" />
                </motion.div>

                <motion.div
                    animate={{
                        opacity: theme === "starry-night" ? 1 : 0,
                        scale: theme === "starry-night" ? 1 : 0.2,
                        rotate: theme === "starry-night" ? 0 : 90,
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {/* 星空主题的星星 */}
                    <Stars className="w-full h-full fill-white text-white" />
                </motion.div>
            </motion.div>
        </motion.button>
    );
}
