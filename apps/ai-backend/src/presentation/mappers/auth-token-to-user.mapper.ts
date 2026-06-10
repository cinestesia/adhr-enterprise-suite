// presentation/mappers/auth.mapper.ts
import { User } from '@/modules/shared/domain/models/user.model'

export class AuthTokenToUserMapper {
    static toDomain(jwtPayload: any): User {
        return new User(
            jwtPayload.sub,
            jwtPayload.email,
            jwtPayload.groups || [],
            jwtPayload.name
        )
    }
}
