// API key extraction service for Arr applications

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

const execAsync = promisify(exec);

interface ExtractedKeys {
  [service: string]: string | null;
}

const CONFIG_XML_SERVICES = ['radarr', 'sonarr', 'lidarr', 'prowlarr'];

export async function extractApiKeys(configBasePath: string): Promise<ExtractedKeys> {
  const keys: ExtractedKeys = {};

  for (const service of CONFIG_XML_SERVICES) {
    const configXmlPath = path.join(configBasePath, service, 'config.xml');
    try {
      const xml = fs.readFileSync(configXmlPath, 'utf-8');
      const parsed = await xml2js.parseStringPromise(xml);
      keys[service] = parsed?.Config?.ApiKey?.[0] || null;
    } catch {
      keys[service] = null;
    }
  }

  return keys;
}
