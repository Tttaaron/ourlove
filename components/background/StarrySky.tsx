"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StarrySky() {
    const count = 1000;
    const particles = useRef<THREE.InstancedMesh>(null);
    const tempObject = new THREE.Object3D();

    const [positions, phases] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const phs = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;     // x
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5; // z

            phs[i] = Math.random() * Math.PI * 2;        // twinkling phase
        }
        return [pos, phs];
    }, [count]);

    const geometry = useMemo(() => new THREE.CircleGeometry(0.05, 8), []);
    const material = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.8
    }), []);

    useFrame((state) => {
        if (!particles.current) return;

        for (let i = 0; i < count; i++) {
            tempObject.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

            // Calculate twinkling scale
            const scale = 0.5 + Math.sin(state.clock.elapsedTime * 2 + phases[i]) * 0.5;
            tempObject.scale.set(scale, scale, scale);

            tempObject.updateMatrix();
            particles.current.setMatrixAt(i, tempObject.matrix);
        }
        particles.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={particles} args={[geometry, material, count]} />
    );
}
