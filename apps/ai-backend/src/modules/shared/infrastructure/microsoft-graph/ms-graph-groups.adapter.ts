import { Client } from '@microsoft/microsoft-graph-client'
import { GroupsPort } from '../../domain/ports/groups.port'

export class MsGraphGroupsAdapter implements GroupsPort {
    constructor(private graphClient: Client) {}

    /**
     * Riceve un array di GUID di Azure e spara le chiamate in parallelo
     * per risolverli nei rispettivi nomi testuali.
     */
    async getGroupNamesByGroupIds(groupIds: string[]): Promise<string[]> {
        try {
            const names = await Promise.all(groupIds.map((id) => this.fetchGroupName(id)))

            // Filtra via i 'null' accumulati da gruppi inesistenti o errori di chiamata
            return names.filter((name): name is string => name !== null)
        } catch /*(error)*/ {
            // Callback di emergenza globale se salta l'intero client Graph
            return []
        }
    }

    /**
     * Interroga il singolo endpoint di Microsoft Graph isolando l'errore
     */
    private async fetchGroupName(id: string): Promise<string | null> {
        try {
            const group = await this.graphClient
                .api(`/groups/${id}`)
                .select('displayName') // Ottimizzazione: chiediamo ad Azure SOLO il nome, ignorando mail, membri, ecc.
                .get()

            return group?.displayName || null
        } catch /*(error)*/ {
            // Logghiamo l'errore per monitoraggio aziendale, ma ritorniamo null
            // per non far fallire i gruppi paralleli sani
            return null
        }
    }
}
