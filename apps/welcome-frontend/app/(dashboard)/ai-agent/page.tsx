'use client'
import { ChatInput } from "./ChatInput";
import { ChatList } from "./ChatList";
import { useChat } from "@/hooks/use-chat";
import { useOnlineStatus } from "@/hooks/use-online-status";
export default function AIAgentPage() {

    const { messages, isLoading, isTyping, sendMessage } = useChat()
    const isOnline = useOnlineStatus() 
    
    return (
        <>
            {!isOnline && (
                <div className="absolute top-0 left-0 w-full bg-amber-500 text-white text-xs py-1 text-center font-bold z-50 animate-in slide-in-from-top">
                    Connessione assente. Le tue domande verranno inviate quando tornerai online.
                </div>
            )}
            
            <ChatList 
                messages={messages} 
                isLoading={isLoading} // Passalo qui
                isTyping={isTyping}   // Passalo qui
            />

            <ChatInput onSend={sendMessage} disabled={ isLoading }/>
        </>
    )    
}