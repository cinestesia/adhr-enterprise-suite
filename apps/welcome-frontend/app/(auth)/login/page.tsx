"use client"
import { useEffect } from "react"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  useEffect(() => {
    // login automatico con Keycloak
    signIn("keycloak")
  }, [])

  return <p>Redirecting to Keycloak...</p>
}