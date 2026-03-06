import { Static } from '@sinclair/typebox';
/**
 * @SCHEMA
 * Questo schema è utilizzato dal plugin @fastify/env
 * Se la variavile NODE_ENV non è definita avrà il
 * default in 'development'
 *
 * DATABASE_URL è obbligatorio nello schema
 */
export declare const EnvSchema: import("@sinclair/typebox").TObject<{
    NODE_ENV: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"development">, import("@sinclair/typebox").TLiteral<"test">, import("@sinclair/typebox").TLiteral<"production">]>;
    DATABASE_URL: import("@sinclair/typebox").TString;
}>;
export type EnvConfig = Static<typeof EnvSchema>;
//# sourceMappingURL=env.d.ts.map