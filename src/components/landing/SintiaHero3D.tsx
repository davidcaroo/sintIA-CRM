"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function SintiaHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // Graceful exit if WebGL unavailable
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    setIsLoaded(true);

    // Group to hold all 3D elements for mouse parallax
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Núcleo Central: Sintia AI Core (Icosaedro brillante con wireframe exterior)
    const coreGeo = new THREE.IcosahedronGeometry(2.8, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      specular: 0xa5b4fc,
      shininess: 90,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Wireframe exterior envolvente
    const wireGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // 2. Anillos Orbitales
    const createRing = (radius: number, tiltX: number, tiltY: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.04, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const ring1 = createRing(5.2, Math.PI / 3, Math.PI / 8, 0x6366f1);
    const ring2 = createRing(7.2, -Math.PI / 4, -Math.PI / 6, 0x38bdf8);
    const ring3 = createRing(9.2, Math.PI / 2.5, Math.PI / 4, 0x10b981);
    mainGroup.add(ring1);
    mainGroup.add(ring2);
    mainGroup.add(ring3);

    // 3. Nodos de Integraciones en órbita (WhatsApp, Calendar, Stripe, Slack, Gmail, Sheets)
    const integrationConfigs = [
      { color: 0x10b981, dist: 5.2, speed: 0.8, angleOffset: 0, label: "WhatsApp" },
      { color: 0x0284c7, dist: 5.2, speed: 0.8, angleOffset: Math.PI, label: "Google Calendar" },
      { color: 0x6366f1, dist: 7.2, speed: 0.6, angleOffset: Math.PI / 3, label: "Stripe" },
      { color: 0xa855f7, dist: 7.2, speed: 0.6, angleOffset: (4 * Math.PI) / 3, label: "Slack" },
      { color: 0xef4444, dist: 9.2, speed: 0.4, angleOffset: Math.PI / 2, label: "Gmail" },
      { color: 0x10b981, dist: 9.2, speed: 0.4, angleOffset: (3 * Math.PI) / 2, label: "Google Sheets" },
    ];

    const nodes: { mesh: THREE.Mesh; config: (typeof integrationConfigs)[0] }[] = [];

    integrationConfigs.forEach((cfg) => {
      const sphereGeo = new THREE.SphereGeometry(0.42, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      mainGroup.add(sphere);
      nodes.push({ mesh: sphere, config: cfg });
    });

    // 4. Nube de Partículas / Polvo Estelar de Datos
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorChoices = [new THREE.Color(0x818cf8), new THREE.Color(0x38bdf8), new THREE.Color(0x34d399)];

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.5 + Math.random() * 9.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particleSystem);

    // 5. Luces Ambientales y Puntuales
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 2.5, 40);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2.0, 40);
    pointLight2.position.set(-10, -8, -5);
    scene.add(pointLight2);

    // 6. Interacción con Ratón (Smooth Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.45;
      mouseY = y * 0.45;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 7. Bucle de Animación con Damping y Rotaciones
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Rotación del núcleo central
        coreMesh.rotation.y = elapsedTime * 0.25;
        coreMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15;
        wireMesh.rotation.y = -elapsedTime * 0.15;
        wireMesh.rotation.z = Math.cos(elapsedTime * 0.2) * 0.2;

        // Pulso suave de respiración
        const pulse = 1 + Math.sin(elapsedTime * 1.6) * 0.035;
        coreMesh.scale.set(pulse, pulse, pulse);

        // Órbitas de los nodos
        nodes.forEach(({ mesh, config }) => {
          const angle = elapsedTime * config.speed + config.angleOffset;
          mesh.position.x = Math.cos(angle) * config.dist;
          mesh.position.y = Math.sin(angle) * (config.dist * 0.45) * Math.cos(config.angleOffset);
          mesh.position.z = Math.sin(angle) * config.dist * 0.85;
        });

        // Rotación lenta de la nube de partículas
        particleSystem.rotation.y = elapsedTime * 0.04;
      }

      // Parallax suave hacia la posición del ratón
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mainGroup.rotation.y = targetX;
      mainGroup.rotation.x = -targetY;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Manejo de Redimensión
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] flex items-center justify-center pointer-events-none">
      <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-auto" />

      {/* Fallback mientras carga Three.js */}
      {!isLoaded && (
        <div className="w-32 h-32 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-pulse flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20" />
        </div>
      )}
    </div>
  );
}
