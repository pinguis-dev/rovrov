# Supabase MCP Server Setup for Claude Code

This project is configured to use the Supabase MCP server with Claude Code, allowing direct interaction with your Supabase database through Claude.

## Setup Instructions

1. **Create your `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials** to the `.env` file:
   - Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your [Supabase project dashboard](https://supabase.com/dashboard)
   - Navigate to: Project Settings → API → Project URL and Project API keys

3. **Install the Supabase MCP server** (if not already installed globally):
   ```bash
   npm install -g @supabase/mcp-server
   ```

4. **Restart Claude Code** to load the new MCP server configuration.

## Configuration Files

- **`.claude-code.json`**: Contains the MCP server configuration for Claude Code
- **`.env`**: Contains your Supabase credentials (create from `.env.example`)

## What this enables

With the Supabase MCP server configured, Claude Code can:
- Query your Supabase database directly
- View table schemas and data
- Help with database migrations and queries
- Assist with Supabase-related development tasks

## Security Note

The `.env` file contains sensitive credentials and should never be committed to version control. It's already included in `.gitignore`.