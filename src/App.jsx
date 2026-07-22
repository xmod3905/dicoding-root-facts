import { useEffect, useCallback, useRef, useState } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { DetectionService } from './services/DetectionService';
import { CameraService } from './services/CameraService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG } from './utils/config';
import { createDelay, isValidDetection } from './utils/common';
import { commonStyles } from './utils/ui';
import { useAppState } from './hooks/useAppState';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const [currentTone, setCurrentTone] = useState('normal');

  useEffect(() => {
    const init = async () => {
      try {
        actions.setModelStatus('Memuat model AI...');
        actions.setError(null);

        const detector = new DetectionService();
        await detector.loadModel();

        const camera = new CameraService();

        let generator = null;
        try {
          // Callback untuk update progress download model
          generator = new RootFactsService((progress) => {
            actions.setModelStatus(progress.message);
          });
          await generator.loadModel();
        } catch (error) {
          console.warn('⚠️ Layanan fakta menarik gagal dimuat (mode offline?)', error);
        }

        actions.setServices({ detector, camera, generator });
        actions.setModelStatus('Model AI Siap');

      } catch (error) {
        actions.setModelStatus('Model gagal dimuat');
        actions.setError(`Gagal menginisialisasi: ${error.message}`);
      }
    };

    init();
  }, [actions]);

  useEffect(() => {
    return () => {
      if (detectionCleanupRef.current) {
        detectionCleanupRef.current();
      }
      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, [state.services.camera]);

  const startDetection = useCallback(() => {
    let animationId = null;
    let isActive = true;

    const detectLoop = async () => {
      if (!isActive) {
        return;
      }
      if (!isRunningRef.current) {
        setTimeout(() => {
          if (isActive) {
            animationId = requestAnimationFrame(detectLoop);
          }
        }, APP_CONFIG.detectionRetryInterval);
        return;
      }

      try {
        const canvas = state.services.camera.captureFrame();
        if (!canvas) {
          if (isActive && isRunningRef.current) {
            animationId = requestAnimationFrame(detectLoop);
          }
          return;
        }

        const result = await state.services.detector.predict(canvas);

        if (isValidDetection(result)) {
          isActive = false;
          isRunningRef.current = false;
          actions.setRunning(false);
          actions.setAppState('analyzing');
          state.services.camera?.stopCamera();

          await createDelay(APP_CONFIG.analyzingDelay);

          actions.setDetectionResult(result);
          actions.setAppState('result');
          actions.setFunFactData(null);

          if (state.services.generator?.isReady()) {
            await createDelay(APP_CONFIG.factsGenerationDelay);
            try {
              const funFactResult = await state.services.generator.generateFacts(result.className);
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

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [state.services, actions]);

  const startCamera = async () => {
    try {
      actions.resetResults();

      isRunningRef.current = true;
      actions.setRunning(true);
      actions.setAppState('analyzing');

      await state.services.camera?.startCamera();

      await createDelay(APP_CONFIG.cameraStartDelay);

      const cleanup = startDetection();
      detectionCleanupRef.current = cleanup;

    } catch (error) {
      console.error('❌ Gagal memulai kamera', error);
      isRunningRef.current = false;
      actions.setRunning(false);
      actions.setAppState('idle');
      throw error;
    }
  };

  const stopCamera = () => {
    if (detectionCleanupRef.current) {
      detectionCleanupRef.current();
      detectionCleanupRef.current = null;
    }

    isRunningRef.current = false;
    actions.setRunning(false);
    actions.setAppState('idle');
    state.services.camera?.stopCamera();
    actions.resetResults();
  };

  const handleToggleCamera = useCallback(async () => {
    if (!state.services.detector?.isLoaded()) {
      actions.setError('Model deteksi AI belum siap. Harap tunggu inisialisasi selesai.');
      return;
    }

    try {
      actions.setError(null);
      if (!isRunningRef.current) {
        await startCamera();
      } else {
        stopCamera();
      }
    } catch (error) {
      console.error('❌ Camera toggle error:', error);
      actions.setError(error.message);
    }
  }, [state.services.detector, actions, startCamera, isRunningRef]);

  const onCopyFact = useCallback(() => {
    if (state.funFactData && state.funFactData !== 'error') {
      navigator.clipboard.writeText(state.funFactData)
        .then(() => {
          console.log('Fakta menarik berhasil disalin ke clipboard.');
        })
        .catch((err) => {
          console.error('Gagal menyalin fakta menarik:', err);
          actions.setError('Gagal menyalin fakta menarik ke clipboard.');
        });
    }
  }, [state.funFactData, actions]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
          onToneChange={setCurrentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={onCopyFact}
        />
      </main>

      <footer className="footer">
        <div>
          <p>Powered by TensorFlow.js & Transformers.js.</p>
        </div>
        <div>
         Create by <a href="https://github.com/xmod3905" target="_blank" rel="noopener noreferrer">Muhammad Iqbal</a>
        </div>
      </footer>

      {state.error && (
        <div className="error-toast" style={commonStyles.errorToast}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={commonStyles.closeButton}
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
