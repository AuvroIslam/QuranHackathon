export type Mood = 'stressed' | 'sad' | 'grateful' | 'lost' | 'indecisive' | 'justHere' | 'overthinking';
export type UserGoal = 'complete' | 'learn';
export type UserLevel = 'newbie' | 'intermediate' | 'fluent';
export type TimePerDay = 3 | 5 | 10;

export interface Bookmark {
  id: string;
  verseKey: string;
  surahName: string;
  arabic: string;
  translation: string;
  createdAt: string;
  collectionName?: string;
}

export interface Ayah {
  arabic: string;
  transliteration?: string;
  translation: string;
  explanation: string;
  audioUrl: string;
  reference: string;
}

export interface WordResult {
  word: string;
  correct: boolean;
}

export interface SpeechResult {
  spoken: string;
  score: number;
  correct: boolean;
  words?: WordResult[];
}

export interface MCQData {
  question: string;
  options: string[];
  correctIndex: number;
}

export type JourneyStep =
  | 'mood'
  | 'ayah'
  | 'listen'
  | 'speak'
  | 'mcq'
  | 'reading'
  | 'completion';

export interface JourneyState {
  step: JourneyStep;
  mood?: Mood;
  customMoodText?: string;
  ayah?: Ayah;
  question?: MCQData;
  speechResult?: SpeechResult;
  speechAttempts: number;
  selectedAnswer?: number;
  action?: string;
  xpEarned: number;
  streak: number;
  lastCompletedDate?: string;
}

export const LEARN_STEP_ORDER: JourneyStep[] = [
  'mood',
  'ayah',
  'listen',
  'speak',
  'mcq',
  'completion',
];

export const COMPLETE_STEP_ORDER: JourneyStep[] = [
  'mood',
  'ayah',
  'reading',
  'completion',
];

export const STEP_ORDER = LEARN_STEP_ORDER;

export const STEP_LABELS: Record<JourneyStep, string> = {
  mood: 'Mood',
  ayah: 'Ayah',
  listen: 'Listen',
  speak: 'Speak',
  mcq: 'Reflect',
  reading: 'Read',
  completion: 'Done',
};
