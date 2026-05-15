// app/(dashboard)/ai-agent/[sessionId]/page.tsx

import { AIAgentContainer } from "@/features/chat/components/AiAgentContainer"

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  // Passiamo il sessionId al componente client
  return <AIAgentContainer sessionId={sessionId} />
}