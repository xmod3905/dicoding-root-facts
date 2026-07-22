import { useEffect, useCallback, useState } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import Footer from './components/Footer';
import ErrorPopUp from './components/ErrorPopUp';

import { DetectionService } from './services/DetectionService';
import { CameraService } from './services/CameraService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG } from './utils/config';
import { useAppState } from './hooks/useAppState';
import { useDetectionLoop } from './hooks/useDetectionLoop';
import { createDelay } from './utils/common';
function App() {
  const { state, actions } = useAppState();
  const [currentTone, setCurrentTone] = useState('normal');

  // Integrasi custom hook untuk memisahkan logika loop deteksi
  const { startLoop, stopLoop, isRunningRef } = useDetectionLoop({
    services: state.services,
    actions,
  });

  // 1. Inisialisasi AI Models & Services
  useEffect(() => {
    let isSubscribed = true;

    const initServices = async () => {
      try {
        actions.setModelStatus('Memuat model AI...');
        actions.setError(null);

        const detector = new DetectionService();
        await detector.loadModel();

        const camera = new CameraService();
        let generator = null;

        try {
          generator = new RootFactsService((progress) => {
            if (isSubscribed) actions.setModelStatus(progress.message);
          });
          await generator.loadModel();
        } catch (error) {
          console.warn('⚠️ Layanan fakta menarik gagal dimuat (mode offline?)', error);
        }

        if (isSubscribed) {
          actions.setServices({ detector, camera, generator });
          actions.setModelStatus('Model AI Siap');
        }
      } catch (error) {
        if (isSubscribed) {
          actions.setModelStatus('Model gagal dimuat');
          actions.setError(`Gagal menginisialisasi: ${error.message}`);
        }
      }
    };

    initServices();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopLoop();
      state.services.camera?.stopCamera();
    };
  }, [state.services.camera, stopLoop]);

  const startCamera = useCallback(async () => {
    try {
      actions.resetResults();
      isRunningRef.current = true;
      actions.setRunning(true);
      actions.setAppState('analyzing');

      await state.services.camera?.startCamera();
      await createDelay(APP_CONFIG.cameraStartDelay);

      startLoop();
    } catch (error) {
      console.error('Error: Gagal memulai kamera', error);
      isRunningRef.current = false;
      actions.setRunning(false);
      actions.setAppState('idle');
      throw error;
    }
  }, [actions, state.services.camera, startLoop, isRunningRef]);

  const stopCamera = useCallback(() => {
    stopLoop();
    actions.setRunning(false);
    actions.setAppState('idle');
    state.services.camera?.stopCamera();
    actions.resetResults();
  }, [actions, state.services.camera, stopLoop]);

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
      console.error('Error: Camera toggle error:', error);
      actions.setError(error.message);
    }
  }, [state.services.detector, actions, startCamera, stopCamera, isRunningRef]);

  // 4. Copy to Clipboard Handler
  const handleCopyFact = useCallback(() => {
    if (state.funFactData && state.funFactData !== 'error') {
      navigator.clipboard
        .writeText(state.funFactData)
        .then(() => console.log('Fakta menarik berhasil disalin ke clipboard.'))
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
          onCopyFact={handleCopyFact}
        />
      </main>

      <Footer authorName="Muhammad Iqbal" githubUrl="https://github.com/xmod3905" />

      {state.error && (
        <ErrorPopUp message={state.error} onClose={() => actions.setError(null)} />
      )}
    </div>
  );
}

export default App;