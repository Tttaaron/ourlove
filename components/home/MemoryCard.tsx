"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Image as ImageIcon, Edit2, Check, Plus, Trash2, Upload } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import {
    getMemories as getSupabaseMemories,
    addMemory as addSupabaseMemory,
    updateMemory as updateSupabaseMemory,
    deleteMemory as deleteSupabaseMemory,
} from "@/lib/supabase/data";

export function MemoryCard() {
    const { perspective } = useUser();

    const [memories, setMemories] = useState<any[]>([]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editForm, setEditForm] = useState({ img: "", text: "", date: "", mood: "开心", author: "他" });
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        // 1. 先从 localStorage 快速加载
        const stored = localStorage.getItem("ourlove-memories");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setMemories(parsed.map((p: any) => ({
                        ...p,
                        mood: p.mood || "未知",
                        author: p.author || "佚名"
                    })));
                }
            } catch (e) { }
        }

        // 2. 异步从 Supabase 加载
        const loadFromSupabase = async () => {
            const remote = await getSupabaseMemories();
            if (remote.length > 0) {
                const mapped = remote.map(r => ({
                    id: r.id,
                    img: r.img || "",
                    text: r.text || "",
                    date: r.date || "",
                    mood: r.mood || "未知",
                    author: r.author || "佚名",
                }));
                setMemories(mapped);
                try { localStorage.setItem("ourlove-memories", JSON.stringify(mapped)); } catch { }
            }
        };
        loadFromSupabase();
    }, []);

    const saveMemories = (newMemories: any[]) => {
        setMemories(newMemories);
        try {
            localStorage.setItem("ourlove-memories", JSON.stringify(newMemories));
        } catch { }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setTimeout(() => {
            if (memories.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % memories.length);
            }
        }, 300);
    };

    const startEdit = () => {
        if (memories[currentIndex]) {
            setEditForm(memories[currentIndex]);
            setIsEditing(true);
            setIsAddingNew(false);
            setIsFlipped(false);
        }
    };

    const handleSave = async () => {
        let updated = [...memories];
        if (isAddingNew) {
            updated = [editForm, ...updated];
            setCurrentIndex(0);
            saveMemories(updated);
            // 同步到 Supabase
            const saved = await addSupabaseMemory({
                text: editForm.text, date: editForm.date,
                mood: editForm.mood, author: editForm.author, img: editForm.img,
            });
            if (saved?.id) {
                setMemories(prev => prev.map((m, i) => i === 0 ? { ...m, id: saved.id } : m));
            }
        } else {
            updated[currentIndex] = editForm;
            saveMemories(updated);
            // 同步到 Supabase
            const mem = memories[currentIndex];
            if (mem.id) {
                await updateSupabaseMemory(mem.id, {
                    text: editForm.text, date: editForm.date,
                    mood: editForm.mood, author: editForm.author, img: editForm.img,
                });
            }
        }
        setIsEditing(false);
        setIsAddingNew(false);
    };

    const handleAdd = () => {
        const newMemory = { img: "", text: "新的美好回忆 ✨", date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.'), mood: "期待", author: perspective === "girl" ? "她" : "他" };
        setEditForm(newMemory);
        setIsAddingNew(true);
        setIsEditing(true);
        setIsFlipped(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsAddingNew(false);
    };

    const handleDelete = async () => {
        if (isAddingNew) {
            handleCancel();
            return;
        }
        const mem = memories[currentIndex];
        const updated = memories.filter((_, i) => i !== currentIndex);
        saveMemories(updated);
        setCurrentIndex(0);
        setIsEditing(false);
        // 同步到 Supabase
        if (mem?.id) {
            await deleteSupabaseMemory(mem.id);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
                setEditForm({ ...editForm, img: dataUrl });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    if (!mounted) {
        return (
            <div className="w-full max-w-md mx-auto my-8 perspective-1000 h-[450px]">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="h-6 w-32 bg-primary/20 rounded animate-pulse"></div>
                </div>
                <div className="w-full h-[380px] rounded-[2rem] bg-muted/10 animate-pulse border border-white/10"></div>
            </div>
        );
    }

    const currentMemory = memories[currentIndex];

    return (
        <div className="w-full max-w-md mx-auto my-8 perspective-1000 h-[450px]">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-serif tracking-widest text-primary drop-shadow-md">今日随机回忆</h3>
                <div className="flex gap-2">
                    <button onClick={handleAdd} title="添加回忆" className="p-2 rounded-full hover:bg-white/10 transition-colors text-foreground/60 hover:text-primary z-20">
                        <Plus className="w-5 h-5" />
                    </button>
                    {!isEditing && memories.length > 1 && (
                        <button onClick={handleNext} title="换一个" className="p-2 rounded-full hover:bg-white/10 transition-colors text-foreground/60 hover:text-primary z-20">
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-[2rem] p-6 border border-primary/30 shadow-xl flex flex-col gap-4 text-foreground/90 h-[380px] overflow-y-auto w-full">
                    <div>
                        <label className="text-xs opacity-70 mb-1 block">回忆文案</label>
                        <textarea value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} className="w-full bg-background/50 border border-primary/20 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[50px]" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="mood-input" className="text-xs opacity-70 mb-1 block">心情</label>
                            <input id="mood-input" title="输入心情" type="text" value={editForm.mood} placeholder="如：快乐，思念" onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })} className="w-full bg-background/50 border border-primary/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="author-select" className="text-xs opacity-70 mb-1 block">记录人</label>
                            <select id="author-select" title="选择记录人" value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} className="w-full bg-background/50 border border-primary/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                <option value="他">by 他</option>
                                <option value="她">by 她</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="date-input" className="text-xs opacity-70 mb-1 block">日期</label>
                            <input id="date-input" title="输入日期" placeholder="YYYY.MM.DD" type="text" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full bg-background/50 border border-primary/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>

                        <div>
                            <label htmlFor="file-upload" className="text-xs opacity-70 mb-1 block text-transparent">.</label>
                            <input id="file-upload" type="file" title="上传回忆照片" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                            <button onClick={() => fileInputRef.current?.click()} title="点击上传照片" className="w-full flex items-center justify-center gap-2 bg-background/50 border border-primary/20 hover:border-primary/50 transition-colors rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-primary overflow-hidden whitespace-nowrap text-ellipsis">
                                <Upload className="w-4 h-4 shrink-0" />
                                {editForm.img && editForm.img.startsWith('data:image') ? '已选择' : '上传图片'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between mt-auto pt-2">
                        <button onClick={handleDelete} title="删除" className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="px-4 py-2 rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">取消</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors text-sm flex items-center gap-1">
                                <Check className="w-4 h-4" /> 保存
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : memories.length === 0 ? (
                <div className="relative w-full h-[380px] group/card">
                    <div className="absolute inset-0 glass-card rounded-[2rem] flex flex-col items-center justify-center p-6 border border-white/20 shadow-xl overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary/40 group-hover/card:scale-110 group-hover/card:text-primary/60 transition-all duration-500">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <p className="text-foreground/50 text-sm mb-6 text-center leading-relaxed">
                            还没有回忆呢<br />去添加你们的第一条回忆吧 ✨
                        </p>
                        <button onClick={handleAdd} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 text-sm flex items-center gap-2 group">
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 添加回忆
                        </button>
                    </div>
                </div>
            ) : currentMemory ? (
                <div className="relative w-full h-[380px] group/card">
                    {/* The 3D flip container */}
                    <motion.div
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 glass-card rounded-[2rem] flex flex-col items-center justify-center p-6 border border-white/20 shadow-xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                            <div className="absolute top-6 left-6 z-20 flex gap-2">
                                {currentMemory.mood && (
                                    <span className="bg-primary/20 text-primary backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-primary/30 shadow-sm">{currentMemory.mood}</span>
                                )}
                                {currentMemory.author && (
                                    <span className="bg-blue-400/20 text-blue-500 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-blue-400/30 shadow-sm">by {currentMemory.author}</span>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0"></div>
                            {currentMemory.img ? (
                                <img src={currentMemory.img} alt="Memory" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-110 object-center" />
                            ) : (
                                <ImageIcon className="w-16 h-16 text-primary/40 mb-4 z-10" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                            <div className="absolute bottom-6 left-6 right-6 z-20">
                                <p className="text-white/80 text-sm font-sans tracking-widest">{currentMemory.date}</p>
                                <p className="text-white text-xl font-serif mt-1">点我翻转回忆 ✨</p>
                            </div>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 text-center border border-primary/30 shadow-[0_0_30px_rgba(255,105,180,0.2)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--card)" }}>
                            <p className="text-2xl font-serif text-primary leading-relaxed drop-shadow-sm whitespace-pre-wrap">
                                "{currentMemory.text}"
                            </p>
                            <p className="mt-8 text-sm font-sans tracking-widest opacity-60">那天的风很高，你很甜。</p>
                        </div>
                    </motion.div>

                    {/* Overlay Edit Button (outside 3D container so it is easily clickble) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); startEdit(); }}
                        title="编辑回忆"
                        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 text-white opacity-0 group-hover/card:opacity-100 hover:bg-black/60 transition-all backdrop-blur-md"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
