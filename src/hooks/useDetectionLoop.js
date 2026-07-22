import { useRef, useCallback } from 'react';
import { APP_CONFIG } from '../utils/config';
import { createDelay, isValidDetection } from '../utils/common';

export const useDetectionLoop = ({ services, actions }) => {
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);

  const stopLoop = useCallback(() => {
    if (detectionCleanupRef.current) {
      detectionCleanupRef.current();
      detectionCleanupRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    isRunningRef.current = true;

    let animationId = null;
    let isActive = true;

    const detectLoop = async () => {
      if (!isActive) return;

      if (!isRunningRef.current) {
        setTimeout(() => {
          if (isActive) animationId = requestAnimationFrame(detectLoop);
        }, APP_CONFIG.detectionRetryInterval);
        return;
      }

      try {
        const canvas = services.camera?.captureFrame();
        if (!canvas) {
          if (isActive && isRunningRef.current) {
            animationId = requestAnimationFrame(detectLoop);
          }
          return;
        }

        const result = await services.detector?.predict(canvas);

        if (isValidDetection(result)) {
          isActive = false;
          isRunningRef.current = false;

          actions.setRunning(false);
          actions.setAppState('analyzing');
          services.camera?.stopCamera();

          await createDelay(APP_CONFIG.analyzingDelay);

          actions.setDetectionResult(result);
          actions.setAppState('result');
          actions.setFunFactData(null);

          if (services.generator?.isReady()) {
            await createDelay(APP_CONFIG.factsGenerationDelay);
            try {
              const funFactResult = await services.generator.generateFacts(result.className);
              actions.setFunFactData(funFactResult.funFact);
            } catch (funFactError) {
              console.error('❌ Gagal menghasilkan fakta menarik', funFactError);
              actions.setFunFactData('error');
            }
          } else {
            actions.setFunFactData('error');
          }
          return;
        }
      } catch (error) {
        console.error('❌ Error deteksi', error);
        actions.setError(`Deteksi gagal: ${error.message}`);
      }

      if (isActive && isRunningRef.current) {
        animationId = requestAnimationFrame(detectLoop);
      }
    };

    detectLoop();

    const cleanup = () => {
      isActive = false;
      if (animationId) cancelAnimationFrame(animationId);
    };

    detectionCleanupRef.current = cleanup;
    return cleanup;
  }, [services, actions, stopLoop]);

  return { startLoop, stopLoop, isRunningRef };
};