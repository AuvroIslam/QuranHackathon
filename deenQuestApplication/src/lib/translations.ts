export const TRANSLATION_OPTIONS = [
  { id: 20,  name: 'English — Sahih International' },
  { id: 131, name: 'English — Dr. Mustafa Khattab' },
  { id: 85,  name: 'English — Pickthall' },
  { id: 95,  name: 'English — Yusuf Ali' },
  { id: 149, name: 'French' },
  { id: 78,  name: 'German' },
  { id: 76,  name: 'Urdu — Fateh Muhammad Jalandhari' },
  { id: 54,  name: 'Bengali' },
  { id: 203, name: 'Spanish — Asad' },
  { id: 167, name: 'Indonesian' },
  { id: 209, name: 'Russian — Kuliev' },
  { id: 221, name: 'Turkish — Diyanet' },
] as const;

export type TranslationOption = typeof TRANSLATION_OPTIONS[number];
export const DEFAULT_TRANSLATION_ID = 20;
