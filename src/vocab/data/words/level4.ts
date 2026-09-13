import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Work (phrasal verbs)
  { id: 'l4-work-1', en: 'carry out', he: 'לבצע', example: 'The team will carry out the plan next week.', category: 'work' },
  { id: 'l4-work-2', en: 'look into', he: 'לבדוק/לחקור', example: 'We need to look into this problem immediately.', category: 'work' },
  { id: 'l4-work-3', en: 'come up with', he: 'להעלות רעיון', example: 'She came up with a great idea for the project.', category: 'work' },
  { id: 'l4-work-4', en: 'deal with', he: 'להתמודד עם', example: 'He knows how to deal with difficult clients.', category: 'work' },
  { id: 'l4-work-5', en: 'cut back on', he: 'לצמצם', example: 'The company decided to cut back on expenses.', category: 'work' },
  { id: 'l4-work-6', en: 'take over', he: 'לקחת אחריות/להשתלט', example: 'She will take over the project next month.', category: 'work' },
  // Business
  { id: 'l4-business-1', en: 'revenue', he: 'הכנסות חברה', example: "The company's revenue increased by ten percent.", category: 'business' },
  { id: 'l4-business-2', en: 'stakeholder', he: 'בעל עניין', example: 'Every stakeholder was invited to the meeting.', category: 'business' },
  { id: 'l4-business-3', en: 'merger', he: 'מיזוג חברות', example: 'The merger created one of the largest firms in the industry.', category: 'business' },
  { id: 'l4-business-4', en: 'overhead', he: 'הוצאות תפעול', example: 'They reduced overhead by working from smaller offices.', category: 'business' },
  { id: 'l4-business-5', en: 'forecast', he: 'תחזית', example: 'The financial forecast for next year looks promising.', category: 'business' },
  { id: 'l4-business-6', en: 'procurement', he: 'רכש', example: 'The procurement department handles all supplier contracts.', category: 'business' },
  // Technology
  { id: 'l4-technology-1', en: 'scalability', he: 'יכולת הרחבה', example: 'Scalability is important when designing a new system.', category: 'technology' },
  { id: 'l4-technology-2', en: 'deprecated', he: 'מיושן ולא נתמך', example: 'This function is deprecated and will be removed soon.', category: 'technology' },
  { id: 'l4-technology-3', en: 'latency', he: 'זמן השהיה', example: 'High latency made the video call difficult.', category: 'technology' },
  { id: 'l4-technology-4', en: 'middleware', he: 'תוכנת ביניים', example: 'The middleware connects the app to the database.', category: 'technology' },
  { id: 'l4-technology-5', en: 'throughput', he: 'קצב עיבוד', example: "The new server improved the system's throughput.", category: 'technology' },
  { id: 'l4-technology-6', en: 'obsolete', he: 'מיושן', example: 'This technology quickly became obsolete.', category: 'technology' },
  // News
  { id: 'l4-news-1', en: 'headline', he: 'כותרת ראשית', example: "The headline caught everyone's attention.", category: 'news' },
  { id: 'l4-news-2', en: 'coverage', he: 'סיקור תקשורתי', example: 'The election received wide media coverage.', category: 'news' },
  { id: 'l4-news-3', en: 'controversy', he: 'מחלוקת', example: 'The decision caused a major controversy.', category: 'news' },
  { id: 'l4-news-4', en: 'allegation', he: 'האשמה', example: 'The company denied all the allegations.', category: 'news' },
  { id: 'l4-news-5', en: 'censorship', he: 'צנזורה', example: 'The report criticized government censorship of the press.', category: 'news' },
  { id: 'l4-news-6', en: 'correspondent', he: 'כתב עיתונאי', example: 'Our correspondent is reporting live from the scene.', category: 'news' },
  // Environment
  { id: 'l4-environment-1', en: 'deforestation', he: 'כריתת יערות', example: 'Deforestation is destroying natural habitats.', category: 'environment' },
  { id: 'l4-environment-2', en: 'biodiversity', he: 'מגוון ביולוגי', example: 'The rainforest has incredible biodiversity.', category: 'environment' },
  { id: 'l4-environment-3', en: 'greenhouse', he: 'חממה (גז חממה)', example: 'Greenhouse gases contribute to global warming.', category: 'environment' },
  { id: 'l4-environment-4', en: 'contamination', he: 'זיהום/הרעלה', example: 'The river suffered from chemical contamination.', category: 'environment' },
  { id: 'l4-environment-5', en: 'conservation', he: 'שימור טבע', example: 'The organization works on wildlife conservation.', category: 'environment' },
  { id: 'l4-environment-6', en: 'renewable', he: 'מתחדש (אנרגיה)', example: 'Renewable energy is becoming cheaper every year.', category: 'environment' },
  // Education
  { id: 'l4-education-1', en: 'accreditation', he: 'הסמכה', example: 'The university received international accreditation.', category: 'education' },
  { id: 'l4-education-2', en: 'pedagogy', he: 'שיטת הוראה', example: 'The school adopted a new pedagogy for young learners.', category: 'education' },
  { id: 'l4-education-3', en: 'tuition', he: 'שכר לימוד', example: 'Tuition fees increased this semester.', category: 'education' },
  { id: 'l4-education-4', en: 'transcript', he: 'גיליון ציונים', example: 'You will need your transcript to apply for the program.', category: 'education' },
  { id: 'l4-education-5', en: 'sabbatical', he: 'שבתון', example: 'The professor is on sabbatical this year.', category: 'education' },
  { id: 'l4-education-6', en: 'cohort', he: 'קבוצת לומדים', example: 'The new cohort starts classes in September.', category: 'education' },
]

export const LEVEL4_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 4, difficulty: 'medium' }))
