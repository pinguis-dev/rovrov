#!/usr/bin/env node
// Apply a local .sql file against the Supabase project via the MCP server
// Usage: node scripts/apply-sql.cjs <path-to-sql>

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (_) {}

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('Usage: node scripts/apply-sql.cjs <path-to-sql>');
  process.exit(1);
}

const absPath = path.resolve(process.cwd(), sqlPath);
if (!fs.existsSync(absPath)) {
  console.error(`SQL file not found: ${absPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(absPath, 'utf8');

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport, getDefaultEnvironment } = require('@modelcontextprotocol/sdk/client/stdio.js');

// Load MCP server config
const cfgRaw = fs.readFileSync(path.resolve(process.cwd(), '.mcp.json'), 'utf8');
const cfg = JSON.parse(cfgRaw);
const server = cfg.mcpServers?.supabase || cfg.servers?.supabase;
if (!server) {
  console.error('No supabase MCP server defined in .mcp.json');
  process.exit(1);
}

function expandEnv(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\$\{env:([A-Z0-9_]+)\}/g, (_, k) => process.env[k] || '')
    .replace(/\$([A-Z0-9_]+)/g, (_, k) => process.env[k] || '');
}

const env = { ...getDefaultEnvironment(), ...(server.env || {}) };
for (const k of Object.keys(env)) env[k] = expandEnv(env[k]);

const transport = new StdioClientTransport({
  command: server.command || 'npx',
  args: Array.isArray(server.args) ? server.args.slice() : [],
  env,
  stderr: 'inherit',
  cwd: process.cwd(),
});

const client = new Client({ name: 'rovrov-sql-apply', version: '1.0.0' });

(async () => {
  try {
    await client.connect(transport);
    const res = await client.callTool({ name: 'execute_sql', arguments: { query: sql } });
    const output = (res.content?.[0]?.text ?? '').toString();
    console.log(output);
  } catch (e) {
    console.error('Failed to apply SQL:', e.message || e);
    process.exit(1);
  } finally {
    try { await client.close?.(); } catch (_) {}
    try { await transport.close?.(); } catch (_) {}
  }
})();

