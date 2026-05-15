import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        idToken?: string,
        accessToken?: string,
        user: {
            groups: string[]
            roles: string[]
        } & DefaultSession['user']
    }
}

declare module 'next-auth/jwt' {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        idToken?: string
        groups: string[]
        roles: string[]
    }
}
