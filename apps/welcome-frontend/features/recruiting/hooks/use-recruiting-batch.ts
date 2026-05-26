'use client'

import { useEffect, useRef } from 'react'
import { CandidateFileBatch } from '../components/AtsContainer'
import { extractCvStream } from '../services/recruiting.service'

const MAX_CONCURRENT_REQUESTS = 2

export function useRecruitingBatch(
    files: CandidateFileBatch[],
    setFiles: React.Dispatch<React.SetStateAction<CandidateFileBatch[]>>
) {
    // Manteniamo il ref aggiornato per evitare loop infiniti
    const filesRef = useRef<CandidateFileBatch[]>(files)
    filesRef.current = files

    useEffect(() => {
        const processingCount = files.filter((f) => f.status === 'processing').length

        if (processingCount >= MAX_CONCURRENT_REQUESTS) return

        const nextFile = files.find((f) => f.status === 'idle')
        if (!nextFile) return

        // Portiamo lo stato a processing e inizializziamo i micro-stati di progressione
        setFiles((prev) =>
            prev.map((f) =>
                f.id === nextFile.id
                    ? {
                          ...f,
                          status: 'processing',
                          stage: 'parsing_pdf',
                          fileProgress: 5,
                      }
                    : f
            )
        )

        // Lanciamo lo stream verso il BFF di Next.js
        extractCvStream(nextFile.fileObject)
            .then(async (response) => {
                const reader = response.body?.getReader()
                const decoder = new TextDecoder()

                if (!reader) {
                    throw new Error(
                        'Impossibile agganciare lo stream di lettura del file'
                    )
                }

                let bufferStr = ''
                let jsonAccumulator = ''
                let fakeProgressInterval: NodeJS.Timeout | null = null

                // Funzione helper locale per aggiornare la progressione interna di questo file
                const updateProgress = (
                    stage: CandidateFileBatch['stage'],
                    progress: number
                ) => {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === nextFile.id
                                ? { ...f, stage, fileProgress: progress }
                                : f
                        )
                    )
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        // Decodifichiamo il chunk binario in stringa grezza SSE
                        bufferStr += decoder.decode(value, { stream: true })
                        const lines = bufferStr.split('\n')

                        // L'ultimo elemento potrebbe essere incompleto, lo rimettiamo nel buffer per il prossimo ciclo
                        bufferStr = lines.pop() || ''

                        for (const line of lines) {
                            const cleanedLine = line.trim()
                            if (!cleanedLine || !cleanedLine.startsWith('data: '))
                                continue

                            // Estraiamo il JSON dell'evento SSE inviato dal nostro helper di Fastify
                            const rawJson = cleanedLine.replace(/^data: /, '')
                            let event
                            try {
                                event = JSON.parse(rawJson)
                            } catch (e) {
                                continue // Frammento incompleto o corrotto, saltiamo al prossimo
                            }

                            // ─── GESTIONE DEGLI EVENTI SSE PERSONALIZZATI ───

                            if (event.type === 'status') {
                                if (event.content === 'parsing_pdf') {
                                    updateProgress('parsing_pdf', 15)
                                } else if (event.content === 'ollama_inference') {
                                    updateProgress('ollama_inference', 25)

                                    // 🌟 FLUIDIFICATORE UX: Ollama su CPU impiega tempo prima di sputare il primo token.
                                    // Creiamo un finto avanzamento incrementale per dare feedback visivo dinamico.
                                    let currentFake = 25
                                    fakeProgressInterval = setInterval(() => {
                                        if (currentFake < 80) {
                                            currentFake +=
                                                Math.floor(Math.random() * 3) + 1 // Incremento organico (+1% o +3%)
                                            setFiles((prev) =>
                                                prev.map((f) =>
                                                    f.id === nextFile.id
                                                        ? {
                                                              ...f,
                                                              fileProgress: currentFake,
                                                          }
                                                        : f
                                                )
                                            )
                                        }
                                    }, 1500)
                                }
                            }

                            if (event.type === 'token') {
                                // Rimuoviamo il fluidificatore finto non appena iniziano ad arrivare i token reali
                                if (fakeProgressInterval) {
                                    clearInterval(fakeProgressInterval)
                                    fakeProgressInterval = null
                                }

                                // Accumuliamo il pezzo di JSON
                                jsonAccumulator += event.content

                                // Calcoliamo una percentuale proporzionale dinamica tra il 80% e il 98%
                                const currentLength = jsonAccumulator.length
                                const estimatedTotal = 1500 // Dimensione media stimata di un JSON di un candidato
                                const tokenProgress = Math.min(
                                    80 +
                                        Math.floor((currentLength / estimatedTotal) * 18),
                                    98
                                )

                                updateProgress('receiving_data', tokenProgress)
                            }

                            if (event.type === 'error') {
                                throw new Error(
                                    event.error?.message ||
                                        'Errore generato dal motore AI'
                                )
                            }

                            if (event.type === 'done') {
                                if (fakeProgressInterval)
                                    clearInterval(fakeProgressInterval)

                                // 🏁 TRAGUARDO: Lo stream è completo. Convertiamo l'accumulatore nel JSON tipizzato final
                                const cleanJsonContent = jsonAccumulator.trim()

                                // Pulizia preventiva da eventuali blocchi markdown inseriti per errore dall'LLM
                                const jsonStart = cleanJsonContent.indexOf('{')
                                const jsonEnd = cleanJsonContent.lastIndexOf('}')

                                if (jsonStart === -1 || jsonEnd === -1) {
                                    throw new Error(
                                        'Il flusso dati generato non contiene una struttura anagrafica valida.'
                                    )
                                }

                                const finalParsedData = JSON.parse(
                                    cleanJsonContent.substring(jsonStart, jsonEnd + 1)
                                )

                                setFiles((prev) =>
                                    prev.map((f) =>
                                        f.id === nextFile.id
                                            ? {
                                                  ...f,
                                                  status: 'success',
                                                  fileProgress: 100,
                                                  extractedData: finalParsedData,
                                              }
                                            : f
                                    )
                                )
                            }
                        }
                    }
                } catch (streamError: any) {
                    if (fakeProgressInterval) clearInterval(fakeProgressInterval)
                    throw streamError
                }
            })
            .catch((error: any) => {
                // Intercettiamo gli errori di rete, di Zod (400) o interni allo stream (Ollama crash)
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === nextFile.id
                            ? {
                                  ...f,
                                  status: 'error',
                                  fileProgress: 0,
                                  error:
                                      error.message ||
                                      'Errore sconosciuto durante lo screening',
                              }
                            : f
                    )
                )
            })
    }, [files, setFiles])

    const clearBatch = () => setFiles([])

    return {
        clearBatch,
        isProcessingBatch: files.some((f) => f.status === 'processing'),
        globalProgress:
            files.length > 0
                ? Math.round(
                      (files.filter((f) => ['success', 'error'].includes(f.status))
                          .length /
                          files.length) *
                          100
                  )
                : 0,
    }
}
