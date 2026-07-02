import { apiFetch } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
