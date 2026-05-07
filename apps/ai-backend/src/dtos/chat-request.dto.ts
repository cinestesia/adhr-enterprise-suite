// src/application/dtos/chat-request.dto.ts
import { User } from '@/domain/models/user.model';
import { z } from 'zod';

export const ChatRequestSchema = z.object({
    message: z.string().min(1, "Il messaggio è obbligatorio"),
    sessionId: z.string().uuid().optional(),
    user: z.instanceof(User) 
});

export type ChatRequestDTO = z.infer<typeof ChatRequestSchema>;