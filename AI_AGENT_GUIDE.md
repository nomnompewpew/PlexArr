# AI Agent Integration Guide

## Overview

PlexArr now includes an optional AI Agent that can help you configure and optimize your media server setup. The AI Agent uses advanced language models to provide intelligent recommendations for service configuration, indexer selection, quality profiles, and troubleshooting.

## Supported AI Providers

- **Google Gemini** (Recommended for first-time users)
- **OpenAI GPT-4**
- **Anthropic Claude**

## Setup

### 1. Enable AI Agent in the Wizard

During the initial setup wizard, you'll see an "AI Agent Assistant" step. Check the box to enable it.

### 2. Select Your Provider

Choose from the three supported AI providers. Each has different strengths:

- **Gemini**: Free tier available, good for general configuration help
- **OpenAI**: Most comprehensive, requires paid API key
- **Claude**: Excellent at troubleshooting, requires paid API key

### 3. Enter Your API Key

You'll need an API key from your chosen provider:

#### Getting a Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and paste it into PlexArr

#### Getting an OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key and paste it into PlexArr

#### Getting an Anthropic API Key
1. Visit https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new key and paste it into PlexArr

### 4. (Optional) Specify a Model

You can leave this blank to use the default model, or specify a custom one:
- Gemini: `gemini-pro` (default), `gemini-ultra`
- OpenAI: `gpt-4` (default), `gpt-3.5-turbo`
- Claude: `claude-3-opus-20240229` (default), `claude-3-sonnet-20240229`

## Features

### Configuration Analysis

The AI Agent can analyze your entire PlexArr configuration and provide:
- Recommendations for optimal service selection
- Warnings about potential conflicts (e.g., port collisions)
- Suggestions for storage structure improvements
- Security considerations

**API Endpoint**: `POST /api/ai-agent/analyze`

```json
{
  "config": { /* your PlexArr config */ }
}
```

### Indexer Recommendations

Get personalized indexer suggestions for Prowlarr based on:
- Your geographic region (timezone)
- Enabled services (Usenet vs Torrent)
- Quality requirements

**API Endpoint**: `POST /api/ai-agent/suggest-indexers`

```json
{
  "config": { /* your PlexArr config */ }
}
```

### Quality Profile Optimization

Receive recommendations for optimal quality profiles in Radarr, Sonarr, and Lidarr:
- Balanced profiles for most users
- High-quality profiles for 4K/remux content
- Space-saving profiles for large libraries

**API Endpoint**: `POST /api/ai-agent/suggest-quality-profiles`

```json
{
  "config": { /* your PlexArr config */ },
  "service": "radarr"
}
```

### Connection Troubleshooting

When services fail to connect, the AI Agent can help diagnose the issue:
- Docker networking problems
- API key mismatches
- Port conflicts
- Configuration errors

**API Endpoint**: `POST /api/ai-agent/troubleshoot`

```json
{
  "config": { /* your PlexArr config */ },
  "sourceService": "prowlarr",
  "targetService": "radarr",
  "error": "Connection refused"
}
```

## Privacy & Security

### What the AI Agent Can Access

The AI Agent only has access to:
- Service names and enabled/disabled status
- Port configurations
- Storage paths
- System settings (timezone, PUID/PGID)

### What the AI Agent CANNOT Access

- Your API keys (except its own)
- Media files or library content
- Personal data
- Passwords or authentication credentials

### Data Transmission

- All communication with AI services is encrypted (HTTPS)
- API keys are stored encrypted in the PlexArr database
- No configuration data is stored by the AI provider
- Prompts are ephemeral and not logged by PlexArr

## Cost Considerations

### Gemini
- Free tier: 60 requests per minute
- Paid tier starts at $0.00025 per request
- **Estimated cost**: < $1/month for typical usage

### OpenAI GPT-4
- $0.03 per 1K input tokens
- $0.06 per 1K output tokens
- **Estimated cost**: $2-5/month for typical usage

### Anthropic Claude
- $0.015 per 1K input tokens
- $0.075 per 1K output tokens
- **Estimated cost**: $1-3/month for typical usage

## Best Practices

1. **Start with Gemini**: If you're new to AI-assisted configuration, start with Gemini's free tier
2. **Use for Initial Setup**: The AI Agent is most valuable during initial setup and major changes
3. **Review Suggestions**: Always review AI suggestions before applying them
4. **Disable When Not Needed**: You can disable the AI Agent after initial setup to avoid costs
5. **Keep Your API Key Secure**: Never share your API key publicly

## Troubleshooting

### "AI Agent is not enabled"
Make sure you've checked the "Enable AI Agent Assistant" box in the wizard and saved your configuration.

### "Invalid API Key"
Verify your API key is correct and has not expired. Some providers require billing to be enabled.

### "Rate limit exceeded"
You've exceeded your provider's rate limits. Wait a few minutes and try again, or upgrade your plan.

### "Failed to analyze configuration"
Check your internet connection and ensure the AI provider's API is accessible from your server.

## Disabling the AI Agent

You can disable the AI Agent at any time:

1. Go to Settings → AI Agent
2. Uncheck "Enable AI Agent Assistant"
3. Save your configuration

Your API key will remain encrypted in the database but will not be used.

## Example Use Cases

### Scenario 1: First-Time Setup
You're setting up PlexArr for the first time. Enable the AI Agent during the wizard and:
1. Let it analyze your configuration
2. Get indexer recommendations for your region
3. Receive quality profile suggestions
4. Get help if services fail to connect

### Scenario 2: Troubleshooting
Prowlarr won't connect to Radarr. Use the AI Agent to:
1. Analyze the error message
2. Get step-by-step troubleshooting instructions
3. Verify your configuration

### Scenario 3: Optimization
Your library is growing and you want to optimize storage. Use the AI Agent to:
1. Analyze your current quality profiles
2. Get recommendations for space-saving settings
3. Learn about optimal storage structures

## Support

For issues with the AI Agent:
1. Check the backend logs: `docker-compose logs plexarr-backend`
2. Verify your API key is valid
3. Check the provider's status page
4. Open an issue on GitHub with error details

## Future Enhancements

Planned features for the AI Agent:
- [ ] Automatic indexer configuration
- [ ] One-click quality profile application
- [ ] Proactive health monitoring
- [ ] Multi-language support
- [ ] Local LLM support (no API key required)
