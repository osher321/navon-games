import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Work
  { id: 'l2-work-1', en: 'salary', he: 'משכורת', example: 'She received a raise in her salary this year.', category: 'work' },
  { id: 'l2-work-2', en: 'colleague', he: 'עמית לעבודה', example: 'I had lunch with a colleague from another department.', category: 'work' },
  { id: 'l2-work-3', en: 'meeting', he: 'ישיבה', example: 'We have a team meeting every Monday morning.', category: 'work' },
  { id: 'l2-work-4', en: 'deadline', he: 'מועד אחרון', example: 'The deadline for this project is Friday.', category: 'work' },
  { id: 'l2-work-5', en: 'resume', he: 'קורות חיים', example: 'He updated his resume before applying for the job.', category: 'work' },
  { id: 'l2-work-6', en: 'interview', he: 'ראיון עבודה', example: 'She was nervous before her job interview.', category: 'work' },
  // Money
  { id: 'l2-money-1', en: 'budget', he: 'תקציב', example: 'We need to stick to our monthly budget.', category: 'money' },
  { id: 'l2-money-2', en: 'savings', he: 'חסכונות', example: 'He uses his savings to pay for the trip.', category: 'money' },
  { id: 'l2-money-3', en: 'expense', he: 'הוצאה', example: 'Rent is our biggest monthly expense.', category: 'money' },
  { id: 'l2-money-4', en: 'loan', he: 'הלוואה', example: 'They took a loan to buy their first car.', category: 'money' },
  { id: 'l2-money-5', en: 'invoice', he: 'חשבונית', example: 'Please send the invoice by the end of the week.', category: 'money' },
  { id: 'l2-money-6', en: 'income', he: 'הכנסה', example: 'Her income increased after she changed jobs.', category: 'money' },
  // Shopping
  { id: 'l2-shopping-1', en: 'refund', he: 'החזר כספי', example: 'I asked for a refund because the item was broken.', category: 'shopping' },
  { id: 'l2-shopping-2', en: 'warehouse', he: 'מחסן', example: 'The company stores its products in a large warehouse.', category: 'shopping' },
  { id: 'l2-shopping-3', en: 'bargain', he: 'מציאה', example: 'I found a great bargain at the market today.', category: 'shopping' },
  { id: 'l2-shopping-4', en: 'checkout', he: 'קופה', example: 'There was a long line at the checkout.', category: 'shopping' },
  { id: 'l2-shopping-5', en: 'delivery', he: 'משלוח', example: 'The delivery usually takes three business days.', category: 'shopping' },
  { id: 'l2-shopping-6', en: 'guarantee', he: 'אחריות', example: 'This washing machine comes with a two-year guarantee.', category: 'shopping' },
  // Travel
  { id: 'l2-travel-1', en: 'itinerary', he: 'מסלול טיול', example: 'Our itinerary includes three cities in one week.', category: 'travel' },
  { id: 'l2-travel-2', en: 'reservation', he: 'הזמנת מקום', example: 'We made a reservation at the hotel in advance.', category: 'travel' },
  { id: 'l2-travel-3', en: 'currency', he: 'מטבע', example: 'You should exchange your currency before the trip.', category: 'travel' },
  { id: 'l2-travel-4', en: 'journey', he: 'מסע', example: 'It was a long journey, but very enjoyable.', category: 'travel' },
  { id: 'l2-travel-5', en: 'delay', he: 'עיכוב', example: 'Our flight had a two-hour delay.', category: 'travel' },
  { id: 'l2-travel-6', en: 'destination', he: 'יעד', example: 'Paris is a popular travel destination in Europe.', category: 'travel' },
  // Relationships
  { id: 'l2-relationships-1', en: 'friendship', he: 'חברות', example: 'Their friendship has lasted for over twenty years.', category: 'relationships' },
  { id: 'l2-relationships-2', en: 'argument', he: 'ויכוח', example: 'They had a small argument about the plans.', category: 'relationships' },
  { id: 'l2-relationships-3', en: 'apologize', he: 'להתנצל', example: 'He decided to apologize for being late.', category: 'relationships' },
  { id: 'l2-relationships-4', en: 'trust', he: 'אמון', example: 'Trust is very important in any relationship.', category: 'relationships' },
  { id: 'l2-relationships-5', en: 'compliment', he: 'מחמאה', example: 'She gave him a nice compliment about his work.', category: 'relationships' },
  { id: 'l2-relationships-6', en: 'support', he: 'תמיכה', example: 'Her family gave her a lot of support during that time.', category: 'relationships' },
  // Technology
  { id: 'l2-technology-1', en: 'password', he: 'סיסמה', example: 'Never share your password with anyone.', category: 'technology' },
  { id: 'l2-technology-2', en: 'download', he: 'להוריד קובץ', example: 'I need to download the file before the meeting.', category: 'technology' },
  { id: 'l2-technology-3', en: 'device', he: 'מכשיר', example: 'This app works on almost any device.', category: 'technology' },
  { id: 'l2-technology-4', en: 'wireless', he: 'אלחוטי', example: 'We connected to the wireless network at the cafe.', category: 'technology' },
  { id: 'l2-technology-5', en: 'update', he: 'עדכון', example: 'Please install the latest software update.', category: 'technology' },
  { id: 'l2-technology-6', en: 'battery', he: 'סוללה', example: 'My phone battery is almost empty.', category: 'technology' },
]

export const LEVEL2_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 2, difficulty: 'easy' }))
