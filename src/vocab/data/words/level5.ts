import type { VocabWord } from '../types'

type Raw = Omit<VocabWord, 'level' | 'difficulty'>

const RAW: Raw[] = [
  // Business
  { id: 'l5-business-1', en: 'acquisition', he: 'רכישת חברה', example: 'The acquisition doubled the size of the company.', category: 'business' },
  { id: 'l5-business-2', en: 'liability', he: 'אחריות משפטית', example: "The contract limits the company's liability.", category: 'business' },
  { id: 'l5-business-3', en: 'subsidiary', he: 'חברת בת', example: 'The subsidiary operates independently from the parent company.', category: 'business' },
  { id: 'l5-business-4', en: 'dividend', he: 'דיבידנד', example: 'Shareholders received a dividend at the end of the year.', category: 'business' },
  { id: 'l5-business-5', en: 'equity', he: 'הון עצמי', example: 'The founders kept most of the equity in the company.', category: 'business' },
  { id: 'l5-business-6', en: 'arbitration', he: 'בוררות', example: 'The dispute was settled through arbitration.', category: 'business' },
  // Money
  { id: 'l5-money-1', en: 'inflation', he: 'אינפלציה', example: 'Inflation has raised the cost of living significantly.', category: 'money' },
  { id: 'l5-money-2', en: 'portfolio', he: 'תיק השקעות', example: 'She diversified her investment portfolio.', category: 'money' },
  { id: 'l5-money-3', en: 'collateral', he: 'בטוחה להלוואה', example: 'The bank required collateral for the loan.', category: 'money' },
  { id: 'l5-money-4', en: 'amortize', he: 'להפחית חוב בהדרגה', example: 'The company will amortize the loan over ten years.', category: 'money' },
  { id: 'l5-money-5', en: 'liquidity', he: 'נזילות', example: 'The firm maintained strong liquidity during the crisis.', category: 'money' },
  { id: 'l5-money-6', en: 'austerity', he: 'צנע וקיצוצים', example: 'The government introduced austerity measures to reduce debt.', category: 'money' },
  // News
  { id: 'l5-news-1', en: 'bias', he: 'הטיה', example: 'Readers accused the newspaper of political bias.', category: 'news' },
  { id: 'l5-news-2', en: 'embargo', he: 'אמברגו', example: 'The country imposed a trade embargo.', category: 'news' },
  { id: 'l5-news-3', en: 'whistleblower', he: 'חושף שחיתויות', example: "The whistleblower revealed the company's illegal practices.", category: 'news' },
  { id: 'l5-news-4', en: 'propaganda', he: 'תעמולה', example: 'The regime used propaganda to control public opinion.', category: 'news' },
  { id: 'l5-news-5', en: 'censure', he: 'גינוי רשמי', example: 'The senator faced official censure for his actions.', category: 'news' },
  { id: 'l5-news-6', en: 'defamation', he: 'הוצאת דיבה', example: 'The actor sued the magazine for defamation.', category: 'news' },
  // Technology
  { id: 'l5-technology-1', en: 'cybersecurity', he: 'אבטחת סייבר', example: 'The bank invested heavily in cybersecurity.', category: 'technology' },
  { id: 'l5-technology-2', en: 'interoperability', he: 'תאימות בין מערכות', example: 'Interoperability between systems remains a major challenge.', category: 'technology' },
  { id: 'l5-technology-3', en: 'virtualization', he: 'וירטואליזציה', example: 'Virtualization allows one server to run multiple systems.', category: 'technology' },
  { id: 'l5-technology-4', en: 'cryptography', he: 'קריפטוגרפיה', example: 'Cryptography protects sensitive information online.', category: 'technology' },
  { id: 'l5-technology-5', en: 'obfuscation', he: 'הסתרת קוד', example: 'The code used obfuscation to prevent copying.', category: 'technology' },
  { id: 'l5-technology-6', en: 'provisioning', he: 'הקצאת משאבים', example: 'Cloud provisioning takes only a few minutes today.', category: 'technology' },
  // Health
  { id: 'l5-health-1', en: 'epidemiology', he: 'אפידמיולוגיה', example: 'Epidemiology helps track the spread of diseases.', category: 'health' },
  { id: 'l5-health-2', en: 'prognosis', he: 'תחזית רפואית', example: 'The doctor gave a positive prognosis after surgery.', category: 'health' },
  { id: 'l5-health-3', en: 'resilience', he: 'חוסן נפשי', example: 'Building resilience helps people cope with stress.', category: 'health' },
  { id: 'l5-health-4', en: 'malnutrition', he: 'תת-תזונה', example: 'Malnutrition remains a serious issue in some regions.', category: 'health' },
  { id: 'l5-health-5', en: 'rehabilitation', he: 'שיקום', example: 'He underwent months of physical rehabilitation.', category: 'health' },
  { id: 'l5-health-6', en: 'comorbidity', he: 'תחלואה נלווית', example: 'Comorbidity increases the risk of complications.', category: 'health' },
  // Environment
  { id: 'l5-environment-1', en: 'carbon footprint', he: 'טביעת רגל פחמנית', example: 'Flying often increases your carbon footprint.', category: 'environment' },
  { id: 'l5-environment-2', en: 'mitigation', he: 'צמצום נזק', example: 'The plan focuses on climate change mitigation.', category: 'environment' },
  { id: 'l5-environment-3', en: 'desertification', he: 'התפשטות מדבר', example: 'Desertification threatens farmland in the region.', category: 'environment' },
  { id: 'l5-environment-4', en: 'bioaccumulation', he: 'הצטברות ביולוגית', example: 'Bioaccumulation of toxins harms marine life.', category: 'environment' },
  { id: 'l5-environment-5', en: 'afforestation', he: 'נטיעת יערות', example: 'The country launched a large afforestation project.', category: 'environment' },
  { id: 'l5-environment-6', en: 'externality', he: 'השפעת חוץ כלכלית', example: 'Pollution is a classic example of a negative externality.', category: 'environment' },
]

export const LEVEL5_WORDS: VocabWord[] = RAW.map((w) => ({ ...w, level: 5, difficulty: 'hard' }))
