"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scene } from "@/components/background/Scene";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
    Calendar, Filter, Search, Home as HomeIcon,
    Plus, Edit2, Trash2, Check, X, Upload
} from "lucide-react";
import Link from "next/link";

interface Memory {
    img: string;
    text: string;
    date: string;
    mood: string;
    author: string;
}

const STORAGE_KEY = "ourlove-memories";

function loadMemories(): Memory[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((p: any) => ({
                    img: p.img || "",
                    text: p.text || "",
                    date: p.date || "",
                    mood: p.mood || "未知",
                    author: p.author || "佚名",
                }));
            }
        }
    } catch { }
    return [];
}

function saveMemoriesToStorage(memories: Memory[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch {
        alert("存储空间不足！请尽量上传小图片。");
    }
}

export default function DiaryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterMood, setFilterMood] = useState<string>("all");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Memory>({ img: "", text: "", date: "", mood: "", author: "他" });
    const [showAddForm, setShowAddForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const data = loadMemories();
        setMemories(data);
        setLoading(false);
    }, []);

    // Derive unique moods for the filter dropdown
    const allMoods = [...new Set(memories.map(m => m.mood).filter(Boolean))];

    // Filter + search
    const filtered = memories
        .filter(m =>
            (filterMood === "all" || m.mood === filterMood) &&
            (search === "" || m.text.includes(search) || m.mood.includes(search) || m.author.includes(search))
        )
        // Sort by date descending (format YYYY.MM.DD)
        .sort((a, b) => b.date.localeCompare(a.date));

    const updateMemories = (newMemories: Memory[]) => {
        setMemories(newMemories);
        saveMemoriesToStorage(newMemories);
    };

    // --- Edit ---
    const startEdit = (idx: number) => {
        // Find the original index in unsorted/unfiltered array
        const memory = filtered[idx];
        const originalIdx = memories.indexOf(memory);
        setEditingIndex(originalIdx);
        setEditForm({ ...memory });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ img: "", text: "", date: "", mood: "", author: "他" });
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        const updated = [...memories];
        updated[editingIndex] = { ...editForm };
        updateMemories(updated);
        setEditingIndex(null);
    };

    // --- Delete ---
    const handleDelete = (idx: number) => {
        const memory = filtered[idx];
        const originalIdx = memories.indexOf(memory);
        if (originalIdx === -1) return;
        const updated = memories.filter((_, i) => i !== originalIdx);
        updateMemories(updated);
        if (editingIndex === originalIdx) cancelEdit();
    };

    // --- Add ---
    const startAdd = () => {
        const today = new Date().toLocaleDateString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit"
        }).replace(/\//g, ".");
        setEditForm({ img: "", text: "", date: today, mood: "快乐", author: "他" });
        setShowAddForm(true);
    };

    const saveAdd = () => {
        if (!editForm.text.trim()) return;
        const updated = [...memories, { ...editForm }];
        updateMemories(updated);
        setShowAddForm(false);
        setEditForm({ img: "", text: "", date: "", mood: "", author: "他" });
    };

    const cancelAdd = () => {
        setShowAddForm(false);
    };

    // --- Image upload ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX = 800;
                let w = img.width, h = img.height;
                if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
                else if (h > MAX) { w *= MAX / h; h = MAX; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
                setEditForm(prev => ({ ...prev, img: canvas.toDataURL("image/jpeg", 0.6) }));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Format date for display: "2024.02.14" -> "2024年02月14日"
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

                        <h1 className="text-3xl font-serif text-primary tracking-widest hidden md:block drop-shadow-sm font-bold">时光日记</h1>

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
                                className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

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
                                    onImageUpload={handleImageUpload}
                                    fileInputRef={fileInputRef}
                                    title="添加新日记"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary animate-bounce"></div>
                                <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
                            <Calendar className="w-12 h-12 mb-4 text-primary/30" />
                            <p className="text-lg font-sans">还没有回忆呢</p>
                            <p className="text-sm mt-2 opacity-60">去首页添加你们的第一条回忆吧 ✨</p>
                        </div>
                    )}

                    {/* Timeline View */}
                    {!loading && filtered.length > 0 && (
                        <div className="relative pl-6 md:pl-10 before:absolute before:inset-0 before:ml-6 md:before:ml-10 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-[3px] before:bg-gradient-to-b before:from-primary/80 before:via-primary/30 before:to-transparent before:shadow-[0_0_10px_rgba(255,117,143,0.5)]">
                            <AnimatePresence>
                                {filtered.map((memory, i) => {
                                    const originalIdx = memories.indexOf(memory);
                                    const isEditingThis = editingIndex === originalIdx;

                                    return (
                                        <motion.div
                                            key={`${memory.date}-${memory.text.slice(0, 10)}-${originalIdx}`}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                            className="relative mb-14 pl-8 md:pl-14 group"
                                        >
                                            {/* Timeline Dot */}
                                            <div className="absolute top-8 left-[-16px] md:left-[-18px] w-9 h-9 rounded-full bg-background border-[4px] border-primary shadow-[0_0_20px_rgba(255,117,143,0.6)] z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
                                                <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-sm"></div>
                                            </div>

                                            {isEditingThis ? (
                                                <DiaryEditForm
                                                    form={editForm}
                                                    setForm={setEditForm}
                                                    onSave={saveEdit}
                                                    onCancel={cancelEdit}
                                                    onDelete={() => handleDelete(i)}
                                                    onImageUpload={handleImageUpload}
                                                    fileInputRef={fileInputRef}
                                                    title="编辑日记"
                                                />
                                            ) : (
                                                <motion.div
                                                    layout
                                                    className="glass-card p-6 md:p-8 rounded-[2rem] hover:shadow-[0_15px_40px_rgba(255,117,143,0.15)] transition-all duration-500 border border-white/20 relative overflow-hidden backdrop-blur-xl group/card"
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
                                                    <div className="flex items-center gap-2.5 mb-5 text-primary">
                                                        <Calendar className="w-5 h-5 opacity-80" />
                                                        <span className="font-serif text-lg tracking-wide">{formatDate(memory.date)}</span>
                                                        {memory.mood && (
                                                            <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full ml-1">
                                                                {memory.mood}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <p className="font-sans text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap">
                                                        {memory.text}
                                                    </p>

                                                    {/* Image */}
                                                    {memory.img && (
                                                        <div className="mt-5 rounded-2xl overflow-hidden border border-white/10 shadow-sm relative group/img">
                                                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
                                                            <img
                                                                src={memory.img}
                                                                alt="回忆照片"
                                                                className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-700 ease-out"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 mt-6 pt-4 border-t border-primary/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                                        <button
                                                            onClick={() => startEdit(i)}
                                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/20"
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
    form, setForm, onSave, onCancel, onDelete, onImageUpload, fileInputRef, title
}: {
    form: Memory;
    setForm: (f: Memory) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete?: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: any; // Fix for type issue
    title: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/20 shadow-xl flex flex-col gap-5 text-foreground/90 backdrop-blur-xl"
        >
            <h3 className="text-xl font-serif text-primary tracking-wider font-bold drop-shadow-sm">{title}</h3>

            <div>
                <label htmlFor="diary-text" className="text-xs opacity-70 mb-1.5 block font-medium">回忆文案</label>
                <textarea
                    id="diary-text"
                    title="回忆文案"
                    placeholder="写下你们的点滴..."
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    className="w-full bg-background/60 hover:bg-background/80 border border-primary/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] transition-all shadow-inner"
                />
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

            <div>
                <label htmlFor="file-upload" className="text-xs opacity-70 mb-1.5 block font-medium">上传照片</label>
                <input id="file-upload" title="上传照片" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onImageUpload} />
                <button
                    title="选择本地图片"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-background/60 hover:bg-background/80 border border-primary/30 hover:border-primary/60 transition-all rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-primary shadow-sm group"
                >
                    <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-medium">{form.img && form.img.startsWith("data:image") ? "已选择 (点击更换)" : "选择本地图片"}</span>
                </button>
                {form.img && (
                    <div className="mt-3 rounded-xl overflow-hidden max-h-40 border border-primary/20 shadow-sm relative group/preview">
                        <img src={form.img} alt="预览" className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 bg-primary/10 pointer-events-none"></div>
                    </div>
                )}
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
                    <button title="取消" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-muted/60 text-foreground hover:bg-muted font-medium transition-all shadow-sm">
                        取消
                    </button>
                    <button title="保存" onClick={onSave} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> 保存
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
