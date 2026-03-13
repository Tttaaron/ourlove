"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scene } from "@/components/background/Scene";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
    Calendar, Filter, Search, Home as HomeIcon,
    Plus, Edit2, Trash2, Check, Upload,
    Cloud, CloudRain, CloudSun, Snowflake, Sun, MapPin, Tag, Heart, Sparkles
} from "lucide-react";
import Link from "next/link";
import {
    loadMemories,
    saveCache,
    addMemory as addMemoryToDb,
    updateMemory,
    updateMemoryImage,
    deleteMemory as deleteMemoryFromDb,
    uploadImage,
    type Memory,
} from "@/lib/memory-cache";

const WEATHER_OPTIONS = ["晴天", "多云", "阴天", "雨天", "雪天", "雾天"];
const MOOD_EMOJIS: Record<string, string> = {
    "快乐": "😊", "开心": "😊", "幸福": "🥰", "甜蜜": "💕",
    "思念": "🥺", "想念": "💭", "感动": "🥹", "期待": "✨",
    "平静": "😌", "感恩": "🙏", "兴奋": "🎉", "温馨": "🏠",
    "浪漫": "🌹", "不舍": "😢", "难过": "😔", "生气": "😤",
    "惊喜": "😲", "紧张": "😰", "放松": "😌",
};

// 默认记录人
const DEFAULT_AUTHOR = "他";

function getWeatherIcon(weather?: string) {
    if (!weather) return null;
    const iconClass = "w-4 h-4";
    switch (weather) {
        case "晴天": return <Sun className={iconClass + " text-yellow-500"} />;
        case "多云": return <CloudSun className={iconClass + " text-gray-400"} />;
        case "阴天": return <Cloud className={iconClass + " text-gray-500"} />;
        case "雨天": return <CloudRain className={iconClass + " text-blue-400"} />;
        case "雪天": return <Snowflake className={iconClass + " text-blue-200"} />;
        case "雾天": return <Cloud className={iconClass + " text-gray-300"} />;
        default: return <Cloud className={iconClass} />;
    }
}

