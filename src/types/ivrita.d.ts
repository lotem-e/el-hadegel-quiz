// Ivrita ships no TypeScript types, so this describes the small part of it
// we use: the gender constants and the pure genderize() function.
declare module 'ivrita/src/ivrita' {
  export const ORIGINAL: number
  export const MALE: number
  export const FEMALE: number
  export const NEUTRAL: number
  export const GENDERS: number[]
  export function genderize(text: string, gender: number): string
}
