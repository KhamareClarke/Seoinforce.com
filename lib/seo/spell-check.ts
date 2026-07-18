export interface SpellCheckResult {
  error_count: number;
  errors: Array<{ word: string; suggestion: string; context: string }>;
  checked_words: number;
  error_rate: number;
}

// 120 commonly misspelled words in business/web content
const MISSPELLINGS: Record<string, string> = {
  accomodation: 'accommodation',
  acheive: 'achieve',
  adress: 'address',
  apparantly: 'apparently',
  arguement: 'argument',
  basicly: 'basically',
  beautifull: 'beautiful',
  beleive: 'believe',
  brocolli: 'broccoli',
  buisness: 'business',
  calender: 'calendar',
  catagory: 'category',
  cemetary: 'cemetery',
  charachter: 'character',
  collegue: 'colleague',
  comming: 'coming',
  committment: 'commitment',
  concieve: 'conceive',
  concious: 'conscious',
  convinience: 'convenience',
  decieve: 'deceive',
  defenitely: 'definitely',
  definately: 'definitely',
  developement: 'development',
  disatisfied: 'dissatisfied',
  embarassment: 'embarrassment',
  enviroment: 'environment',
  exilharating: 'exhilarating',
  existance: 'existence',
  experianced: 'experienced',
  familier: 'familiar',
  foriegn: 'foreign',
  foward: 'forward',
  fourty: 'forty',
  freind: 'friend',
  fullfill: 'fulfill',
  genious: 'genius',
  goverment: 'government',
  grammer: 'grammar',
  greatful: 'grateful',
  gurantee: 'guarantee',
  happend: 'happened',
  harrassment: 'harassment',
  hight: 'height',
  humourous: 'humorous',
  immediatley: 'immediately',
  incidently: 'incidentally',
  independance: 'independence',
  interupt: 'interrupt',
  intresting: 'interesting',
  knowlege: 'knowledge',
  lenght: 'length',
  liason: 'liaison',
  maintenence: 'maintenance',
  managment: 'management',
  manouver: 'maneuver',
  mathamatics: 'mathematics',
  medeval: 'medieval',
  micellaneous: 'miscellaneous',
  milennium: 'millennium',
  minature: 'miniature',
  mischievious: 'mischievous',
  mispell: 'misspell',
  neccessary: 'necessary',
  necesary: 'necessary',
  neiborhood: 'neighborhood',
  noticable: 'noticeable',
  occured: 'occurred',
  occurence: 'occurrence',
  ommitted: 'omitted',
  oppurtunity: 'opportunity',
  paralell: 'parallel',
  peice: 'piece',
  performence: 'performance',
  perseverence: 'perseverance',
  playwrite: 'playwright',
  politican: 'politician',
  porfessional: 'professional',
  possesion: 'possession',
  prefered: 'preferred',
  prescence: 'presence',
  privelege: 'privilege',
  probaly: 'probably',
  profesional: 'professional',
  pronounciation: 'pronunciation',
  propaghanda: 'propaganda',
  publically: 'publicly',
  questionaire: 'questionnaire',
  reccomend: 'recommend',
  reccommend: 'recommend',
  recieve: 'receive',
  rediculous: 'ridiculous',
  refering: 'referring',
  relevent: 'relevant',
  remberance: 'remembrance',
  responsability: 'responsibility',
  restaraunt: 'restaurant',
  rythm: 'rhythm',
  rythem: 'rhythm',
  sacrilegious: 'sacrilegious',
  scehdule: 'schedule',
  sence: 'sense',
  sentance: 'sentence',
  seperate: 'separate',
  sieze: 'seize',
  similer: 'similar',
  similiar: 'similar',
  speach: 'speech',
  succesful: 'successful',
  supercede: 'supersede',
  suprising: 'surprising',
  tatoo: 'tattoo',
  teh: 'the',
  therefor: 'therefore',
  thier: 'their',
  tommorrow: 'tomorrow',
  truely: 'truly',
  tyrrany: 'tyranny',
  untill: 'until',
  vacume: 'vacuum',
  visable: 'visible',
  wether: 'whether',
  wierd: 'weird',
  withold: 'withhold',
  writting: 'writing',
  yeild: 'yield',
};

export function checkSpelling(bodyText: string): SpellCheckResult {
  const cleaned = bodyText.replace(/[^a-zA-Z\s']/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.match(/\b[a-z]{3,}\b/gi) || [];
  const checked_words = words.length;

  const errors: SpellCheckResult['errors'] = [];
  const seen = new Set<string>();

  for (let idx = 0; idx < words.length; idx++) {
    const w = words[idx].toLowerCase();
    if (seen.has(w)) continue;
    const suggestion = MISSPELLINGS[w];
    if (suggestion) {
      seen.add(w);
      const before = words[idx - 1] || '';
      const after = words[idx + 1] || '';
      const context = [before, words[idx], after].filter(Boolean).join(' ');
      errors.push({ word: words[idx], suggestion, context });
      if (errors.length >= 10) break;
    }
  }

  const error_count = errors.length;
  const error_rate = checked_words > 0 ? Math.round((error_count / checked_words) * 1000) / 10 : 0;

  return { error_count, errors, checked_words, error_rate };
}
