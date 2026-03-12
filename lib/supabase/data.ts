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

export interface MemoryRow {
    id?: string;
    date: string;
    title: string;
    description: string;
    mood: string;
    author: string;
    weather: string;
    location: string;
    tags: string;
    created_at?: string;
}

export async function getMemories(): Promise<MemoryRow[]> {
    try {
        const { data, error } = await supabase
            .from("memories")
            .select("*")
            .order("date", { ascending: false });
        if (error || !data) return [];
        return data;
    } catch {
        return [];
    }
}

export async function addMemory(memory: Omit<MemoryRow, "id" | "created_at">): Promise<MemoryRow | null> {
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

export async function updateMemory(id: string, updates: Partial<MemoryRow>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("memories")
            .update(updates)
            .eq("id", id);
        return !error;
    } catch {
        return false;
    }
}

export async function deleteMemory(id: string): Promise<boolean> {
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
