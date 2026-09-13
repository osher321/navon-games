import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Home
  { id: 'l1-home-1', en: 'apartment', he: 'דירה', example: 'We are looking for a new apartment near the city center.', category: 'home' },
  { id: 'l1-home-2', en: 'furniture', he: 'רהיטים', example: 'They bought new furniture for the living room.', category: 'home' },
  { id: 'l1-home-3', en: 'kitchen', he: 'מטבח', example: 'She is cooking dinner in the kitchen.', category: 'home' },
  { id: 'l1-home-4', en: 'neighbor', he: 'שכן', example: 'My neighbor is very friendly and helpful.', category: 'home' },
  { id: 'l1-home-5', en: 'rent', he: 'שכר דירה', example: 'The rent for this apartment is too high.', category: 'home' },
  { id: 'l1-home-6', en: 'key', he: 'מפתח', example: 'I forgot my key at home this morning.', category: 'home' },
  // Food
  { id: 'l1-food-1', en: 'breakfast', he: 'ארוחת בוקר', example: 'I usually eat breakfast at seven in the morning.', category: 'food' },
  { id: 'l1-food-2', en: 'restaurant', he: 'מסעדה', example: 'We had dinner at a nice restaurant downtown.', category: 'food' },
  { id: 'l1-food-3', en: 'menu', he: 'תפריט', example: 'Can I see the menu, please?', category: 'food' },
  { id: 'l1-food-4', en: 'waiter', he: 'מלצר', example: 'The waiter brought us water and bread.', category: 'food' },
  { id: 'l1-food-5', en: 'delicious', he: 'טעים', example: 'This soup is absolutely delicious.', category: 'food' },
  { id: 'l1-food-6', en: 'hungry', he: 'רעב', example: 'I am very hungry after the long meeting.', category: 'food' },
  // Shopping
  { id: 'l1-shopping-1', en: 'price', he: 'מחיר', example: 'The price of this jacket is too high for me.', category: 'shopping' },
  { id: 'l1-shopping-2', en: 'receipt', he: 'קבלה', example: 'Please keep the receipt in case you need a refund.', category: 'shopping' },
  { id: 'l1-shopping-3', en: 'cash', he: 'מזומן', example: 'Do you accept cash or only credit cards?', category: 'shopping' },
  { id: 'l1-shopping-4', en: 'discount', he: 'הנחה', example: 'I got a nice discount on these shoes.', category: 'shopping' },
  { id: 'l1-shopping-5', en: 'size', he: 'מידה', example: 'Do you have this shirt in a bigger size?', category: 'shopping' },
  { id: 'l1-shopping-6', en: 'customer', he: 'לקוח', example: 'The store always treats every customer politely.', category: 'shopping' },
  // Travel
  { id: 'l1-travel-1', en: 'passport', he: 'דרכון', example: "Don't forget to bring your passport to the airport.", category: 'travel' },
  { id: 'l1-travel-2', en: 'luggage', he: 'מזוודות', example: 'We checked our luggage before boarding the flight.', category: 'travel' },
  { id: 'l1-travel-3', en: 'airport', he: 'שדה תעופה', example: 'The airport was very crowded this morning.', category: 'travel' },
  { id: 'l1-travel-4', en: 'ticket', he: 'כרטיס', example: 'I already bought my train ticket online.', category: 'travel' },
  { id: 'l1-travel-5', en: 'hotel', he: 'מלון', example: 'We stayed at a small hotel near the beach.', category: 'travel' },
  { id: 'l1-travel-6', en: 'tourist', he: 'תייר', example: 'Many tourists visit this city every summer.', category: 'travel' },
  // Health
  { id: 'l1-health-1', en: 'doctor', he: 'רופא', example: 'I have an appointment with the doctor tomorrow.', category: 'health' },
  { id: 'l1-health-2', en: 'medicine', he: 'תרופה', example: 'Take this medicine twice a day after meals.', category: 'health' },
  { id: 'l1-health-3', en: 'headache', he: 'כאב ראש', example: 'I have a terrible headache today.', category: 'health' },
  { id: 'l1-health-4', en: 'pharmacy', he: 'בית מרקחת', example: 'You can buy this medicine at the pharmacy.', category: 'health' },
  { id: 'l1-health-5', en: 'appointment', he: 'תור', example: 'I made an appointment with the dentist for Monday.', category: 'health' },
  { id: 'l1-health-6', en: 'tired', he: 'עייף', example: 'I feel very tired after work today.', category: 'health' },
  // Education
  { id: 'l1-education-1', en: 'teacher', he: 'מורה', example: 'Our English teacher explains everything very clearly.', category: 'education' },
  { id: 'l1-education-2', en: 'homework', he: 'שיעורי בית', example: 'I need to finish my homework before dinner.', category: 'education' },
  { id: 'l1-education-3', en: 'exam', he: 'מבחן', example: 'The final exam is next week.', category: 'education' },
  { id: 'l1-education-4', en: 'subject', he: 'מקצוע לימוד', example: 'Math is my favorite subject in school.', category: 'education' },
  { id: 'l1-education-5', en: 'classroom', he: 'כיתה', example: 'The classroom was quiet during the test.', category: 'education' },
  { id: 'l1-education-6', en: 'lesson', he: 'שיעור', example: "Today's lesson was about the human body.", category: 'education' },
]

export const LEVEL1_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 1, difficulty: 'easy' }))
