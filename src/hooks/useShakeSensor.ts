import { useEffect } from 'react';

type ShakeCallback = () => void;

/**
 * Custom hook for detecting device shake gestures
 * Used to activate voice search hands-free
 */
export const useShakeSensor = (onShake: ShakeCallback, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    let shakeCount = 0;
    let lastTime = Date.now();
    let lastX = 0,
      lastY = 0,
      lastZ = 0;

    // Thresholds to prevent accidental triggers
    const SHAKE_THRESHOLD = 60;
    const SHAKE_TIMEOUT = 1000;
    const REQUIRED_SHAKES = 4;

    const handleMotion = (e: DeviceMotionEvent) => {
      const { x, y, z } = e.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      if (!x && !y && !z) return;

      const curTime = Date.now();
      if (curTime - lastTime > 100) {
        const diffTime = curTime - lastTime;
        lastTime = curTime;

        // Calculate Speed
        const speed =
          (Math.abs((x || 0) + (y || 0) + (z || 0) - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > SHAKE_THRESHOLD) {
          shakeCount++;
          console.log(`🔔 Shake detected! Count: ${shakeCount}`);

          if (shakeCount >= REQUIRED_SHAKES) {
            onShake();
            shakeCount = 0;
          }
        }

        lastX = x || 0;
        lastY = y || 0;
        lastZ = z || 0;
      }
    };

    // Reset shake count after timeout
    const resetInterval = setInterval(() => {
      if (shakeCount > 0 && Date.now() - lastTime > SHAKE_TIMEOUT) {
        shakeCount = 0;
      }
    }, 500);

    // Request permission for iOS 13+
    const DME = DeviceMotionEvent as any;
    if (typeof DME !== 'undefined' && typeof DME.requestPermission === 'function') {
      DME.requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      clearInterval(resetInterval);
    };
  }, [onShake, enabled]);
};

export default useShakeSensor;
