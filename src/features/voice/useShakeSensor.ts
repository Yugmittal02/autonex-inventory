import { useEffect } from 'react';

export function useShakeSensor(onShake: any, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    let lastTime = 0;
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    const threshold = 16;

    const handleMotion = (e: any) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      if (now - lastTime < 250) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);

      // Prevent accidental triggers: require a clear spike
      if (delta > threshold && now - lastTime > 800) {
        lastTime = now;
        onShake?.();
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onShake, enabled]);
}
