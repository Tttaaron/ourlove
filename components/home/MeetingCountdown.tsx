"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Edit2, Check, Plane, CalendarHeart } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";

export function MeetingCountdown() {
    const { perspective } = useUser();

    // cityBoy and cityGirl represent the actual locations of the two people
    const [cityBoy, setCityBoy] = useState("成都");
    const [cityGirl, setCityGirl] = useState("重庆");
    const [meetingDate, setMeetingDate] = useState("2026-05-20T00:00");

    // Edits
    const [editBoy, setEditBoy] = useState(false);
    const [editGirl, setEditGirl] = useState(false);
    const [editDate, setEditDate] = useState(false);

    // Countdown state
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const storedBoy = localStorage.getItem("ourlove-city-boy");
        const storedGirl = localStorage.getItem("ourlove-city-girl");
        const storedDate = localStorage.getItem("ourlove-meeting-date");
        if (storedBoy) setCityBoy(storedBoy);
        if (storedGirl) setCityGirl(storedGirl);
        if (storedDate) setMeetingDate(storedDate);
    }, []);

    const saveCities = () => {
        localStorage.setItem("ourlove-city-boy", cityBoy);
        localStorage.setItem("ourlove-city-girl", cityGirl);
        setEditBoy(false);
        setEditGirl(false);
    };

    const saveDate = () => {
        localStorage.setItem("ourlove-meeting-date", meetingDate);
        setEditDate(false);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const target = new Date(meetingDate).getTime();
            const now = new Date().getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [meetingDate]);

    // Determine perspective labels
    const isBoy = perspective === "boy";

    // Left side is always "You are at" (the partner)
    const leftCity = isBoy ? cityGirl : cityBoy;
    const setLeftCity = isBoy ? setCityGirl : setCityBoy;
    const leftEdit = isBoy ? editGirl : editBoy;
    const setLeftEdit = isBoy ? setEditGirl : setEditBoy;

    // Right side is always "I am at" (the user)
    const rightCity = isBoy ? cityBoy : cityGirl;
    const setRightCity = isBoy ? setCityBoy : setCityGirl;
    const rightEdit = isBoy ? editBoy : editGirl;
    const setRightEdit = isBoy ? setEditBoy : setEditGirl;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto mb-16 relative mt-12 px-4"
        >
            <div className="glass-card p-8 md:p-12 rounded-[2rem] border border-primary/20 shadow-xl overflow-hidden relative group/widget">
                {/* Background decoration */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover/widget:bg-primary/20 group-hover/widget:scale-110"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover/widget:bg-blue-400/20 group-hover/widget:scale-110"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 relative z-10">

                    {/* Left Side (Partner) */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left flex-shrink-0">
                        <h3 className="text-sm font-sans opacity-80 mb-2 flex items-center justify-center md:justify-start gap-1.5 tracking-widest text-primary w-fit relative group/edit">
                            <MapPin className="w-4 h-4" /> 你在
                            {!leftEdit && (
                                <button title="编辑TA的地点" onClick={() => setLeftEdit(true)} className="opacity-0 group-hover/edit:opacity-100 ml-1 p-1 rounded-full hover:bg-primary/20 text-foreground/50 hover:text-primary transition-all">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                        </h3>
                        {leftEdit ? (
                            <div className="flex items-center gap-2">
                                <input title="TA的城市" type="text" value={leftCity} onChange={(e) => setLeftCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCities()} className="bg-background/40 backdrop-blur-md border border-primary/40 rounded-lg px-3 py-1 text-3xl font-bold w-full max-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary text-center md:text-left text-foreground" autoFocus />
                                <button title="保存" onClick={saveCities} className="p-1.5 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors">
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <h2 className="text-4xl md:text-5xl font-bold tracking-widest text-foreground/90">{leftCity}</h2>
                        )}
                    </div>

                    {/* Middle Connection & Countdown */}
                    <div className="flex flex-col items-center flex-1 w-full px-4">
                        <div className="flex items-center w-full justify-center mb-6">
                            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1 hidden md:block"></div>
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="px-4 text-primary">
                                <Plane className="w-8 h-8 opacity-60" />
                            </motion.div>
                            <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1 hidden md:block"></div>
                        </div>

                        <div className="text-center group/date relative min-h-[120px] flex flex-col justify-center">
                            <h4 className="text-sm font-sans tracking-widest opacity-70 mb-2 flex items-center justify-center gap-1">
                                <CalendarHeart className="w-4 h-4 text-primary" />
                                距离下次相逢还有
                                {!editDate && (
                                    <button title="编辑相见日期" onClick={() => setEditDate(true)} className="opacity-0 group-hover/date:opacity-100 ml-1 p-1 rounded-full hover:bg-primary/20 text-foreground/50 hover:text-primary transition-all">
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                            </h4>
                            {editDate ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mb-4">
                                    <input title="设置时间" type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="bg-background/40 backdrop-blur-md border border-primary/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground" autoFocus />
                                    <button title="保存日期" onClick={saveDate} className="p-2 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors">
                                        <Check className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="flex gap-4 justify-center items-end mt-2">
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-7xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-accent drop-shadow-[0_2px_10px_rgba(255,117,143,0.3)]">{timeLeft.days}</span>
                                        <span className="text-xs tracking-widest mt-2 opacity-60 font-medium">天</span>
                                    </div>
                                    <span className="text-3xl opacity-30 pb-4 md:pb-6">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-7xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-accent drop-shadow-[0_2px_10px_rgba(255,117,143,0.3)]">{String(timeLeft.hours).padStart(2, '0')}</span>
                                        <span className="text-xs tracking-widest mt-2 opacity-60 font-medium">时</span>
                                    </div>
                                    <span className="text-3xl opacity-30 pb-4 md:pb-6">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-7xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-accent drop-shadow-[0_2px_10px_rgba(255,117,143,0.3)]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                        <span className="text-xs tracking-widest mt-2 opacity-60 font-medium">分</span>
                                    </div>
                                    <div className="flex flex-col items-center ml-2 pb-1 md:pb-2">
                                        <span className="text-2xl md:text-3xl font-serif font-bold text-primary/80 drop-shadow-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        <span className="text-[10px] md:text-xs tracking-widest mt-1 opacity-50 font-medium">秒</span>
                                    </div>
                                </div>
                            )}

                            {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && !editDate && (
                                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-primary mt-4 font-serif text-xl">终于见面啦！紧紧拥抱吧 🫂💖</motion.p>
                            )}
                        </div>
                    </div>

                    {/* Right Side (User) */}
                    <div className="flex flex-col items-center md:items-end text-center md:text-right flex-shrink-0">
                        <h3 className="text-sm font-sans opacity-80 mb-2 flex items-center justify-center md:justify-end gap-1.5 tracking-widest text-primary w-fit relative group/edit">
                            {!rightEdit && (
                                <button title="编辑我的地点" onClick={() => setRightEdit(true)} className="opacity-0 group-hover/edit:opacity-100 mr-1 p-1 rounded-full hover:bg-primary/20 text-foreground/50 hover:text-primary transition-all">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                            我在 <MapPin className="w-4 h-4" />
                        </h3>
                        {rightEdit ? (
                            <div className="flex items-center gap-2">
                                <button title="保存" onClick={saveCities} className="p-1.5 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors">
                                    <Check className="w-4 h-4" />
                                </button>
                                <input title="我的城市" type="text" value={rightCity} onChange={(e) => setRightCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCities()} className="bg-background/40 backdrop-blur-md border border-primary/40 rounded-lg px-3 py-1 text-3xl font-bold w-full max-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary text-center md:text-right text-foreground" autoFocus />
                            </div>
                        ) : (
                            <h2 className="text-4xl md:text-5xl font-bold tracking-widest text-foreground/90">{rightCity}</h2>
                        )}
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
