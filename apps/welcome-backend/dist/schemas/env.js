"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
/**
 * @SCHEMA
 * Questo schema è utilizzato dal plugin @fastify/env
 * Se la variavile NODE_ENV non è definita avrà il
 * default in 'development'
 *
 * DATABASE_URL è obbligatorio nello schema
 */
exports.EnvSchema = typebox_1.Type.Object({
    NODE_ENV: typebox_1.Type.Union([
        typebox_1.Type.Literal('development'),
        typebox_1.Type.Literal('test'),
        typebox_1.Type.Literal('production')
    ], { default: 'development' }),
    DATABASE_URL: typebox_1.Type.String()
});
