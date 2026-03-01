export function ConfigServerSide() {
    return (
        <section className="p-8 bg-gray-100 rounded-lg shadow-md">
            <h1 className="font-mono text-xl">Ambiente: {process.env.NEXT_PUBLIC_ENVIRONMENT} </h1>
            <ul className="p-8">
                
                <li className="flex gap-4">
                    <span>DATABASE URL</span>
                    <span>{process.env.NEXT_PUBLIC_DATABASE_URL}</span>
                </li>

                <li className="flex gap-4">
                    <span>ENVIRONMENT</span>
                    <span>{process.env.NEXT_PUBLIC_ENVIRONMENT}</span>
                </li>
                
                <li className="flex gap-4">
                    <span>SERVER ONLY VAR</span>
                    <span>{process.env.SERVER_ONLY_VAR}</span>
                </li>

            </ul>
        </section>
    )
}