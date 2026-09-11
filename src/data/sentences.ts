import type { SentenceItem } from '../types'

// Each sentence is pre-tokenized (word order = correct order) per language.
export const SENTENCES: SentenceItem[] = [
  {
    id: 's1',
    level: 'beginner',
    text: {
      he: ['אני', 'אוהב', 'כלבים'],
      en: ['I', 'love', 'dogs'],
      ar: ['أنا', 'أحب', 'الكلاب'],
      es: ['Me', 'gustan', 'los', 'perros'],
    },
  },
  {
    id: 's2',
    level: 'beginner',
    text: {
      he: ['השמש', 'צהובה'],
      en: ['The', 'sun', 'is', 'yellow'],
      ar: ['الشمس', 'صفراء'],
      es: ['El', 'sol', 'es', 'amarillo'],
    },
  },
  {
    id: 's3',
    level: 'basic',
    text: {
      he: ['אמא', 'שלי', 'טובה'],
      en: ['My', 'mom', 'is', 'kind'],
      ar: ['أمي', 'طيبة'],
      es: ['Mi', 'mamá', 'es', 'buena'],
    },
  },
  {
    id: 's4',
    level: 'basic',
    text: {
      he: ['אני', 'הולך', 'לבית', 'הספר'],
      en: ['I', 'go', 'to', 'school'],
      ar: ['أنا', 'أذهب', 'إلى', 'المدرسة'],
      es: ['Yo', 'voy', 'a', 'la', 'escuela'],
    },
  },
  {
    id: 's5',
    level: 'intermediate',
    text: {
      he: ['היום', 'מזג', 'האוויר', 'יפה'],
      en: ['Today', 'the', 'weather', 'is', 'nice'],
      ar: ['اليوم', 'الطقس', 'جميل'],
      es: ['Hoy', 'el', 'clima', 'es', 'agradable'],
    },
  },
  {
    id: 's6',
    level: 'intermediate',
    text: {
      he: ['המורה', 'שלי', 'חכמה', 'מאוד'],
      en: ['My', 'teacher', 'is', 'very', 'smart'],
      ar: ['معلمتي', 'ذكية', 'جدا'],
      es: ['Mi', 'maestra', 'es', 'muy', 'inteligente'],
    },
  },
  {
    id: 's7',
    level: 'advanced',
    text: {
      he: ['אני', 'אוהב', 'לגלות', 'דברים', 'חדשים'],
      en: ['I', 'love', 'to', 'discover', 'new', 'things'],
      ar: ['أحب', 'أن', 'أكتشف', 'أشياء', 'جديدة'],
      es: ['Me', 'encanta', 'descubrir', 'cosas', 'nuevas'],
    },
  },
  {
    id: 's8',
    level: 'advanced',
    text: {
      he: ['לשמור', 'על', 'הסביבה', 'זו', 'אחריות', 'שלנו'],
      en: ['Protecting', 'the', 'environment', 'is', 'our', 'responsibility'],
      ar: ['حماية', 'البيئة', 'هي', 'مسؤوليتنا'],
      es: ['Proteger', 'el', 'medio', 'ambiente', 'es', 'nuestra', 'responsabilidad'],
    },
  },
  {
    id: 's9',
    level: 'beginner',
    text: {
      he: ['הכלב', 'רץ', 'מהר'],
      en: ['The', 'dog', 'runs', 'fast'],
      ar: ['الكلب', 'يجري', 'بسرعة'],
      es: ['El', 'perro', 'corre', 'rápido'],
    },
  },
  {
    id: 's10',
    level: 'basic',
    text: {
      he: ['אני', 'אוכל', 'תפוח', 'כל', 'יום'],
      en: ['I', 'eat', 'an', 'apple', 'every', 'day'],
      ar: ['آكل', 'تفاحة', 'كل', 'يوم'],
      es: ['Como', 'una', 'manzana', 'todos', 'los', 'días'],
    },
  },
  {
    id: 's11',
    level: 'intermediate',
    text: {
      he: ['אנחנו', 'חוגגים', 'את', 'החג', 'ביחד'],
      en: ['We', 'celebrate', 'the', 'holiday', 'together'],
      ar: ['نحتفل', 'بالعيد', 'معا'],
      es: ['Celebramos', 'la', 'fiesta', 'juntos'],
    },
  },
  {
    id: 's12',
    level: 'advanced',
    text: {
      he: ['הסקרנות', 'שלי', 'עוזרת', 'לי', 'ללמוד'],
      en: ['My', 'curiosity', 'helps', 'me', 'learn'],
      ar: ['فضولي', 'يساعدني', 'على', 'التعلم'],
      es: ['Mi', 'curiosidad', 'me', 'ayuda', 'a', 'aprender'],
    },
  },
]

export function sentencesByLevel(level: string) {
  return SENTENCES.filter((s) => s.level === level)
}
