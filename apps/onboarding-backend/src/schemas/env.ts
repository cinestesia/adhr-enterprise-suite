import { Type, Static } from '@sinclair/typebox';

export const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('test'),
    Type.Literal('production')
  ], { default: 'development' }),
  PORT: Type.Number({ default: 3001 }),
  LOG_LEVEL: Type.String({ default: 'info' }),
  // Qui aggiungi le tue variabili reali
  DATABASE_URL: Type.String() 
});

export type EnvConfig = Static<typeof EnvSchema>