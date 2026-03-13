import {headers } from 'next/headers'
export async function ConfigServerSide() {
    
    // Chiamare headers() forza Next.js a rinunciare alla cache statica della build
    const _headerList = headers();
    return (
        <section className="p-8 bg-gray-100 rounded-xl shadow-md shadow-slate-300">
            
            <h1 className="font-mono text-xl">Ambiente visto dal server: {process.env['ENVIRONMENT']} </h1>
            
            <ul className="p-8 list-decimal">

                <li>
                    <div className="p-4 flex gap-2 border-b border-gray-400 md:border-b-0">
                        <span className="font-semibold font-mono text-xl">AUTH_KEYCLOAK_ISSUER</span>
                        <span className="break-all text-sm">{process.env['AUTH_KEYCLOAK_ISSUER']}</span>
                    </div>
                </li>

                <li>
                    <div className="p-4 flex gap-2 border-b border-gray-400 md:border-b-0">
                        <span className="font-semibold font-mono text-xl">WELCOME_AUTH_URLOS</span>
                        <span className="break-all text-sm">{process.env['WELCOME_AUTH_URL']}</span>
                    </div>
                </li>

            </ul>
        </section>
    )
}
