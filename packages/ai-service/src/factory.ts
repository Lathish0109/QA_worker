import { AnthropicAIService } from './anthropic-service';
import { OpenAIAIService } from './openai-service';
import { GeminiAIService } from './gemini-service';
import type { AIService } from './types';

export const AI_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'ChatGPT (OpenAI)',
  gemini: 'Gemini (Google)',
};

export const AI_PROVIDER_ENV_VAR: Record<AIProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

export function isProviderConfigured(provider: AIProvider): boolean {
  return Boolean(process.env[AI_PROVIDER_ENV_VAR[provider]]);
}

/** Creates the AIService implementation for the given provider. Throws the same
 * clear "must be set" error each implementation already throws if its key is missing. */
export function createAIService(provider: AIProvider): AIService {
  switch (provider) {
    case 'anthropic':
      return new AnthropicAIService();
    case 'openai':
      return new OpenAIAIService();
    case 'gemini':
      return new GeminiAIService();
  }
}
