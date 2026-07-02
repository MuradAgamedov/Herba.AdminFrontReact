import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/auth'
import { ApiError } from '../api/client'
import { decodeToken, isTokenExpired, type AuthUser } from './jwt'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem('token')
  if (!token) return null

  const user = decodeToken(token)
  if (!user || isTokenExpired(user.exp)) {
    localStorage.removeItem('token')
    return null
  }

  return user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(email: string, password: string) {
        try {
          const { token } = await loginRequest({ email, password })
          localStorage.setItem('token', token)
          setUser(decodeToken(token))
        } catch (err) {
          if (err instanceof ApiError) {
            throw new Error(err.message || 'Giriş məlumatları yanlışdır!')
          }
          throw new Error('Serverə qoşulmaq mümkün olmadı')
        }
      },
      logout() {
        localStorage.removeItem('token')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
