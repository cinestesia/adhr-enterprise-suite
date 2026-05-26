// app/(dashboard)/ai-agent/page.tsx

import { AIAgentContainer } from '@/features/chat/components/AiAgentContainer'

export default function NewChatPage() {
  // Passiamo undefined o 'new' per indicare che è una nuova sessione
  return <AIAgentContainer sessionId={undefined} />
}
