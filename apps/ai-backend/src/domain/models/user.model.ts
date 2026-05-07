export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly groups: string[],
        public readonly name?: string
    ) {}

    get mainDepartment(): string {
        if (this.groups.length === 0) return 'Generale';
        // Prendiamo l'ultimo segmento del gruppo
        const lastGroup = this.groups[this.groups.length - 1];
        return lastGroup.split('/').pop() || 'Generale';
    }

    isAdmin(): boolean {
        return this.groups.includes('/Admin');
    }
}