import type { CategoryId } from './types'

export interface CategoryDef {
  id: CategoryId
  icon: string
  labelHe: string
  labelEn: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'home', icon: '🏠', labelHe: 'בית', labelEn: 'Home' },
  { id: 'work', icon: '💼', labelHe: 'עבודה', labelEn: 'Work' },
  { id: 'money', icon: '💰', labelHe: 'כסף', labelEn: 'Money' },
  { id: 'shopping', icon: '🛒', labelHe: 'קניות', labelEn: 'Shopping' },
  { id: 'food', icon: '🍽️', labelHe: 'אוכל', labelEn: 'Food' },
  { id: 'travel', icon: '✈️', labelHe: 'נסיעות', labelEn: 'Travel' },
  { id: 'relationships', icon: '❤️', labelHe: 'מערכות יחסים', labelEn: 'Relationships' },
  { id: 'technology', icon: '💻', labelHe: 'טכנולוגיה', labelEn: 'Technology' },
  { id: 'education', icon: '📚', labelHe: 'חינוך', labelEn: 'Education' },
  { id: 'health', icon: '🏥', labelHe: 'בריאות', labelEn: 'Health' },
  { id: 'environment', icon: '🌎', labelHe: 'סביבה', labelEn: 'Environment' },
  { id: 'news', icon: '📰', labelHe: 'חדשות', labelEn: 'News' },
  { id: 'business', icon: '📈', labelHe: 'עסקים', labelEn: 'Business' },
]

export function getCategory(id: CategoryId): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}
