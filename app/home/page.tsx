import { Scene } from "@/components/background/Scene";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MeetingCountdown } from "@/components/home/MeetingCountdown";
import { DayCounter } from "@/components/home/DayCounter";
import { MemoryCard } from "@/components/home/MemoryCard";
import Link from "next/link";
import { BookHeart } from "lucide-react";

export default function Home() {
    return (
        <>
            <Scene />
            <ThemeToggle />
            <main className="flex min-h-screen flex-col items-center justify-start pt-24 px-6 md:px-24 z-10 relative pb-20">
                <MeetingCountdown />

                <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-center justify-center">
                    <div className="flex-1 w-full">
                        <DayCounter />
                    </div>
                    <div className="flex-1 w-full">
                        <MemoryCard />
                    </div>
                </div>

                <Link href="/diary" className="mt-12 group relative">
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-700"></div>
                    <div className="relative px-8 py-4 glass-card rounded-full flex items-center gap-3 hover:-translate-y-2 transition-transform duration-500 border border-primary/40 shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out -translate-x-full z-0"></div>
                        <BookHeart className="w-6 h-6 text-primary z-10" />
                        <span className="text-xl font-sans tracking-wide font-medium z-10">打开我们的时光日记</span>
                    </div>
                </Link>
            </main>
        </>
    );
}
