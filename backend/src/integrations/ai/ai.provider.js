const { GoogleGenAI } = require('@google/genai');

/**
 * AI Provider abstraction using official @google/genai SDK.
 * Encapsulates LLM API interaction and handles credential/error safety.
 */
class AiProvider {
  constructor() {
    this.modelName = process.env.AI_MODEL || 'gemini-2.0-flash';
  }

  /**
   * Helper to instantiate GoogleGenAI client lazily using environment key.
   */
  getClient() {
    const rawKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    if (!apiKey || apiKey.startsWith('your_')) {
      const err = new Error('AI API key is missing in environment variables.');
      err.code = 'MISSING_API_KEY';
      err.status = 503;
      throw err;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generates structured text response from LLM using system/user prompt.
   * @param {string} promptText - Fully constructed prompt.
   * @param {Object} [config] - Optional generation configuration overrides.
   * @returns {Promise<string>} Raw text output from model.
   */
  async generateText(promptText, config = {}) {
    const client = this.getClient();

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          ...config,
        },
      });

      if (!response || !response.text) {
        throw new Error('Empty response received from AI model.');
      }

      return response.text;
    } catch (error) {
      if (error.code === 'MISSING_API_KEY') {
        throw error;
      }
      // Wrap provider errors to hide raw stack traces and internal API details
      const rawMsg = error.message || '';
      const customErr = new Error('AI provider request failed.');

      if (rawMsg.includes('429') || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('rate limit')) {
        customErr.code = 'RATE_LIMITED';
        customErr.status = 429;
      } else if (rawMsg.includes('400') || rawMsg.includes('403') || rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('permission')) {
        customErr.code = 'AUTH_ERROR';
        customErr.status = 502;
      } else {
        customErr.code = 'PROVIDER_ERROR';
        customErr.status = 502;
      }

      customErr.originalMessage = rawMsg;
      throw customErr;
    }
  }
}

module.exports = new AiProvider();
