/**
 * 统一的 Memory 数据缓存管理
 * 解决 diary/page.tsx 和 MemoryCard.tsx 之间的数据冲突问题
 */

import {
    getMemories as getSupabaseMemories,
    addMemory as addSupabaseMemory,
    updateMemory as updateSupabaseMemory,
    deleteMemory as deleteSupabaseMemory,
    addMemoryImage,
    uploadImage as supabaseUploadImage,
    type MemoryRow,
} from "@/lib/supabase/data";
import { compressImage } from "@/lib/image-compress";

// 统一的 Memory 数据结构
export interface Memory {
    id?: number;
    date: string;
    title: string;
    description: string;
    img: string; // 完整的图片 URL
    mood: string;
    author: string;
    weather: string;
    location: string;
    tags: string;
}

const STORAGE_KEY = "ourlove-memories-v2";
const CACHE_VERSION = 2;

interface CacheData {
    version: number;
    timestamp: number;
    memories: Memory[];
}

// 从 localStorage 加载缓存
function loadCache(): Memory[] | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed: CacheData = JSON.parse(stored);
            // 检查版本，如果不匹配则忽略旧缓存
            if (parsed.version === CACHE_VERSION && Array.isArray(parsed.memories)) {
                return parsed.memories;
            }
        }
    } catch { }
    return null;
}

// 保存到 localStorage
export function saveCache(memories: Memory[]): void {
    if (typeof window === "undefined") return;
    try {
        const cacheData: CacheData = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            memories,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch { }
}

// 清除旧缓存
export function clearOldCache(): void {
    if (typeof window === "undefined") return;
    try {
        // 删除旧版本的缓存 key
        localStorage.removeItem("ourlove-memories");
    } catch { }
}

// 将 Supabase 数据转换为统一的 Memory 结构
function mapSupabaseToMemory(r: MemoryRow): Memory {
    return {
        id: r.id,
        date: r.date || "",
        title: r.title || "写下标题 📝",
        description: r.description || "",
        // images[0].filename 已经是完整的 public URL
        img: r.images && r.images.length > 0 ? r.images[0].filename : "",
        mood: r.mood || "未知",
        author: r.author || "他",
        weather: r.weather || "",
        location: r.location || "",
        tags: r.tags || "",
    };
}

// 加载所有 memories（先从缓存，再从 Supabase）
export async function loadMemories(): Promise<{ memories: Memory[]; fromCache: boolean }> {
    // 1. 先尝试从缓存加载
    const cached = loadCache();
    if (cached && cached.length > 0) {
        // 异步刷新缓存，但不阻塞返回
        refreshCacheFromSupabase();
        return { memories: cached, fromCache: true };
    }

    // 2. 从 Supabase 加载
    const remote = await getSupabaseMemories();
    if (remote.length > 0) {
        const mapped = remote.map(mapSupabaseToMemory);
        saveCache(mapped);
        clearOldCache();
        return { memories: mapped, fromCache: false };
    }

    return { memories: [], fromCache: false };
}

// 后台刷新缓存
let refreshPromise: Promise<void> | null = null;

async function refreshCacheFromSupabase(): Promise<void> {
    // 防止重复刷新
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const remote = await getSupabaseMemories();
            if (remote.length > 0) {
                const mapped = remote.map(mapSupabaseToMemory);
                saveCache(mapped);
            }
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// 添加 memory
export async function addMemory(memory: Omit<Memory, "id">): Promise<Memory | null> {
    const saved = await addSupabaseMemory({
        date: memory.date,
        title: memory.title,
        description: memory.description,
        mood: memory.mood,
        author: memory.author,
        weather: memory.weather,
        location: memory.location,
        tags: memory.tags,
    });

    if (saved?.id) {
        const newMemory: Memory = {
            ...memory,
            id: saved.id,
        };

        // 如果有图片，保存到 memory_images
        if (memory.img) {
            await addMemoryImage(saved.id, memory.img);
        }

        return newMemory;
    }
    return null;
}

// 更新 memory
export async function updateMemory(memory: Memory): Promise<boolean> {
    if (!memory.id) return false;

    const success = await updateSupabaseMemory(memory.id, {
        date: memory.date,
        title: memory.title,
        description: memory.description,
        mood: memory.mood,
        author: memory.author,
        weather: memory.weather,
        location: memory.location,
        tags: memory.tags,
    });

    return success;
}

// 更新 memory 的图片
export async function updateMemoryImage(memoryId: number, imageUrl: string): Promise<boolean> {
    const result = await addMemoryImage(memoryId, imageUrl);
    return result !== null;
}

// 删除 memory
export async function deleteMemory(id: number): Promise<boolean> {
    return deleteSupabaseMemory(id);
}

// 带压缩的上传图片
export async function uploadImage(file: File): Promise<string | null> {
    try {
        // 先检查并压缩图片
        const { file: processedFile, wasCompressed, originalSize, compressedSize } = await compressImage(file);

        if (wasCompressed) {
            console.log(`图片已压缩: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
        }

        // 上传到 Supabase
        return await supabaseUploadImage(processedFile);
    } catch (error) {
        console.error('Image upload error:', error);
        return null;
    }
}
