// AI Agent service for automated configuration assistance

import axios from 'axios';
import { PlexArrConfig } from '../models/config';

interface AIResponse {
  success: boolean;
  suggestion: string;
  confidence: number;
  actions?: Array<{
    service: string;
    setting: string;
    value: any;
  }>;
}

export class AIAgentService {
  private apiKey: string;
  private provider: 'gemini' | 'openai' | 'anthropic';
  private model: string;
  private baseUrl: string;

  constructor(config: PlexArrConfig['aiAgent']) {
    if (!config || !config.enabled || !config.apiKey) {
      throw new Error('AI Agent not configured');
    }

    this.apiKey = config.apiKey;
    this.provider = config.provider;
    this.model = config.model || this.getDefaultModel();
    this.baseUrl = this.getBaseUrl();
  }

  private getDefaultModel(): string {
    switch (this.provider) {
      case 'gemini':
        return 'gemini-pro';
      case 'openai':
        return 'gpt-4';
      case 'anthropic':
        return 'claude-3-opus-20240229';
      default:
        return 'gemini-pro';
    }
  }

  private getBaseUrl(): string {
    switch (this.provider) {
      case 'gemini':
        return 'https://generativelanguage.googleapis.com/v1beta';
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      default:
        return '';
    }
  }

  /**
   * Analyze configuration and provide suggestions
   */
  async analyzeConfiguration(config: PlexArrConfig): Promise<AIResponse> {
    const prompt = this.buildAnalysisPrompt(config);

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error calling AI service:', error);
      return {
        success: false,
        suggestion: 'Unable to analyze configuration at this time.',
        confidence: 0,
      };
    }
  }

  /**
   * Suggest indexers for Prowlarr
   */
  async suggestIndexers(config: PlexArrConfig): Promise<AIResponse> {
    const prompt = `
Based on this PlexArr configuration, suggest the best indexers for Prowlarr:

Region: ${config.system.timezone || 'US'}
Services enabled: ${Object.entries(config.services)
  .filter(([_, svc]) => svc.enabled)
  .map(([name]) => name)
  .join(', ')}

Provide a list of 5-7 recommended indexers with brief explanations of why each is suitable.
Consider both Usenet and Torrent indexers if appropriate services are enabled.
`;

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error suggesting indexers:', error);
      return {
        success: false,
        suggestion: 'Unable to suggest indexers at this time.',
        confidence: 0,
      };
    }
  }

  /**
   * Suggest quality profiles
   */
  async suggestQualityProfiles(service: string): Promise<AIResponse> {
    const prompt = `
Suggest optimal quality profile settings for ${service} in a PlexArr media server setup.

Consider:
1. Balance between quality and storage space
2. Common use cases (streaming at home, remote access, 4K content)
3. Best practices for ${service}

Provide specific recommendations for:
- Allowed qualities
- Quality cutoffs
- Upgrade settings
- File size limits (if applicable)
`;

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error suggesting quality profiles:', error);
      return {
        success: false,
        suggestion: 'Unable to suggest quality profiles at this time.',
        confidence: 0,
      };
    }
  }

  /**
   * Help troubleshoot connection issues
   */
  async troubleshootConnection(
    sourceService: string,
    targetService: string,
    error: string
  ): Promise<AIResponse> {
    const prompt = `
Troubleshoot a connection issue in a PlexArr setup:

Source Service: ${sourceService}
Target Service: ${targetService}
Error Message: ${error}

Provide:
1. Most likely cause of the issue
2. Step-by-step troubleshooting steps
3. Configuration checks to perform
4. Common mistakes to avoid

Be specific about Docker networking, container names, and API keys.
`;

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error troubleshooting connection:', error);
      return {
        success: false,
        suggestion: 'Unable to troubleshoot at this time.',
        confidence: 0,
      };
    }
  }

  /**
   * Build analysis prompt for configuration
   */
  private buildAnalysisPrompt(config: PlexArrConfig): string {
    const enabledServices = Object.entries(config.services)
      .filter(([_, svc]) => svc.enabled)
      .map(([name]) => name);

    return `
Analyze this PlexArr media server configuration and provide optimization suggestions:

System:
- Timezone: ${config.system.timezone}
- PUID/PGID: ${config.system.puid}/${config.system.pgid}

Storage:
- Media Root: ${config.storage.mediaRoot}
- Downloads: ${config.storage.downloads}
- Config: ${config.storage.config}

Enabled Services:
${enabledServices.join(', ')}

Analyze:
1. Are all necessary services enabled?
2. Are there any potential conflicts (e.g., port collisions)?
3. Is the storage structure optimal?
4. Are there missing services that would enhance the setup?
5. Any security considerations?

Provide specific, actionable recommendations with reasoning.
`;
  }

  /**
   * Call the AI service API
   */
  private async callAI(prompt: string): Promise<string> {
    switch (this.provider) {
      case 'gemini':
        return this.callGemini(prompt);
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for PlexArr media server configuration.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/messages`,
      {
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Parse AI response into structured format
   */
  private parseResponse(response: string): AIResponse {
    // Simple parsing - can be enhanced with more sophisticated parsing
    return {
      success: true,
      suggestion: response,
      confidence: 0.85,
    };
  }
}
