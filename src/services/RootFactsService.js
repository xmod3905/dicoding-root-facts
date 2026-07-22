import { pipeline, env } from '@huggingface/transformers';
import { TRANSFORMERS_CONFIG, TONE_CONFIG } from '../utils/config.js';
import {
  createDelay,
  isWebGPUSupported,
  logError,
  updatePerformanceStats,
  logPerformance,
  createPerformanceResult,
  createModelProgressCallback,
  createPerformanceStats
} from '../utils/common.js';

env.allowLocalModels = true;
env.useBrowserCache = true;

export class RootFactsService {
  constructor(onProgress = null) {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = TRANSFORMERS_CONFIG;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
    this.performanceStats = createPerformanceStats();
    this.onProgress = onProgress;
  }

  /**
   * Memuat model Transformers.js (text2text-generation / ONNX).
   */
  async loadModel() {
    try {
      const device = isWebGPUSupported() ? 'webgpu' : 'wasm';

      this.generator = await pipeline(
        'text2text-generation',
        this.config.modelName,
        {
          dtype: 'q4',
          device,
          progress_callback: createModelProgressCallback(this.onProgress)
        }
      );

      this.isModelLoaded = true;
      this.currentBackend = device;

      return {
        success: true,
        model: this.config.modelName,
        backend: this.currentBackend
      };
    } catch (error) {
      logError('Kesalahan memuat model Transformers.js', error);
      throw new Error(`Gagal memuat model generasi konten: ${error.message}`);
    }
  }

  setTone(tone) {
    this.currentTone = tone;
  }

  async generateFacts(vegetableName) {
    if (!this.isModelLoaded || this.isGenerating) {
      throw new Error('Model belum siap atau sedang menghasilkan konten');
    }

    if (!vegetableName || typeof vegetableName !== 'string') {
      throw new Error('Nama sayuran tidak valid');
    }

    try {
      this.isGenerating = true;
      const startTime = performance.now();

      await createDelay(this.config.generationDelay);

      const prompt = this.buildPrompt(vegetableName);

      const result = await this.generator(prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        do_sample: true,
        top_p: this.config.topP
      });

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      updatePerformanceStats(this.performanceStats, generationTime);

      const generatedText = result[0].generated_text;

      logPerformance(this.currentBackend, generationTime, this.performanceStats.averageTime);

      return {
        funFact: generatedText.trim(),
        generated: true,
        source: 'Dihasilkan AI',
        performance: createPerformanceResult(
          generationTime,
          this.currentBackend,
          this.performanceStats.averageTime,
          this.performanceStats.operations
        )
      };
    } catch (error) {
      logError('Kesalahan menghasilkan konten fakta menarik', error);
      throw new Error(`Gagal menghasilkan informasi fakta menarik: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  buildPrompt(vegetableName) {
    const tonePrompts = {
      normal: `Tell me a fun and interesting fact about ${vegetableName} vegetable. Keep it under 2 sentences.`,
      funny: `Tell me a funny joke or humorous fact about ${vegetableName} vegetable. Make it witty. Under 2 sentences.`,
      professional: `Provide a scientific or nutritional fact about ${vegetableName} vegetable. Be precise. Under 2 sentences.`,
      casual: `Share a chill, interesting fact about ${vegetableName} vegetable. Keep it casual and friendly. Under 2 sentences.`
    };

    return tonePrompts[this.currentTone] || tonePrompts.normal;
  }

  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}