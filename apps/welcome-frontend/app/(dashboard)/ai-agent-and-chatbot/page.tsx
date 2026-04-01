'use client'
import { useState, useRef } from 'react'
import { Paperclip, Send, Bot, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAgentAndChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Ciao! Sono l'assistente AI-ADHR GDPR FIRST! Come posso aiutarti oggi? Puoi farmi domande generali o caricarmi un file (CV / Documento) da analizzare.",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.body) return
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      // Prepariamo il messaggio vuoto dell'AI
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      // 1. Questa variabile accumulerà tutto il testo pulito dell'AI man mano che arriva
      let fullResponseText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim()
            if (jsonStr === '[DONE]') continue
            
            try {
              const data = JSON.parse(jsonStr)
              
              let token = ''
              // Estraiamo il testo a seconda di come risponde il tuo backend
              if (data.text) {
                token = data.text
              } else if (data.content) {
                token = data.content
              }

              // 2. Se abbiamo trovato del testo nuovo...
              if (token) {
                // Lo aggiungiamo al nostro accumulatore esterno
                fullResponseText += token

                setMessages((prev) => {
                  const updated = [...prev]
                  const lastIndex = updated.length - 1
                  
                  // 3. Rimpiazziamo l'intero contenuto dell'ultimo messaggio!
                  // Invece di fare += (che sdoppiava le parole), sovrascriviamo con la stringa completa
                  updated[lastIndex].content = fullResponseText
                  
                  return updated
                })
              }
            } catch (e) {
              // Ignoriamo i chunk incompleti tipici di SSE
            }
          }
        }
      }
    } catch (error) {
      console.error('Errore durante la chat:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    alert(`File "${file.name}" pronto per l'estrazione testo e calcolo vettoriale!`)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. HEADER (Usa lo stesso stile della tua Home) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            AI Agent & Chatbot
          </h1>
          <p className="text-zinc-500 font-medium">
            Sperimentazione RAG e Analisi Documentale Privata.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 shadow-sm w-fit text-sm font-bold">
          <CheckCircle2 className="size-4" />
          Modello Locale Connesso
        </div>
      </div>

      {/* 2. CHAT CONTAINER */}
      <Card className="border-none shadow-lg overflow-hidden ring-1 ring-zinc-200">
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-lg font-bold text-zinc-900">
            Conversazione con Copilot
          </CardTitle>
          <CardDescription className="font-medium text-zinc-500">
            I messaggi inviati non lasciano la rete aziendale.
          </CardDescription>
        </CardHeader>

        {/* Box Messaggi */}
        <CardContent className="p-6 bg-zinc-50 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-4 max-w-[75%]">
                  {msg.role === 'assistant' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#A00407] text-white shadow-md">
                      <Bot className="size-5" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-zinc-900 text-white rounded-br-none'
                        : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-zinc-700 shadow-sm">
                      <User className="size-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#A00407] text-white shadow-md">
                    <Bot className="size-5" />
                  </div>
                  <div className="p-4 rounded-2xl text-sm font-medium bg-white border border-zinc-200 text-zinc-500 rounded-bl-none shadow-sm flex items-center gap-2">
                    L&apos;AI sta generando una risposta
                    <span className="flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce [animation-delay:0.2s]">.</span>
                      <span className="animate-bounce [animation-delay:0.4s]">.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form coordinato */}
          <div className="mt-6 flex gap-3 items-center bg-white p-2 rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-[#A00407]/20 focus-within:border-[#A00407]/50 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".txt,.pdf,.md"
            />

            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-[#A00407] hover:bg-red-50 rounded-lg shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Carica un CV o documento"
            >
              <Paperclip className="size-5" />
            </Button>

            <Input
              placeholder="Chiedi supporto o digita un comando..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 shadow-none bg-transparent font-medium"
            />

            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-[#A00407] hover:bg-[#800305] text-white rounded-lg px-4 font-bold shadow-md shrink-0"
            >
              <Send className="size-4 mr-2" /> Invia
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
