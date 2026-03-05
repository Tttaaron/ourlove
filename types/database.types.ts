export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            diaries: {
                Row: {
                    id: string
                    created_at: string
                    content: string
                    author: 'yours' | 'mine' // 他/她
                    mood: string // 心情标签
                    date: string
                    media_urls: string[] | null // 照片多图/视频
                    audio_url: string | null // 语音
                    location: string | null // 位置
                }
                Insert: {
                    id?: string
                    created_at?: string
                    content: string
                    author: 'yours' | 'mine'
                    mood?: string
                    date?: string
                    media_urls?: string[] | null
                    audio_url?: string | null
                    location?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    content?: string
                    author?: 'yours' | 'mine'
                    mood?: string
                    date?: string
                    media_urls?: string[] | null
                    audio_url?: string | null
                    location?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    start_date: string // 恋爱开始日期
                    city_yours: string
                    city_mine: string
                }
                Insert: {
                    id: string
                    start_date?: string
                    city_yours?: string
                    city_mine?: string
                }
                Update: {
                    id?: string
                    start_date?: string
                    city_yours?: string
                    city_mine?: string
                }
            }
        }
    }
}
