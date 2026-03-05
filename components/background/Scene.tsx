"use client";

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useTheme } from "@/components/providers/theme-provider";
import { CherryBlossoms } from "@/components/background/CherryBlossoms";
import { StarrySky } from "@/components/background/StarrySky";
import { Suspense } from "react";

export function Scene() {
    const { theme } = useTheme();

    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <Suspense fallback={null}>
                    {theme === "pink-cherry" ? <CherryBlossoms /> : <StarrySky />}
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}
