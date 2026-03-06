"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const schema_1 = require("./schema");
async function default_1(fastify) {
    fastify.get('/', {
        schema: { response: { 200: schema_1.RootResponseSchema } },
        handler: async () => {
            // Chiamata al service (Logica di business)
            return { status: 'ok', message: `Welcome backend ( ${process.env.NODE_ENV} ) is up and running!` };
        }
    });
}
