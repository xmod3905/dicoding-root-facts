import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { TENSORFLOW_CONFIG } from '../utils/config.js';
import {
  logError,
  validateModelMetadata,
  updatePerformanceStats,
  logPerformance,
  createPerformanceResult,
  createPerformanceStats,
  isWebGPUSupported
} from '../utils/common.js';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = TENSORFLOW_CONFIG;
    this.performanceStats = createPerformanceStats();
  }

  async loadModel() {
    try {
      const backend = isWebGPUSupported() ? 'webgpu' : 'webgl';

      await tf.setBackend(backend);
      await tf.ready();

      const backendName = tf.getBackend();

      const [metadata, model] = await Promise.all([
        fetch(this.config.metadataPath).then(async (r) => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        }),
        tf.loadLayersModel(this.config.modelPath)
      ]);

      if (!validateModelMetadata(metadata)) {
        throw new Error('Metadata tidak valid: array label tidak ditemukan');
      }

      this.labels = metadata.labels;
      this.model = model;

      return {
        success: true,
        labels: this.labels,
        modelName: metadata.modelName || 'Tidak Diketahui',
        version: metadata.version || '1.0.0',
        backend: backendName
      };

    } catch (error) {
      logError('Gagal memuat model', error);
      throw new Error(`Gagal memuat model: ${error.message}`);
    }
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
    }

    if (!imageElement) {
      throw new Error('Elemen gambar diperlukan untuk prediksi');
    }

    let tensor = null;
    let predictions = null;
    const startTime = performance.now();

    try {
      tensor = tf.tidy(() => {
        return tf.browser.fromPixels(imageElement)
          .resizeBilinear(this.config.inputSize)
          .div(this.config.normalizationFactor)
          .expandDims(0);
      });

      predictions = this.model.predict(tensor);
      const values = await predictions.data();

      const endTime = performance.now();
      const predictionTime = endTime - startTime;

      updatePerformanceStats(this.performanceStats, predictionTime);

      const maxIndex = values.indexOf(Math.max(...values));
      const confidence = Math.round(values[maxIndex] * 100);
      const className = this.labels[maxIndex];
      const isValid = confidence >= this.config.confidenceThresholds.excellent;

      const result = {
        className: className,
        confidence: confidence,
        score: values[maxIndex],
        isValid: isValid,
        allPredictions: this.labels.map((label, index) => ({
          className: label,
          confidence: Math.round(values[index] * 100)
        })).sort((a, b) => b.confidence - a.confidence),

        performance: createPerformanceResult(
          predictionTime,
          tf.getBackend(),
          this.performanceStats.averageTime,
          this.performanceStats.operations
        )
      };

      logPerformance(tf.getBackend(), predictionTime, this.performanceStats.averageTime);

      return result;

    } catch (error) {
      logError('Kesalahan prediksi', error);
      throw new Error(`Prediksi gagal: ${error.message}`);
    } finally {
      if (tensor) tensor.dispose();
      if (predictions) predictions.dispose();
    }
  }

  isLoaded() {
    return !!this.model && this.labels.length > 0;
  }
}
