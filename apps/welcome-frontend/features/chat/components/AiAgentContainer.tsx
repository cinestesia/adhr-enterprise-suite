'use client'
import { ChatInput } from '@/features/chat/components/ChatInput'
import { ChatList } from '@/features/chat/components/ChatList'
import { useChat } from '@/features/chat/hooks/use-chat'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { WifiOff, Bot } from 'lucide-react'

interface AiAgentContainerProps {
  sessionId?: string
}

export function AIAgentContainer({ sessionId }: AiAgentContainerProps) {
  const { error, messages, isLoading, isTyping, sendMessage } = useChat(sessionId)
  const isOnline = useOnlineStatus()
  return (
    <>
      {!isOnline && (
        <Alert
          variant="warning"
          className="mb-4 animate-in slide-in-from-top border-amber-200 bg-amber-50"
        >
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold text-xs">
            Sei offline
          </AlertTitle>
          <AlertDescription className="text-amber-700 text-xs">
            I messaggi verranno inviati non appena la connessione tornerà disponibile.
          </AlertDescription>
        </Alert>
      )}

      <ChatList
        error={error}
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
      />

      <div className="mt-auto pt-4">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
        <p className="text-[10px] text-center text-zinc-400 mt-2 italic">
          L'AI può generare errori. Verifica le informazioni importanti.
        </p>
      </div>
    </>
  )
}
