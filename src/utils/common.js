import { APP_CONFIG, CAMERA_CONFIG, TENSORFLOW_CONFIG } from './config.js';

export const logError = (context, error) => {
  console.error(`Error: ${context}:`, error);
};

export const createPerformanceStats = () => ({
  operations: 0,
  totalTime: 0,
  averageTime: 0
});

export const updatePerformanceStats = (stats, operationTime) => {
  stats.operations++;
  stats.totalTime += operationTime;
  stats.averageTime = stats.totalTime / stats.operations;
  return stats;
};

export const logPerformance = (backend, operationTime, averageTime) => {
  console.log(`⚡ ${backend.toUpperCase()}: ${Math.round(operationTime)}ms (avg: ${Math.round(averageTime)}ms)`);
};

export const createPerformanceResult = (operationTime, backend, averageTime, totalOperations) => ({
  operationTime: Math.round(operationTime),
  backend: backend,
  averageTime: Math.round(averageTime),
  totalOperations: totalOperations
});

export const isWebGPUSupported = () => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

export const isMobileDevice = () => {
  return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const createDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const validateModelMetadata = (metadata) => {
  return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getCameraErrorMessage = (error) => {
  const errorMessages = {
    'NotAllowedError': 'Izin kamera ditolak. Harap izinkan akses kamera.',
    'NotFoundError': 'Tidak ada kamera ditemukan pada perangkat ini.',
    'NotReadableError': 'Kamera sedang digunakan oleh aplikasi lain.'
  };

  return errorMessages[error.name] || 'Gagal memulai kamera';
};

export const isValidDetection = (result) => {
  const { detectionConfidenceThreshold } = APP_CONFIG;
  return result && result.isValid && result.confidence >= detectionConfidenceThreshold;
};

export const getCameraConfig = () => {
  const mobile = isMobileDevice();
  return {
    defaultFPS: CAMERA_CONFIG.defaultFPS,
    fpsRange: CAMERA_CONFIG.fpsRange,
    resolution: mobile
      ? CAMERA_CONFIG.mobileResolution
      : CAMERA_CONFIG.desktopResolution,
    facingMode: mobile
      ? CAMERA_CONFIG.mobileFacingMode
      : CAMERA_CONFIG.desktopFacingMode
  };
};

export const getCameraConstraints = (selectedCameraId) => {
  const config = getCameraConfig();
  return {
    video: {
      deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
      width: { ideal: config.resolution.width },
      height: { ideal: config.resolution.height },
      facingMode: config.facingMode,
      frameRate: { ideal: config.defaultFPS }
    }
  };
};

/**
 * Membuat callback untuk melacak progress download model.
 * Menghitung progress encoder dan decoder secara terpisah.
 * Menggunakan throttling untuk menghindari terlalu banyak pemanggilan callback.
 */
export const createModelProgressCallback = (onProgress, throttleMs = 200) => {
  const fileProgress = {};
  let lastMessage = '';
  let lastCallTime = 0;

  return (progress) => {

    if (progress.status !== 'progress' || !progress.file) return;

    const isEncoder = progress.file.includes('encoder');
    const isDecoder = progress.file.includes('decoder');
    if (!isEncoder && !isDecoder) return;

    fileProgress[progress.file] = Math.round(progress.progress);


    const encoderFiles = Object.entries(fileProgress)
      .filter(([file]) => file.includes('encoder'));
    const decoderFiles = Object.entries(fileProgress)
      .filter(([file]) => file.includes('decoder'));

    const average = (entries) => {
      if (entries.length === 0) return 0;
      const sum = entries.reduce((acc, [, val]) => acc + val, 0);
      return Math.round(sum / entries.length);
    };

    const encoder = average(encoderFiles);
    const decoder = average(decoderFiles);
    const message = `Mengunduh model AI... Encoder: ${encoder}% | Decoder: ${decoder}%`;

    if (message === lastMessage) return;

    const now = Date.now();
    if (now - lastCallTime < throttleMs) return;
    lastCallTime = now;
    lastMessage = message;

    if (onProgress && typeof onProgress === 'function') {
      onProgress({ status: 'downloading', encoder, decoder, message });
    }
  };
};

