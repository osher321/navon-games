import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Relationships
  { id: 'l3-relationships-1', en: 'commitment', he: 'מחויבות', example: 'Marriage requires real commitment from both sides.', category: 'relationships' },
  { id: 'l3-relationships-2', en: 'jealousy', he: 'קנאה', example: 'His jealousy caused problems in their relationship.', category: 'relationships' },
  { id: 'l3-relationships-3', en: 'forgiveness', he: 'סליחה', example: 'Forgiveness is not always easy, but it helps you move on.', category: 'relationships' },
  { id: 'l3-relationships-4', en: 'sincere', he: 'כן ואמיתי', example: 'She gave a sincere apology for her mistake.', category: 'relationships' },
  { id: 'l3-relationships-5', en: 'empathy', he: 'אמפתיה', example: 'Good managers show empathy toward their employees.', category: 'relationships' },
  { id: 'l3-relationships-6', en: 'reconcile', he: 'להשלים עם מישהו', example: 'The two brothers finally reconciled after years apart.', category: 'relationships' },
  // Technology
  { id: 'l3-technology-1', en: 'encryption', he: 'הצפנה', example: 'The company uses encryption to protect customer data.', category: 'technology' },
  { id: 'l3-technology-2', en: 'bandwidth', he: 'רוחב פס', example: 'Video calls use a lot of internet bandwidth.', category: 'technology' },
  { id: 'l3-technology-3', en: 'malware', he: 'תוכנה זדונית', example: 'The email contained a link to malware.', category: 'technology' },
  { id: 'l3-technology-4', en: 'interface', he: 'ממשק', example: 'The new interface is much easier to use.', category: 'technology' },
  { id: 'l3-technology-5', en: 'algorithm', he: 'אלגוריתם', example: 'The app uses an algorithm to recommend videos.', category: 'technology' },
  { id: 'l3-technology-6', en: 'backup', he: 'גיבוי', example: 'Always keep a backup of your important files.', category: 'technology' },
  // Education
  { id: 'l3-education-1', en: 'curriculum', he: 'תוכנית לימודים', example: 'The school updated its curriculum this year.', category: 'education' },
  { id: 'l3-education-2', en: 'scholarship', he: 'מלגה', example: 'She received a scholarship to study abroad.', category: 'education' },
  { id: 'l3-education-3', en: 'lecture', he: 'הרצאה', example: 'The professor gave an interesting lecture on history.', category: 'education' },
  { id: 'l3-education-4', en: 'dissertation', he: 'עבודת דוקטורט', example: 'He is writing his dissertation on climate change.', category: 'education' },
  { id: 'l3-education-5', en: 'plagiarism', he: 'גניבה ספרותית', example: 'Plagiarism can lead to serious academic consequences.', category: 'education' },
  { id: 'l3-education-6', en: 'literacy', he: 'אוריינות', example: 'The program aims to improve literacy among adults.', category: 'education' },
  // Health
  { id: 'l3-health-1', en: 'symptom', he: 'תסמין', example: 'Fever is a common symptom of the flu.', category: 'health' },
  { id: 'l3-health-2', en: 'diagnosis', he: 'אבחנה', example: 'The doctor gave her diagnosis after several tests.', category: 'health' },
  { id: 'l3-health-3', en: 'prescription', he: 'מרשם', example: 'You need a prescription to buy this medicine.', category: 'health' },
  { id: 'l3-health-4', en: 'immune', he: 'חיסוני', example: 'A healthy diet helps your immune system.', category: 'health' },
  { id: 'l3-health-5', en: 'chronic', he: 'כרוני', example: 'He suffers from a chronic back pain.', category: 'health' },
  { id: 'l3-health-6', en: 'therapy', he: 'טיפול', example: 'She started therapy to deal with her anxiety.', category: 'health' },
  // Environment
  { id: 'l3-environment-1', en: 'pollution', he: 'זיהום', example: 'Air pollution is a serious problem in big cities.', category: 'environment' },
  { id: 'l3-environment-2', en: 'recycling', he: 'מיחזור', example: 'Our city has a strong recycling program.', category: 'environment' },
  { id: 'l3-environment-3', en: 'drought', he: 'בצורת', example: 'The region suffered a severe drought last summer.', category: 'environment' },
  { id: 'l3-environment-4', en: 'ecosystem', he: 'מערכת אקולוגית', example: 'Coral reefs support a rich ecosystem.', category: 'environment' },
  { id: 'l3-environment-5', en: 'emission', he: 'פליטת גזים', example: 'New laws aim to reduce carbon emissions.', category: 'environment' },
  { id: 'l3-environment-6', en: 'sustainable', he: 'בר-קיימא', example: 'The company invests in sustainable energy sources.', category: 'environment' },
  // Travel
  { id: 'l3-travel-1', en: 'layover', he: 'עצירת ביניים בטיסה', example: 'We had a three-hour layover in Istanbul.', category: 'travel' },
  { id: 'l3-travel-2', en: 'customs', he: 'מכס', example: 'It took a while to pass through customs.', category: 'travel' },
  { id: 'l3-travel-3', en: 'excursion', he: 'טיול מאורגן', example: 'We joined a boat excursion around the island.', category: 'travel' },
  { id: 'l3-travel-4', en: 'souvenir', he: 'מזכרת', example: 'She bought a small souvenir for her sister.', category: 'travel' },
  { id: 'l3-travel-5', en: 'jet lag', he: 'עייפות מהפרשי שעות', example: 'It took him two days to recover from jet lag.', category: 'travel' },
  { id: 'l3-travel-6', en: 'embassy', he: 'שגרירות', example: 'You can renew your passport at the embassy.', category: 'travel' },
]

export const LEVEL3_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 3, difficulty: 'medium' }))
