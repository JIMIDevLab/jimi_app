// Base URL of the JIMI Spring Boot API.
//
// Resolution order (the first non-empty value wins):
//   1. process.env.EXPO_PUBLIC_API_URL — baked into the bundle at build time.
//      Set as a build arg in Docker (`--build-arg EXPO_PUBLIC_API_URL=...`)
//      so the same image can be reused across environments.
//   2. The fallback below — used for local dev against a Spring Boot API
//      running on http://localhost:8080.
//
// Examples:
//   - Dev:  http://localhost:8080
//   - Prod: https://jimi-api.julsql.fr
const FALLBACK_BASE_URL = 'http://localhost:8080';

export const ApiConstants = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || FALLBACK_BASE_URL,
  sendMessage: '/chat',
} as const;
