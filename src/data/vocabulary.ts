import type { VocabItem } from '../types'

// Concept vocabulary shared across all 4 languages, grouped by difficulty level.
// Each concept carries an emoji (usable for image-matching / listening games)
// and text in he / en / ar / es.
export const VOCABULARY: VocabItem[] = [
  // ---------------- BEGINNER ----------------
  { id: 'cat', emoji: '🐱', level: 'beginner', category: 'animals', text: { he: 'חתול', en: 'Cat', ar: 'قطة', es: 'Gato' } },
  { id: 'dog', emoji: '🐶', level: 'beginner', category: 'animals', text: { he: 'כלב', en: 'Dog', ar: 'كلب', es: 'Perro' } },
  { id: 'sun', emoji: '☀️', level: 'beginner', category: 'nature', text: { he: 'שמש', en: 'Sun', ar: 'شمس', es: 'Sol' } },
  { id: 'moon', emoji: '🌙', level: 'beginner', category: 'nature', text: { he: 'ירח', en: 'Moon', ar: 'قمر', es: 'Luna' } },
  { id: 'apple', emoji: '🍎', level: 'beginner', category: 'food', text: { he: 'תפוח', en: 'Apple', ar: 'تفاحة', es: 'Manzana' } },
  { id: 'ball', emoji: '⚽', level: 'beginner', category: 'toys', text: { he: 'כדור', en: 'Ball', ar: 'كرة', es: 'Pelota' } },
  { id: 'water', emoji: '💧', level: 'beginner', category: 'nature', text: { he: 'מים', en: 'Water', ar: 'ماء', es: 'Agua' } },
  { id: 'house', emoji: '🏠', level: 'beginner', category: 'home', text: { he: 'בית', en: 'House', ar: 'بيت', es: 'Casa' } },
  { id: 'red', emoji: '🔴', level: 'beginner', category: 'colors', text: { he: 'אדום', en: 'Red', ar: 'أحمر', es: 'Rojo' } },
  { id: 'blue', emoji: '🔵', level: 'beginner', category: 'colors', text: { he: 'כחול', en: 'Blue', ar: 'أزرق', es: 'Azul' } },
  { id: 'one', emoji: '1️⃣', level: 'beginner', category: 'numbers', text: { he: 'אחת', en: 'One', ar: 'واحد', es: 'Uno' } },
  { id: 'two', emoji: '2️⃣', level: 'beginner', category: 'numbers', text: { he: 'שתיים', en: 'Two', ar: 'اثنان', es: 'Dos' } },
  { id: 'star', emoji: '⭐', level: 'beginner', category: 'nature', text: { he: 'כוכב', en: 'Star', ar: 'نجمة', es: 'Estrella' } },
  { id: 'fish', emoji: '🐟', level: 'beginner', category: 'animals', text: { he: 'דג', en: 'Fish', ar: 'سمكة', es: 'Pez' } },
  { id: 'bird', emoji: '🐦', level: 'beginner', category: 'animals', text: { he: 'ציפור', en: 'Bird', ar: 'طائر', es: 'Pájaro' } },

  // ---------------- BASIC ----------------
  { id: 'mother', emoji: '👩', level: 'basic', category: 'family', text: { he: 'אמא', en: 'Mother', ar: 'أم', es: 'Madre' } },
  { id: 'father', emoji: '👨', level: 'basic', category: 'family', text: { he: 'אבא', en: 'Father', ar: 'أب', es: 'Padre' } },
  { id: 'friend', emoji: '🧑‍🤝‍🧑', level: 'basic', category: 'people', text: { he: 'חבר', en: 'Friend', ar: 'صديق', es: 'Amigo' } },
  { id: 'book', emoji: '📖', level: 'basic', category: 'school', text: { he: 'ספר', en: 'Book', ar: 'كتاب', es: 'Libro' } },
  { id: 'school', emoji: '🏫', level: 'basic', category: 'school', text: { he: 'בית ספר', en: 'School', ar: 'مدرسة', es: 'Escuela' } },
  { id: 'eat', emoji: '🍽️', level: 'basic', category: 'actions', text: { he: 'לאכול', en: 'To eat', ar: 'يأكل', es: 'Comer' } },
  { id: 'run', emoji: '🏃', level: 'basic', category: 'actions', text: { he: 'לרוץ', en: 'To run', ar: 'يجري', es: 'Correr' } },
  { id: 'sleep', emoji: '😴', level: 'basic', category: 'actions', text: { he: 'לישון', en: 'To sleep', ar: 'ينام', es: 'Dormir' } },
  { id: 'happy', emoji: '😄', level: 'basic', category: 'feelings', text: { he: 'שמח', en: 'Happy', ar: 'سعيد', es: 'Feliz' } },
  { id: 'sad', emoji: '😢', level: 'basic', category: 'feelings', text: { he: 'עצוב', en: 'Sad', ar: 'حزين', es: 'Triste' } },
  { id: 'big', emoji: '🐘', level: 'basic', category: 'adjectives', text: { he: 'גדול', en: 'Big', ar: 'كبير', es: 'Grande' } },
  { id: 'small', emoji: '🐭', level: 'basic', category: 'adjectives', text: { he: 'קטן', en: 'Small', ar: 'صغير', es: 'Pequeño' } },
  { id: 'milk', emoji: '🥛', level: 'basic', category: 'food', text: { he: 'חלב', en: 'Milk', ar: 'حليب', es: 'Leche' } },
  { id: 'bread', emoji: '🍞', level: 'basic', category: 'food', text: { he: 'לחם', en: 'Bread', ar: 'خبز', es: 'Pan' } },
  { id: 'tree', emoji: '🌳', level: 'basic', category: 'nature', text: { he: 'עץ', en: 'Tree', ar: 'شجرة', es: 'Árbol' } },

  // ---------------- INTERMEDIATE ----------------
  { id: 'weather', emoji: '⛅', level: 'intermediate', category: 'nature', text: { he: 'מזג אוויר', en: 'Weather', ar: 'الطقس', es: 'Clima' } },
  { id: 'holiday', emoji: '🎉', level: 'intermediate', category: 'events', text: { he: 'חג', en: 'Holiday', ar: 'عيد', es: 'Fiesta' } },
  { id: 'teacher', emoji: '🧑‍🏫', level: 'intermediate', category: 'school', text: { he: 'מורה', en: 'Teacher', ar: 'معلم', es: 'Maestro' } },
  { id: 'question', emoji: '❓', level: 'intermediate', category: 'school', text: { he: 'שאלה', en: 'Question', ar: 'سؤال', es: 'Pregunta' } },
  { id: 'travel', emoji: '✈️', level: 'intermediate', category: 'activities', text: { he: 'לטייל', en: 'To travel', ar: 'يسافر', es: 'Viajar' } },
  { id: 'understand', emoji: '💡', level: 'intermediate', category: 'actions', text: { he: 'להבין', en: 'To understand', ar: 'يفهم', es: 'Entender' } },
  { id: 'careful', emoji: '⚠️', level: 'intermediate', category: 'adjectives', text: { he: 'זהיר', en: 'Careful', ar: 'حذر', es: 'Cuidadoso' } },
  { id: 'strong', emoji: '💪', level: 'intermediate', category: 'adjectives', text: { he: 'חזק', en: 'Strong', ar: 'قوي', es: 'Fuerte' } },
  { id: 'library', emoji: '📚', level: 'intermediate', category: 'places', text: { he: 'ספרייה', en: 'Library', ar: 'مكتبة', es: 'Biblioteca' } },
  { id: 'hospital', emoji: '🏥', level: 'intermediate', category: 'places', text: { he: 'בית חולים', en: 'Hospital', ar: 'مستشفى', es: 'Hospital' } },
  { id: 'celebrate', emoji: '🎊', level: 'intermediate', category: 'actions', text: { he: 'לחגוג', en: 'To celebrate', ar: 'يحتفل', es: 'Celebrar' } },
  { id: 'imagine', emoji: '🌈', level: 'intermediate', category: 'actions', text: { he: 'לדמיין', en: 'To imagine', ar: 'يتخيل', es: 'Imaginar' } },

  // ---------------- ADVANCED ----------------
  { id: 'environment', emoji: '🌍', level: 'advanced', category: 'abstract', text: { he: 'סביבה', en: 'Environment', ar: 'بيئة', es: 'Medio ambiente' } },
  { id: 'responsibility', emoji: '🤝', level: 'advanced', category: 'abstract', text: { he: 'אחריות', en: 'Responsibility', ar: 'مسؤولية', es: 'Responsabilidad' } },
  { id: 'adventure', emoji: '🗺️', level: 'advanced', category: 'abstract', text: { he: 'הרפתקה', en: 'Adventure', ar: 'مغامرة', es: 'Aventura' } },
  { id: 'discover', emoji: '🔭', level: 'advanced', category: 'actions', text: { he: 'לגלות', en: 'To discover', ar: 'يكتشف', es: 'Descubrir' } },
  { id: 'achievement', emoji: '🏅', level: 'advanced', category: 'abstract', text: { he: 'הישג', en: 'Achievement', ar: 'إنجاز', es: 'Logro' } },
  { id: 'imagination', emoji: '🎨', level: 'advanced', category: 'abstract', text: { he: 'דמיון', en: 'Imagination', ar: 'خيال', es: 'Imaginación' } },
  { id: 'curious', emoji: '🧐', level: 'advanced', category: 'adjectives', text: { he: 'סקרן', en: 'Curious', ar: 'فضولي', es: 'Curioso' } },
  { id: 'patience', emoji: '⏳', level: 'advanced', category: 'abstract', text: { he: 'סבלנות', en: 'Patience', ar: 'صبر', es: 'Paciencia' } },
]

export function vocabByLevelAndLang(level: string) {
  return VOCABULARY.filter((v) => v.level === level)
}

export function vocabById(id: string) {
  return VOCABULARY.find((v) => v.id === id)
}

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function pickDistractors(pool: VocabItem[], correctId: string, count: number): VocabItem[] {
  const others = pool.filter((v) => v.id !== correctId)
  return shuffle(others).slice(0, count)
}
