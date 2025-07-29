// API Configuration

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getWebSocketUrl = (baseUrl: string = API_URL): string => {
  return baseUrl.replace(/^http/, 'ws')
}