import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";
import { useState } from "react";

export function ChatInput({ onSend, disabled } : 
    { onSend: (val:string) => void, disabled: boolean }) {

        const [input, setInput] = useState("")

        const handleKeyDown = (e: React.KeyboardEvent) => {
            // Invia con Enter, ma vai a capo con Shift + Enter
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !disabled) {
                    onSend(input)
                    setInput('')
                }
            }
        }

        return (
            <div className="p-4 bg-white border-t border-adhr-zinc-light">
                
                <div className="relative flex items-end gap-2 max-w-4xl  border border-adhr-zinc-light rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary transition-all">
                    <Button variant="ghost" size="icon" className="shrink-0 text-zinc-500">
                        <Paperclip size={20} />
                    </Button> 

                    <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Chiedi supporto..."
                        className="flex-1 bg-transparent border-none focus:outline-none resize-none py-2 text-sm max-h-32"
                        disabled={disabled}
                    /> 

                    <Button 
                        variant="default"
                        onClick={() => { onSend(input); setInput(''); }}
                        disabled={!input.trim() || disabled}
                        size="icon"
                        className="text-white w-fit p-4"
                    >
                        Invia&nbsp;
                        <Send size={18} />
                    
                    </Button>

                </div>
            </div>
        )



}   
