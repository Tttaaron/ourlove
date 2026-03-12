import { supabase } from "./client";

// ==================== Config (key-value store) ====================

export async function getConfig(key: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from("config")
            .select("value")
            .eq("key", key)
            .single();
        if (error || !data) return null;
        return data.value;
    } catch {
        return null;
    }
}

export async function setConfig(key: string, value: string): Promise<void> {
    try {
        await supabase
            .from("config")
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    } catch (e) {
        console.warn("setConfig failed:", e);
    }
}

export async function getAllConfig(): Promise<Record<string, string>> {
    try {
        const { data, error } = await supabase.from("config").select("key, value");
        if (error || !data) return {};
        const result: Record<string, string> = {};
        data.forEach((row: any) => { result[row.key] = row.value; });
        return result;
    } catch {
        return {};
    }
}

// ==================== Memories (diary entries) ====================

export interface MemoryImageRow {
    id?: number;
    memory_id: number;
    filename: string;
    original_name?: string;
}

export interface MemoryRow {
    id?: number;
    date: string;
    title?: string;
    description?: string;
    mood: string;
    author: string;
    weather?: string;
    location?: string;
    tags?: string;
    created_at?: string;
    // Joined from memory_images
    images?: MemoryImageRow[];
}

export async function getMemories(): Promise<MemoryRow[]> {
    try {
        const { data, error } = await supabase
            .from("memories")
            .select("*, memory_images(*)")
            .order("date", { ascending: false });
        if (error || !data) return [];
        return data.map((row: any) => ({
            ...row,
            images: row.memory_images || [],
        }));
    } catch {
        return [];
    }
}

export async function addMemory(memory: Omit<MemoryRow, "id" | "created_at" | "images">): Promise<MemoryRow | null> {
    try {
        const { data, error } = await supabase
            .from("memories")
            .insert({
                date: memory.date,
                title: memory.title || "写下标题 📝",
                description: memory.description || "",
                mood: memory.mood || "",
                author: memory.author || "他",
                weather: memory.weather || "",
                location: memory.location || "",
                tags: memory.tags || "",
            })
            .select()
            .single();
        if (error) { console.warn("addMemory error:", error); return null; }
        return data;
    } catch {
        return null;
    }
}

export async function updateMemory(id: number, updates: Partial<MemoryRow>): Promise<boolean> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { images, ...dbUpdates } = updates;
        const { error } = await supabase
            .from("memories")
            .update(dbUpdates)
            .eq("id", id);
        return !error;
    } catch {
        return false;
    }
}

export async function deleteMemory(id: number): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("memories")
            .delete()
            .eq("id", id);
        return !error;
    } catch {
        return false;
    }
}

// ==================== Memory Images ====================

export async function addMemoryImage(memoryId: number, filename: string, originalName?: string): Promise<MemoryImageRow | null> {
    try {
        const { data, error } = await supabase
            .from("memory_images")
            .insert({ memory_id: memoryId, filename, original_name: originalName || filename })
            .select()
            .single();
        if (error) { console.warn("addMemoryImage error:", error); return null; }
        return data;
    } catch {
        return null;
    }
}

export async function deleteMemoryImage(id: number): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("memory_images")
            .delete()
            .eq("id", id);
        return !error;
    } catch {
        return false;
    }
}

export async function getMemoryImages(memoryId: number): Promise<MemoryImageRow[]> {
    try {
        const { data, error } = await supabase
            .from("memory_images")
            .select("*")
            .eq("memory_id", memoryId);
        if (error || !data) return [];
        return data;
    } catch {
        return [];
    }
}
