// Enhanced coordinator with retry logic and per-service status

import { extractApiKeys } from './api-key-extractor';
import axios from 'axios';

interface StepResult {
  step: string;
  success: boolean;
  message: string;
  retries: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
  delayMs = 5000
): Promise<StepResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      return { step: label, success: true, message: 'OK', retries: attempt - 1 };
    } catch (err: any) {
      if (attempt === maxRetries) {
        return { step: label, success: false, message: err.message, retries: attempt - 1 };
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return { step: label, success: false, message: 'Max retries exceeded', retries: maxRetries };
}

export async function runCoordination(configBasePath: string): Promise<{ results: StepResult[] }> {
  const results: StepResult[] = [];

  // Step 1: Extract API keys from config files
  results.push(await withRetry(
    async () => {
      const keys = await extractApiKeys(configBasePath);
      console.log('Extracted API keys:', keys);
    },
    'Extract API keys from config files'
  ));

  // Step 2: Wait for services to be ready
  results.push(await withRetry(
    async () => {
      await axios.get('http://radarr:7878/api/v3/system/status', { timeout: 5000 });
    },
    'Wait for Radarr to be ready',
    5,
    10000
  ));

  results.push(await withRetry(
    async () => {
      await axios.get('http://sonarr:8989/api/v3/system/status', { timeout: 5000 });
    },
    'Wait for Sonarr to be ready',
    5,
    10000
  ));

  results.push(await withRetry(
    async () => {
      await axios.get('http://prowlarr:9696/api/v1/system/status', { timeout: 5000 });
    },
    'Wait for Prowlarr to be ready',
    5,
    10000
  ));

  // Additional coordination steps can be added here

  return { results };
}