export default function DiaryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterMood, setFilterMood] = useState<string>("all");
    const [viewPerspective, setViewPerspective] = useState<"boy" | "girl">("girl");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Memory>({
        date: "", title: "", description: "", img: "", mood: "",
        author: "他", weather: "", location: "", tags: ""
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Theme colors based on perspective
    const theme = useMemo(() => ({
        primary: viewPerspective === "girl" ? "primary" : "blue-500",
        primaryText: viewPerspective === "girl" ? "text-primary" : "text-blue-500",
        primaryBg: viewPerspective === "girl" ? "bg-primary" : "bg-blue-500",
        primaryBgLight: viewPerspective === "girl" ? "bg-primary/10" : "bg-blue-500/10",
        primaryBorder: viewPerspective === "girl" ? "border-primary/20" : "border-blue-500/20",
        primaryBorderFull: viewPerspective === "girl" ? "border-primary" : "border-blue-500",
        primaryShadow: viewPerspective === "girl" ? "rgba(255,117,143,0.5)" : "rgba(59,130,246,0.5)",
        gradient: viewPerspective === "girl"
            ? "from-primary/80 via-primary/30 to-transparent"
            : "from-blue-500/80 via-blue-500/30 to-transparent",
    }), [viewPerspective]);

    useEffect(() => {
        const loadData = async () => {
            const { memories: loaded } = await loadMemories();
            setMemories(loaded);
            setLoading(false);
        };
        loadData();
    }, []);

    const allMoods = [...new Set(memories.map(m => m.mood).filter(Boolean))];

    // Statistics
    const stats = useMemo(() => {
        const filtered = memories.filter(m =>
            (viewPerspective === "girl" && m.author === "她") ||
            (viewPerspective === "boy" && m.author === "他")
        );

        const moodCounts: Record<string, number> = {};
        filtered.forEach(m => {
            if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
        });

        const sortedDates = filtered.map(m => m.date).filter(Boolean).sort();
        let timeSpan = 0;
        if (sortedDates.length >= 2) {
            const first = new Date(sortedDates[0].replace(/\./g, "-"));
            const last = new Date(sortedDates[sortedDates.length - 1].replace(/\./g, "-"));
            timeSpan = Math.ceil(Math.abs(last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
        }

        return { total: filtered.length, moodCounts, timeSpan };
    }, [memories, viewPerspective]);

    // Filter + search + perspective
    const filtered = memories
        .filter(m => {
            const authorMatch = (viewPerspective === "girl" && m.author === "她") ||
                (viewPerspective === "boy" && m.author === "他");
            return authorMatch &&
                (filterMood === "all" || m.mood === filterMood) &&
                (search === "" || m.title.includes(search) || m.description.includes(search) || m.mood.includes(search));
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    // --- Edit ---
    const startEdit = (idx: number) => {
        const memory = filtered[idx];
        const originalIdx = memories.indexOf(memory);
        setEditingIndex(originalIdx);
        setEditForm({ ...memory });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({
            date: "", title: "", description: "", img: "", mood: "",
            author: "他", weather: "", location: "", tags: ""
        });
    };

    const saveEdit = async () => {
        if (editingIndex === null) return;
        const mem = memories[editingIndex];
        const updatedMemory: Memory = { ...editForm, id: mem.id };
        const updated = [...memories];
        updated[editingIndex] = updatedMemory;
        setMemories(updated);
        saveCache(updated);
        setEditingIndex(null);
        if (mem.id) {
            await updateMemory(updatedMemory);
            const currentMemImage = memories[editingIndex].img;
            if (editForm.img && editForm.img !== currentMemImage) {
                await updateMemoryImage(mem.id, editForm.img);
            }
        }
    };

    // --- Delete ---
    const handleDelete = async (idx: number) => {
        const memory = filtered[idx];
        const originalIdx = memories.indexOf(memory);
        if (originalIdx === -1) return;
        const updated = memories.filter((_, i) => i !== originalIdx);
        setMemories(updated);
        saveCache(updated);
        if (editingIndex === originalIdx) cancelEdit();
        if (memory.id) {
            await deleteMemoryFromDb(memory.id);
        }
    };

    // --- Add ---
    const startAdd = () => {
        const today = new Date().toLocaleDateString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit"
        }).replace(/\//g, ".");
        setEditForm({
            date: today,
            title: "",
            description: "",
            img: "",
            mood: "快乐",
            author: viewPerspective === "girl" ? "她" : "他",
            weather: "",
            location: "",
            tags: ""
        });
        setShowAddForm(true);
    };

    const saveAdd = async () => {
        if (!editForm.description.trim()) return;
        const newMem: Memory = { ...editForm, title: editForm.title || "写下标题 📝" };
        const updated = [...memories, newMem];
        setMemories(updated);
        saveCache(updated);
        setShowAddForm(false);
        setEditForm({
            date: "", title: "", description: "", img: "", mood: "",
            author: "他", weather: "", location: "", tags: ""
        });
        const saved = await addMemoryToDb(newMem);
        if (saved?.id) {
            setMemories(prev => prev.map(m => m === newMem ? { ...m, id: saved.id } : m));
        }
    };

    const cancelAdd = () => {
        setShowAddForm(false);
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        const parts = dateStr.split(".");
        if (parts.length === 3) return `${parts[0]}年${parts[1]}月${parts[2]}日`;
        return dateStr;
    };

    return (
        <>
            <Scene />
            <ThemeToggle />
            <main className="flex min-h-screen flex-col items-center pt-24 pb-12 px-4 md:px-0 z-10 relative">
                <div className="w-full max-w-3xl mb-12">
                    {/* Header & Controls */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row gap-4 justify-between items-center mb-10 border border-white/20 shadow-lg sticky top-6 z-40 backdrop-blur-xl">
                        <Link href="/home" className="p-3 rounded-full hover:bg-white/20 transition-all text-primary hover:shadow-md" title="返回主页">
                            <HomeIcon className="w-6 h-6" />
                        </Link>

                        <div className="flex items-center gap-4">
                            <h1 className={`text-3xl font-serif ${theme.primaryText} tracking-widest drop-shadow-sm font-bold`}>
                                {viewPerspective === "girl" ? "她的日记" : "他的日记"}
                            </h1>

                            {/* Perspective Toggle */}
                            <div className="flex glass-card rounded-full p-1 border border-white/20">
                                <button
                                    onClick={() => setViewPerspective("girl")}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewPerspective === "girl"
                                        ? "bg-primary text-white shadow-md"
                                        : "hover:bg-primary/10 text-foreground/70"
                                        }`}
                                >
                                    她
                                </button>
                                <button
                                    onClick={() => setViewPerspective("boy")}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewPerspective === "boy"
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "hover:bg-blue-500/10 text-foreground/70"
                                        }`}
                                >
                                    他
                                </button>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-3 items-center">
                            <div className="relative flex-1 md:w-56 group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within/search:text-primary transition-colors" />
                                <input
                                    title="搜索回忆"
                                    type="text"
                                    placeholder="搜索回忆..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative group/filter">
                                <select
                                    title="按心情筛选"
                                    value={filterMood}
                                    onChange={e => setFilterMood(e.target.value)}
                                    className="appearance-none bg-background/60 hover:bg-background/80 border border-primary/20 rounded-full pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer transition-all shadow-sm min-w-[120px]"
                                >
                                    <option value="all">所有心情</option>
                                    {allMoods.map(mood => (
                                        <option key={mood} value={mood}>{mood}</option>
                                    ))}
                                </select>
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within/filter:text-primary transition-colors pointer-events-none" />
                            </div>
                            <button
                                onClick={startAdd}
                                title="添加日记"
                                className={`p-3 rounded-full ${theme.primaryBg} text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5`}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Statistics Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card p-5 rounded-2xl mb-8 border ${theme.primaryBorder} backdrop-blur-xl`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${theme.primaryBgLight}`}>
                                    <Heart className={`w-5 h-5 ${theme.primaryText}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                    <p className="text-xs text-foreground/50">篇日记</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {Object.entries(stats.moodCounts).slice(0, 5).map(([mood, count]) => (
                                    <span
                                        key={mood}
                                        className={`text-xs px-2.5 py-1 rounded-full ${theme.primaryBgLight} ${theme.primaryBorder} border`}
                                    >
                                        {MOOD_EMOJIS[mood] || "✨"} {mood} {count}
                                    </span>
                                ))}
                            </div>

                            {stats.timeSpan > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${theme.primaryBgLight}`}>
                                        <Sparkles className={`w-5 h-5 ${theme.primaryText}`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stats.timeSpan}</p>
                                        <p className="text-xs text-foreground/50">天时光</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Add Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                className="mb-8 overflow-hidden"
                            >
                                <DiaryEditForm
                                    form={editForm}
                                    setForm={setEditForm}
                                    onSave={saveAdd}
                                    onCancel={cancelAdd}
                                    fileInputRef={fileInputRef}
                                    title="添加新日记"
                                    theme={theme}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex gap-2">
                                <div className={`w-3 h-3 rounded-full ${theme.primaryBg} animate-bounce`}></div>
                                <div className={`w-3 h-3 rounded-full ${theme.primaryBg} animate-bounce`} style={{ animationDelay: "0.2s" }}></div>
                                <div className={`w-3 h-3 rounded-full ${theme.primaryBg} animate-bounce`} style={{ animationDelay: "0.4s" }}></div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
                            <Calendar className={`w-12 h-12 mb-4 ${theme.primaryText}/30`} />
                            <p className="text-lg font-sans">
                                {viewPerspective === "girl" ? "她还没有写下回忆呢" : "他还没有写下回忆呢"}
                            </p>
                            <p className="text-sm mt-2 opacity-60">点击右上角 + 开始记录 ✨</p>
                        </div>
                    )}

                    {/* Timeline View */}
                    {!loading && filtered.length > 0 && (
                        <div className={`relative pl-6 md:pl-10 before:absolute before:inset-0 before:ml-6 md:before:ml-10 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-[3px] before:bg-gradient-to-b ${theme.gradient}`} style={{ ["--tw-shadow-color" as string]: theme.primaryShadow }}>
                            <AnimatePresence>
                                {filtered.map((memory, i) => {
                                    const originalIdx = memories.indexOf(memory);
                                    const isEditingThis = editingIndex === originalIdx;

                                    return (
                                        <motion.div
                                            key={`${memory.date}-${memory.title?.slice(0, 10)}-${originalIdx}`}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                            className="relative mb-14 pl-6 md:pl-14 group"
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute top-8 left-[-14px] md:left-[-18px] w-8 h-8 md:w-9 md:h-9 rounded-full bg-background border-[4px] ${theme.primaryBorderFull} z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-125`} style={{ boxShadow: `0 0 20px ${theme.primaryShadow}` }}>
                                                <div className={`w-2 h-2 md:w-2.5 md:h-2.5 ${theme.primaryBg} rounded-full shadow-sm`}></div>
                                            </div>

                                            {isEditingThis ? (
                                                <DiaryEditForm
                                                    form={editForm}
                                                    setForm={setEditForm}
                                                    onSave={saveEdit}
                                                    onCancel={cancelEdit}
                                                    onDelete={() => handleDelete(i)}
                                                    fileInputRef={fileInputRef}
                                                    title="编辑日记"
                                                    theme={theme}
                                                />
                                            ) : (
                                                <motion.div
                                                    layout
                                                    className="glass-card p-6 md:p-8 rounded-[2rem] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-500 border border-white/20 relative overflow-hidden backdrop-blur-xl group/card"
                                                >
                                                    {/* Author badge */}
                                                    <div className="absolute top-0 right-0 p-5">
                                                        <span className={`text-xs font-sans px-3 py-1.5 rounded-full border shadow-sm ${memory.author === "他"
                                                            ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                            : "bg-primary/10 border-primary/20 text-primary"
                                                            }`}>
                                                            by {memory.author}
                                                        </span>
                                                    </div>

                                                    {/* Date & mood */}
                                                    <div className={`flex flex-wrap items-center gap-2.5 mb-4 ${theme.primaryText}`}>
                                                        <Calendar className="w-5 h-5 opacity-80" />
                                                        <span className="font-serif text-lg tracking-wide">{formatDate(memory.date)}</span>
                                                        {memory.mood && (
                                                            <span className={`${theme.primaryBgLight} ${theme.primaryText} ${theme.primaryBorder} border text-xs px-2.5 py-0.5 rounded-full`}>
                                                                {MOOD_EMOJIS[memory.mood] || ""} {memory.mood}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Image */}
                                                    {memory.img && (
                                                        <div className="mb-5 rounded-2xl overflow-hidden shadow-md max-h-80 w-full bg-black/5 relative group/img">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={memory.img}
                                                                alt={memory.title || "回忆图片"}
                                                                className="w-full h-full object-cover rounded-2xl transition-transform duration-700 hover:scale-105"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Title */}
                                                    <h3 className="text-xl font-serif font-bold text-foreground mb-3 break-words">{memory.title}</h3>

                                                    {/* Weather, Location, Tags */}
                                                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-foreground/60">
                                                        {memory.weather && (
                                                            <div className="flex items-center gap-1.5">
                                                                {getWeatherIcon(memory.weather)}
                                                                <span>{memory.weather}</span>
                                                            </div>
                                                        )}
                                                        {memory.location && (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{memory.location}</span>
                                                            </div>
                                                        )}
                                                        {memory.tags && (
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <Tag className="w-4 h-4" />
                                                                {memory.tags.split(",").map((tag, idx) => (
                                                                    <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${theme.primaryBgLight}`}>
                                                                        #{tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="font-sans text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap break-words w-full overflow-hidden">
                                                        {memory.description}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 mt-6 pt-4 border-t border-primary/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                                        <button
                                                            onClick={() => startEdit(i)}
                                                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs ${theme.primaryBgLight} ${theme.primaryText} hover:${theme.primaryBg} hover:text-white transition-colors ${theme.primaryBorder} border`}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            编辑
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm("确定删除这条回忆吗？")) handleDelete(i);
                                                            }}
                                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors border border-destructive/20"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            删除
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            <div className="py-10 flex justify-center w-full">
                                <p className="text-sm font-sans opacity-50 tracking-widest text-center">
                                    我们目前的故事就讲到这里啦，未来还在继续 ✨
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

// --- Shared edit form component ---
function DiaryEditForm({
    form, setForm, onSave, onCancel, onDelete, fileInputRef, title, theme
}: {
    form: Memory;
    setForm: (f: Memory) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete?: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    title: string;
    theme: {
        primaryText: string;
        primaryBg: string;
        primaryBgLight: string;
        primaryBorder: string;
    };
}) {
    const [isUploading, setIsUploading] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/20 shadow-xl flex flex-col gap-5 text-foreground/90 backdrop-blur-xl"
        >
            <h3 className={`text-xl font-serif ${theme.primaryText} tracking-wider font-bold drop-shadow-sm`}>{title}</h3>

            <div>
                <label htmlFor="diary-title" className="text-xs opacity-70 mb-1.5 block font-medium">标题</label>
                <input
                    id="diary-title"
                    title="标题"
                    type="text"
                    placeholder="写下标题..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
            </div>

            <div>
                <label htmlFor="diary-description" className="text-xs opacity-70 mb-1.5 block font-medium">日记内容</label>
                <textarea
                    id="diary-description"
                    title="日记内容"
                    placeholder="写下你们的点滴..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] transition-all shadow-inner"
                />
            </div>

            <div>
                <label className="text-xs opacity-70 mb-1.5 block font-medium">照片 (可选)</label>
                <div className="flex items-center gap-3">
                    <input
                        title="上传图片文件"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        disabled={isUploading}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                try {
                                    setIsUploading(true);
                                    const publicUrl = await uploadImage(file);
                                    if (publicUrl) {
                                        setForm({ ...form, img: publicUrl });
                                    } else {
                                        alert("图片上传失败，请重试");
                                    }
                                } catch (error) {
                                    console.error("Upload failed", error);
                                    alert("上传出错");
                                } finally {
                                    setIsUploading(false);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }
                            }
                        }}
                    />
                    <button
                        title="上传图片"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 border border-dashed border-primary/30 rounded-xl p-3 text-sm text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                        <Upload className="w-4 h-4" />
                        {isUploading ? "正在上传..." : (form.img ? "已选图片(点击更改)" : "上传图片")}
                    </button>
                    {form.img && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-primary/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.img} alt="预览" className="w-full h-full object-cover" />
                            <div
                                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                                onClick={() => setForm({ ...form, img: "" })}
                                title="移除图片"
                            >
                                <Trash2 className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="diary-mood" className="text-xs opacity-70 mb-1.5 block font-medium">心情</label>
                    <input
                        id="diary-mood"
                        title="心情"
                        type="text"
                        value={form.mood}
                        placeholder="如：快乐，思念"
                        onChange={(e) => setForm({ ...form, mood: e.target.value })}
                        className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                    />
                </div>
                <div>
                    <label htmlFor="diary-author" className="text-xs opacity-70 mb-1.5 block font-medium">记录人</label>
                    <select
                        id="diary-author"
                        title="记录人"
                        value={form.author}
                        onChange={(e) => setForm({ ...form, author: e.target.value })}
                        className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all shadow-inner cursor-pointer"
                    >
                        <option value="他">by 他</option>
                        <option value="她">by 她</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="diary-date" className="text-xs opacity-70 mb-1.5 block font-medium">日期</label>
                <input
                    id="diary-date"
                    title="日期"
                    type="text"
                    placeholder="YYYY.MM.DD"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
            </div>

            {/* Weather, Location, Tags */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="diary-weather" className="text-xs opacity-70 mb-1.5 block font-medium">天气</label>
                    <select
                        id="diary-weather"
                        title="天气"
                        value={form.weather || ""}
                        onChange={(e) => setForm({ ...form, weather: e.target.value })}
                        className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all shadow-inner cursor-pointer"
                    >
                        <option value="">选择天气</option>
                        {WEATHER_OPTIONS.map(w => (
                            <option key={w} value={w}>{w}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="diary-location" className="text-xs opacity-70 mb-1.5 block font-medium">地点</label>
                    <input
                        id="diary-location"
                        title="地点"
                        type="text"
                        value={form.location || ""}
                        placeholder="如：成都"
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                    />
                </div>
                <div>
                    <label htmlFor="diary-tags" className="text-xs opacity-70 mb-1.5 block font-medium">标签</label>
                    <input
                        id="diary-tags"
                        title="标签"
                        type="text"
                        value={form.tags || ""}
                        placeholder="逗号分隔"
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-4">
                {onDelete ? (
                    <button
                        title="删除回忆"
                        onClick={() => { if (confirm("确定删除？")) onDelete(); }}
                        className="p-2.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                ) : <div />}
                <div className="flex gap-3">
                    <button title="取消" disabled={isUploading} onClick={onCancel} className="px-5 py-2.5 rounded-full bg-muted/60 text-foreground hover:bg-muted font-medium transition-all shadow-sm disabled:opacity-50">
                        取消
                    </button>
                    <button title="保存" disabled={isUploading} onClick={onSave} className={`px-6 py-2.5 rounded-full ${theme.primaryBg} text-white hover:opacity-90 font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}>
                        <Check className="w-4 h-4" /> {isUploading ? "请等待" : "保存"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
