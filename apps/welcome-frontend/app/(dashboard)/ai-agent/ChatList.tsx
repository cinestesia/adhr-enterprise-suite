'use client'
import { Message } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { useEffect, useRef } from "react"
import ReactMarkdown from 'react-markdown'

export function ChatList({ messages, isLoading, isTyping }: { messages: Message[], isLoading:boolean, isTyping: boolean }) {
    const scrollEndRef = useRef<HTMLDivElement>(null)

    // Scroll to the bottom whenever the messages array updates
    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])


    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages && messages.map((msg, index) => (
                <div key={index} className={cn(`flex gap-3 max-w-[85%]`, msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    
                    { /* Avatar */ }

                    <div className={ cn( `h-8 w-8 rounded-lg flex items-center justify-center shrink-0`, msg.role === 'assistant' ? 'bg-primary text-white' : 'bg-adhr-zinc-light')}>
                        {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                    </div>

                    {/* Bolla del messaggio con Markdown */}
                    
                    <div className={cn(
                        "w-fit px-4 py-2 text-sm leading-relaxed shadow-sm ",
                        msg.role === 'user' ? 
                            "bg-adhr-zinc-strong text-white rounded-2xl rounded-tr-none ml-auto" // Angolo top-right piatto
                            : "bg-white border border-adhr-zinc-light text-adhr-zinc-strong rounded-2xl rounded-tl-none" // Angolo top-left piatto
                    )}>
                    
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>
                                {msg.content}
                            </ReactMarkdown>
                        </div>

                    </div> 
                </div>
            ))}

            {/* Elemento "ancora" per lo scroll automatico */}            
            <div ref={scrollEndRef} />

            {isLoading && !isTyping && (
                <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div className="bg-zinc-100 px-4 py-2 rounded-2xl rounded-tl-none border border-zinc-200 shadow-sm">
                            <span className="flex gap-1 py-1">
                                <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}