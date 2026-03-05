"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Generate a realistic petal texture using Canvas
const createPetalTexture = () => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, 128, 128);

        ctx.beginPath();
        // Base of the petal
        ctx.moveTo(64, 115);
        // Left curve
        ctx.bezierCurveTo(10, 80, 20, 15, 52, 20);
        // Cleft left side
        ctx.bezierCurveTo(60, 20, 64, 35, 64, 35);
        // Cleft right side
        ctx.bezierCurveTo(64, 35, 68, 20, 76, 20);
        // Right curve
        ctx.bezierCurveTo(108, 15, 118, 80, 64, 115);
        ctx.closePath();

        // Soft pink gradient
        const gradient = ctx.createRadialGradient(64, 95, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 105, 180, 1)');      // Deep pink base
        gradient.addColorStop(0.5, 'rgba(255, 183, 197, 0.9)');    // Mid pink
        gradient.addColorStop(1, 'rgba(255, 240, 245, 0.3)');      // Translucent white-pink edges

        ctx.fillStyle = gradient;
        ctx.fill();

        // Subtle veins
        ctx.strokeStyle = 'rgba(255, 20, 147, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(64, 115); ctx.quadraticCurveTo(55, 70, 50, 45);
        ctx.moveTo(64, 115); ctx.quadraticCurveTo(64, 70, 64, 40);
        ctx.moveTo(64, 115); ctx.quadraticCurveTo(73, 70, 78, 45);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export function CherryBlossoms() {
    const count = 350;
    const particles = useRef<THREE.InstancedMesh>(null);
    const tempObject = new THREE.Object3D();
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        const tex = createPetalTexture();
        if (tex) setTexture(tex);
    }, []);

    // Physics data: pos X, Y, Z, speed, rotSpeedX, rotSpeedY, rotSpeedZ, phase
    const physics = useMemo(() => {
        const data = new Float32Array(count * 8);
        for (let i = 0; i < count; i++) {
            data[i * 8] = (Math.random() - 0.5) * 20;     // x
            data[i * 8 + 1] = Math.random() * 20 - 10;    // y
            data[i * 8 + 2] = (Math.random() - 0.5) * 10 - 2; // z

            data[i * 8 + 3] = 0.5 + Math.random() * 1.5;  // falling speed

            data[i * 8 + 4] = (Math.random() - 0.5) * 4;  // rotX speed
            data[i * 8 + 5] = (Math.random() - 0.5) * 4;  // rotY speed
            data[i * 8 + 6] = (Math.random() - 0.5) * 4;  // rotZ speed

            data[i * 8 + 7] = Math.random() * Math.PI * 2; // phase
        }
        return data;
    }, [count]);

    // Use a slightly curved geometry for realism (cylinder segment)
    const geometry = useMemo(() => {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 4, 1, true, 0, Math.PI / 3);
        // Center it
        geo.translate(0, 0, -0.05);
        return geo;
    }, []);

    const material = useMemo(() => {
        if (!texture) return null;
        return new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
    }, [texture]);

    useFrame((state, delta) => {
        if (!particles.current || !texture) return;

        const time = state.clock.elapsedTime;

        for (let i = 0; i < count; i++) {
            // Update Y (falling)
            physics[i * 8 + 1] -= physics[i * 8 + 3] * delta;

            // Update X (wind drifting + chaotic fluttering)
            physics[i * 8] += Math.sin(time * 1.5 + physics[i * 8 + 7]) * 0.02
                + Math.cos(time * 0.5) * 0.01;

            // Reset if too low
            if (physics[i * 8 + 1] < -12) {
                physics[i * 8 + 1] = 12;
                physics[i * 8] = (Math.random() - 0.5) * 20;
            }

            tempObject.position.set(physics[i * 8], physics[i * 8 + 1], physics[i * 8 + 2]);

            // Chaotic graceful rotation
            tempObject.rotation.x = time * physics[i * 8 + 4];
            tempObject.rotation.y = time * physics[i * 8 + 5];
            tempObject.rotation.z = time * physics[i * 8 + 6] + Math.sin(time * 2 + physics[i * 8 + 7]) * 0.5;

            tempObject.updateMatrix();
            particles.current.setMatrixAt(i, tempObject.matrix);
        }
        particles.current.instanceMatrix.needsUpdate = true;
    });

    if (!material) return null;

    return (
        <instancedMesh ref={particles} args={[geometry, material, count]} />
    );
}
