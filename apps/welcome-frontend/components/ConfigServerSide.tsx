import {headers } from 'next/headers'
export async function ConfigServerSide() {
    
    // Chiamare headers() forza Next.js a rinunciare alla cache statica della build
    const _headerList = headers();
    return (
        <section className="p-8 bg-gray-100 rounded-lg shadow-md">
            
            <h1 className="font-mono text-xl">Ambiente visto dal server: {process.env['AMBIENTE']} </h1>
            
            <ul className="p-8 list-decimal">

                <li>
                    <div className="p-4 flex gap-2 border-b border-gray-400 md:border-b-0">
                        <span className="font-semibold">DATABASE URL</span>
                        <span className="break-all text-sm">{process.env['DATABASE_URL']}</span>
                    </div>
                </li>

            </ul>
        </section>
    )
}