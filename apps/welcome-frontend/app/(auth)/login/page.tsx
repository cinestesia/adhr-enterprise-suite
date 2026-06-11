'use client'
import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  useEffect(() => {
    // login automatico con Keycloak ok
    signIn('keycloak')
  }, [])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h1 className="text-xl font-semibold text-slate-700">Autenticazione in corso</h1>
        <p className="text-sm text-slate-500">
          Ti stiamo trasferendo al portale di accesso sicuro...
        </p>
      </div>  
    </div>
  )
}
