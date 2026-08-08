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
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      const err = new Error('AI API key is missing in environment variables.');
      err.code = 'MISSING_API_KEY';
      throw err;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generates structured text response from LLM using system/user prompt.
   * @param {string} promptText - Fully constructed prompt.
   * @returns {Promise<string>} Raw text output from model.
   */
  async generateText(promptText) {
    const client = this.getClient();

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
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
      const customErr = new Error('AI provider request failed.');
      customErr.originalMessage = error.message;
      throw customErr;
    }
  }
}

module.exports = new AiProvider();
