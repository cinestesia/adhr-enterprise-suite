import { Type, Static } from '@sinclair/typebox';

/**
 * @SCHEMA
 * Questo schema è utilizzato dal plugin @fastify/env  
 * Se la variavile NODE_ENV non è definita avrà il 
 * default in 'development'
 * 
 * DATABASE_URL è obbligatorio nello schema
 */

export const EnvSchema = Type.Object({
	
	NODE_ENV: Type.Union([
    	Type.Literal('development'),
    	Type.Literal('test'),
    	Type.Literal('production')
  	], { default: 'development' }),
  	
	DATABASE_URL: Type.String() 
});

export type EnvConfig = Static<typeof EnvSchema>