"use client"

export function ConfigClientSide() {
    return (
        <section className="p-8 bg-gray-100 rounded-lg shadow-md">
            <h1 className="font-mono text-xl">Ambiente visto dal client: {process.env.NEXT_PUBLIC_NODE_ENV} </h1>
            <ul className="p-8 list-decimal">
                
                <li>
                    <div className="flex gap-2">
                        <span className="font-semibold">DATABASE URL</span>
                        <span className="break-all text-sm">{process.env.NEXT_PUBLIC_DATABASE_URL}</span>
                    </div>
                </li>
            </ul>
        </section>
    )
}