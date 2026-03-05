"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Scene } from "@/components/background/Scene";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Heart, UploadCloud, Volume2, VolumeX, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";
import { useUser } from "@/components/providers/user-provider";

export default function Splash() {
    const router = useRouter();
    const { theme } = useTheme();
    const { isInitialized, boyBirthday, girlBirthday, setBirthdays, login } = useUser();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isHeartbeatOn, setIsHeartbeatOn] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    // Login State
    const [showLogin, setShowLogin] = useState(false);
    const [inputBoy, setInputBoy] = useState("");
    const [inputGirl, setInputGirl] = useState("");
    const [inputBirthday, setInputBirthday] = useState("");

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const heartbeatRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/music/song.mp3");
        audioRef.current.loop = true;

        heartbeatRef.current = new Audio("/music/heartbeat.mp3");
        heartbeatRef.current.loop = true;

        toast("欢迎来到我们的世界，请输入生日解锁 ❤️", { duration: 4000 });

        return () => {
            audioRef.current?.pause();
            heartbeatRef.current?.pause();
        };
    }, []);

    useEffect(() => {
        if (isHeartbeatOn) heartbeatRef.current?.play().catch(() => { });
        else heartbeatRef.current?.pause();
    }, [isHeartbeatOn]);

    const handleActionClick = () => {
        if (!showLogin) {
            setShowLogin(true);
            return;
        }

        const isFirstTime = !boyBirthday || !girlBirthday;

        // Convert 8-digit string to "YYYY年MM月DD日" format
        const digitsToDate = (digits: string) => {
            if (digits.length !== 8) return null;
            return `${digits.slice(0, 4)}年${digits.slice(4, 6)}月${digits.slice(6, 8)}日`;
        };

        if (isFirstTime) {
            if (!inputBoy || !inputGirl) {
                toast.error("必须填写双方的生日哦！");
                return;
            }
            if (inputBoy.length !== 8 || inputGirl.length !== 8) {
                toast.error("请填写完整的8位生日 (如 20040923)");
                return;
            }
            const boyDate = digitsToDate(inputBoy)!;
            const girlDate = digitsToDate(inputGirl)!;
            setBirthdays(boyDate, girlDate);
            login(boyDate);
            triggerEnterAnimation();
        } else {
            if (!inputBirthday) {
                toast.error("请输入解锁生日！");
                return;
            }
            const birthdayDate = digitsToDate(inputBirthday);
            if (!birthdayDate) {
                toast.error("请填写完整的8位生日");
                return;
            }
            const success = login(birthdayDate);
            if (success) {
                triggerEnterAnimation();
            } else {
                toast.error("生日错误，你不是我的笨蛋！❌");
            }
        }
    };

    const triggerEnterAnimation = () => {
        setIsLeaving(true);
        audioRef.current?.play().catch(() => { });
        setIsPlaying(true);
        setTimeout(() => {
            router.push("/home");
        }, 2000);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
        }
    };

    const isFirstTime = !boyBirthday || !girlBirthday;

    // --- custom date formatting logic ---
    const handleHeartDateInput = (val: string, oldVal: string) => {
        // If it's a backspace clearing a slash or heart, just let it do normal processing,
        // but basically we just want to extract digits to limit them to 8.
        const digits = val.replace(/\D/g, "");
        return digits.slice(0, 8);
    };

    const formatToHearts = (digits: string) => {
        if (!digits) return "";
        let result = "";
        const maxLen = 8;

        for (let i = 0; i < maxLen; i++) {
            if (i === 4 || i === 6) result += " / ";
            if (i < digits.length) {
                result += digits[i];
            } else {
                result += "♥";
            }
        }
        return result;
    };

    return (
        <AnimatePresence>
            {!isLeaving && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="relative flex flex-col items-center justify-between min-h-screen w-full overflow-hidden bg-primary/5"
                >
                    <Scene />

                    <div className="absolute top-0 right-0 p-4 z-50">
                        <ThemeToggle />
                    </div>

                    <div className="absolute top-4 left-4 z-50 flex gap-4">
                        <button onClick={() => setIsHeartbeatOn(!isHeartbeatOn)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all" title="心跳音效">
                            <Heart className={`w-5 h-5 ${isHeartbeatOn ? "text-red-500 animate-pulse" : "text-white"}`} />
                        </button>
                        <button onClick={() => {
                            if (isPlaying) audioRef.current?.pause();
                            else audioRef.current?.play().catch(() => { });
                            setIsPlaying(!isPlaying);
                        }} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all" title="背景音乐">
                            {isPlaying ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-white/50" />}
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-4">
                        <motion.h1
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
                            className="text-6xl md:text-8xl font-serif text-white tracking-widest text-shadow-glow text-center mb-12"
                            style={{ textShadow: "0 0 40px rgba(255,255,255,0.4)" }}
                        >
                            我们的回忆
                        </motion.h1>

                        <AnimatePresence mode="wait">
                            {!showLogin ? (
                                <motion.div
                                    key="photo"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 1 }}
                                    className="relative group cursor-pointer"
                                    onClick={() => setShowLogin(true)}
                                >
                                    <div
                                        className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/30 shadow-[0_0_50px_rgba(255,183,197,0.3)] backdrop-blur-sm relative bg-primary/10 flex items-center justify-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Couple" className="w-full h-full object-cover" />
                                        ) : (
                                            <UploadCloud className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                                        )}
                                        <input type="file" title="上传主相片" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <p className="text-white/60 text-center mt-6 font-sans tracking-widest text-sm">点击进行身份验证</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="login"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="glass-card rounded-3xl p-8 max-w-sm w-full border border-white/20 shadow-2xl backdrop-blur-xl bg-white/5"
                                >
                                    <div className="flex justify-center mb-6">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                            <KeyRound className="w-8 h-8 text-primary/80" />
                                        </div>
                                    </div>

                                    {isFirstTime ? (
                                        <div className="space-y-4">
                                            <div className="text-center mb-6">
                                                <h3 className="text-xl font-serif text-white tracking-widest">初次见面</h3>
                                                <p className="text-white/60 text-xs mt-2">请设定专属的生日密钥，未来的视角将由此决定。</p>
                                            </div>
                                            <div>
                                                <p className="text-white/70 text-xs mb-1 ml-1 font-sans">他的生日</p>
                                                <input
                                                    title="他的生日"
                                                    type="text"
                                                    placeholder="♥♥♥♥ / ♥♥ / ♥♥"
                                                    value={formatToHearts(inputBoy)}
                                                    onChange={(e) => setInputBoy(handleHeartDateInput(e.target.value, inputBoy))}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center tracking-widest font-mono text-lg"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-white/70 text-xs mb-1 ml-1 font-sans">她的生日</p>
                                                <input
                                                    title="她的生日"
                                                    type="text"
                                                    placeholder="♥♥♥♥ / ♥♥ / ♥♥"
                                                    value={formatToHearts(inputGirl)}
                                                    onChange={(e) => setInputGirl(handleHeartDateInput(e.target.value, inputGirl))}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center tracking-widest font-mono text-lg"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-center mb-6">
                                                <h3 className="text-xl font-serif text-white tracking-widest">解锁回忆</h3>
                                                <p className="text-white/60 text-xs mt-2">请输入你的生日，决定你的视角。</p>
                                            </div>
                                            <div>
                                                <input
                                                    title="验证生日"
                                                    type="text"
                                                    placeholder="♥♥♥♥ / ♥♥ / ♥♥"
                                                    value={formatToHearts(inputBirthday)}
                                                    onChange={(e) => setInputBirthday(handleHeartDateInput(e.target.value, inputBirthday))}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleActionClick()}
                                                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary text-center tracking-widest shadow-inner font-mono text-xl"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Button */}
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, duration: 1.5 }} className="pb-20 z-10">
                        <button onClick={handleActionClick} className="px-8 py-4 rounded-[2rem] bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white text-xl md:text-2xl font-sans tracking-wide shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3">
                            {showLogin ? (isFirstTime ? "烙印我们的羁绊" : "验证身份") : "轻轻推开我们的世界"} <span className="text-red-400 animate-pulse">❤️</span>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
