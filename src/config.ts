import fs from 'node:fs';
import { z } from 'zod';
import YAML from 'yaml';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  BIND_ADDRESS: z.string().default('0.0.0.0'),
  RELAY_CONTROL_CONFIG: z.string().default('/etc/relay-control/relay-control.yaml'),
  RELAY_CONTROL_API_KEYS: z.string().min(16),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
});

const relaySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  gpio: z.number().int().min(0).max(1024),
  activeLow: z.boolean().default(false),
  startupState: z.enum(['on', 'off']).default('off'),
  enabled: z.boolean().default(true)
});

const fileSchema = z.object({
  controller: z.object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(128),
    location: z.string().max(128).optional()
  }),
  relays: z.array(relaySchema).min(1)
}).superRefine((value, ctx) => {
  const ids = new Set<string>();
  const gpios = new Set<number>();

  value.relays.forEach((relay, index) => {
    if (ids.has(relay.id)) {
      ctx.addIssue({ code: 'custom', message: `Duplicate relay id: ${relay.id}`, path: ['relays', index, 'id'] });
    }
    ids.add(relay.id);

    if (gpios.has(relay.gpio)) {
      ctx.addIssue({ code: 'custom', message: `GPIO ${relay.gpio} is assigned more than once`, path: ['relays', index, 'gpio'] });
    }
    gpios.add(relay.gpio);
  });
});

export type RelayDefinition = z.infer<typeof relaySchema>;
export type RelayControlFile = z.infer<typeof fileSchema>;

export function loadConfiguration() {
  const env = envSchema.parse(process.env);
  const raw = fs.readFileSync(env.RELAY_CONTROL_CONFIG, 'utf8');
  const file = fileSchema.parse(YAML.parse(raw));

  const apiKeys = env.RELAY_CONTROL_API_KEYS
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  if (apiKeys.length === 0) {
    throw new Error('At least one RELAY_CONTROL_API_KEYS value is required');
  }

  return { env, file, apiKeys };
}
