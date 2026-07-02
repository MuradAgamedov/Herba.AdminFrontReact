export interface JwtClaims {
  sub: string
  userId: string
  Name: string
  SurName: string
  Email: string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string
  exp: number
  iss: string
  aud: string
}

export interface AuthUser {
  userId: string
  username: string
  name: string
  surName: string
  email: string
  role: string
  exp: number
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as JwtClaims

    return {
      userId: claims.userId,
      username: claims.sub,
      name: claims.Name,
      surName: claims.SurName,
      email: claims.Email,
      role: claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      exp: claims.exp,
    }
  } catch {
    return null
  }
}

export function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000
}
