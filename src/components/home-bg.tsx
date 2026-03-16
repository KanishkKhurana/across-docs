'use client';

import { useEffect, useRef } from 'react';

export function HomeBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;
      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = { x: -1000, y: -1000 };
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    let time = 0;
    const spacing = 6;
    const dotRadius = 1.3;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      time += 0.012;
      const mouse = mouseRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Dark background
      ctx.fillStyle = '#151518';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;

          // Diagonal wave layers for organic flowing pattern
          const wave1 = Math.sin((x + y) * 0.008 + time * 1.2) * 0.5 + 0.5;
          const wave2 = Math.sin((x - y) * 0.006 + time * 0.8) * 0.5 + 0.5;
          const wave3 = Math.sin(x * 0.01 + time * 0.5) * 0.3 + 0.5;
          const wave4 = Math.sin(y * 0.012 - time * 0.7) * 0.3 + 0.5;

          let intensity = (wave1 * wave2 + wave3 * wave4) * 0.5;

          // Mouse ripple: radial wave emanating from cursor
          let mouseBoost = 0;
          if (mouse.x > 0 && mouse.y > 0) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 180) {
              // Gentle glow around cursor
              const ripple = Math.sin(dist * 0.04 - time * 1.2) * 0.15 + 0.85;
              const falloff = 1 - dist / 180;
              mouseBoost = ripple * falloff * falloff * 0.35;
            }
          }

          intensity = Math.min(1, intensity + mouseBoost);

          // Only draw dots above a threshold for the scattered look
          if (intensity < 0.18) continue;

          // Color: mix between dim dark-green and bright aqua based on intensity
          const r = Math.floor(20 + intensity * 88);
          const g = Math.floor(40 + intensity * 209);
          const b = Math.floor(35 + intensity * 181);
          const alpha = (0.15 + intensity * 0.75) * 0.25;

          const size = dotRadius * (0.4 + intensity * 0.7);

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
