import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Business (idioms/collocations)
  { id: 'l6-business-1', en: 'bottom line', he: 'השורה התחתונה', example: 'At the end of the day, the bottom line is all that matters to investors.', category: 'business' },
  { id: 'l6-business-2', en: 'in the red', he: 'בגירעון', example: 'The company has been in the red for two consecutive quarters.', category: 'business' },
  { id: 'l6-business-3', en: 'cut corners', he: 'לקצץ בעלויות על חשבון האיכות', example: 'They cut corners on quality to save money, and customers noticed.', category: 'business' },
  { id: 'l6-business-4', en: 'leverage', he: 'למנף יתרון', example: 'The firm leveraged its brand name to enter new markets.', category: 'business' },
  { id: 'l6-business-5', en: 'streamline', he: 'לייעל', example: 'They streamlined the approval process to save time.', category: 'business' },
  { id: 'l6-business-6', en: 'conglomerate', he: 'קונגלומרט', example: 'The conglomerate owns companies in dozens of industries.', category: 'business' },
  // News (collocations/idioms)
  { id: 'l6-news-1', en: 'spin doctor', he: 'יועץ תדמית', example: "The politician's spin doctor tried to control the damage.", category: 'news' },
  { id: 'l6-news-2', en: 'off the record', he: 'לא לפרסום', example: 'The official spoke off the record about the negotiations.', category: 'news' },
  { id: 'l6-news-3', en: 'smoking gun', he: 'הוכחה ניצחת', example: 'Investigators finally found the smoking gun in the case.', category: 'news' },
  { id: 'l6-news-4', en: 'vested interest', he: 'אינטרס אישי', example: 'Critics say the committee has a vested interest in the outcome.', category: 'news' },
  { id: 'l6-news-5', en: 'breaking news', he: 'חדשות מתפרצות', example: 'We interrupt this program for breaking news.', category: 'news' },
  { id: 'l6-news-6', en: 'watchdog', he: 'גוף פיקוח', example: "A consumer watchdog is investigating the company's practices.", category: 'news' },
  // Education (advanced/formal)
  { id: 'l6-education-1', en: 'erudite', he: 'בעל ידע רחב', example: 'Her erudite lectures attracted students from every department.', category: 'education' },
  { id: 'l6-education-2', en: 'autodidact', he: 'לומד עצמאי', example: 'He was an autodidact who never attended university.', category: 'education' },
  { id: 'l6-education-3', en: 'pedantic', he: 'קפדני יתר על המידה', example: 'The teacher was too pedantic about minor grammar mistakes.', category: 'education' },
  { id: 'l6-education-4', en: 'treatise', he: 'חיבור מדעי מקיף', example: 'The philosopher wrote a famous treatise on ethics.', category: 'education' },
  { id: 'l6-education-5', en: 'exegesis', he: 'פרשנות מעמיקה', example: 'The class focused on a close exegesis of the poem.', category: 'education' },
  { id: 'l6-education-6', en: 'didactic', he: 'חינוכי-הטפתי', example: 'Some readers found the novel too didactic.', category: 'education' },
  // Technology (advanced)
  { id: 'l6-technology-1', en: 'ubiquitous', he: 'נפוץ בכל מקום', example: 'Smartphones have become ubiquitous in modern life.', category: 'technology' },
  { id: 'l6-technology-2', en: 'paradigm shift', he: 'שינוי תפיסתי מהותי', example: 'The internet caused a paradigm shift in how we communicate.', category: 'technology' },
  { id: 'l6-technology-3', en: 'synergy', he: 'סינרגיה', example: 'The merger created synergy between the two teams.', category: 'technology' },
  { id: 'l6-technology-4', en: 'disruptive', he: 'פורץ דרך', example: 'The startup introduced a disruptive technology to the market.', category: 'technology' },
  { id: 'l6-technology-5', en: 'proprietary', he: 'קנייני ובבעלות בלעדית', example: 'The company uses proprietary software it developed in-house.', category: 'technology' },
  { id: 'l6-technology-6', en: 'agnostic', he: 'ניטרלי לפלטפורמה', example: 'The app was designed to be platform-agnostic.', category: 'technology' },
  // Relationships (idioms)
  { id: 'l6-relationships-1', en: 'on the same page', he: 'בהבנה משותפת', example: "Before starting, let's make sure we're on the same page.", category: 'relationships' },
  { id: 'l6-relationships-2', en: 'break the ice', he: 'לשבור את הקרח', example: 'He told a joke to break the ice at the meeting.', category: 'relationships' },
  { id: 'l6-relationships-3', en: 'burn bridges', he: 'לשרוף גשרים', example: 'She left the company quietly, careful not to burn bridges.', category: 'relationships' },
  { id: 'l6-relationships-4', en: 'read between the lines', he: 'לקרוא בין השורות', example: 'You need to read between the lines to understand his real intention.', category: 'relationships' },
  { id: 'l6-relationships-5', en: 'see eye to eye', he: 'לראות עין בעין', example: "The partners don't always see eye to eye on strategy.", category: 'relationships' },
  { id: 'l6-relationships-6', en: 'hold a grudge', he: 'לשמור טינה', example: 'He tends to hold a grudge for a very long time.', category: 'relationships' },
  // Environment (advanced)
  { id: 'l6-environment-1', en: 'existential', he: 'קיומי', example: 'Climate change poses an existential threat to some island nations.', category: 'environment' },
  { id: 'l6-environment-2', en: 'unsustainable', he: 'בלתי בר-קיימא', example: 'Current consumption levels are simply unsustainable.', category: 'environment' },
  { id: 'l6-environment-3', en: 'anthropogenic', he: 'הנגרם על ידי אדם', example: 'Anthropogenic emissions are the main driver of climate change.', category: 'environment' },
  { id: 'l6-environment-4', en: 'irreversible', he: 'בלתי הפיך', example: 'Some environmental damage may be irreversible.', category: 'environment' },
  { id: 'l6-environment-5', en: 'ecological footprint', he: 'טביעת רגל אקולוגית', example: 'Reducing your ecological footprint starts with small daily choices.', category: 'environment' },
  { id: 'l6-environment-6', en: 'biodegradable', he: 'מתכלה ביולוגית', example: 'The company switched to biodegradable packaging.', category: 'environment' },
]

export const LEVEL6_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 6, difficulty: 'hard' }))
