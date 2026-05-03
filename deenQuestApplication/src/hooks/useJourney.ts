import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer } from 'react';
import {
  Ayah, COMPLETE_STEP_ORDER, JourneyState, JourneyStep, LEARN_STEP_ORDER,
  MCQData, Mood, SpeechResult, UserGoal,
} from '../types';

const STORAGE_KEY = '@deenquest_journey';

const INITIAL_STATE: JourneyState = {
  step: 'mood',
  speechAttempts: 0,
  xpEarned: 0,
  streak: 0,
};

type Action =
  | { type: 'SET_MOOD'; mood: Mood; ayah: Ayah; question: MCQData; customText?: string }
  | { type: 'NEXT_STEP'; stepOrder: JourneyStep[] }
  | { type: 'SET_SPEECH_RESULT'; result: SpeechResult }
  | { type: 'SET_ANSWER'; index: number }
  | { type: 'SET_ACTION'; action: string }
  | { type: 'COMPLETE' }
  | { type: 'RESTART' }
  | { type: 'LOAD'; state: JourneyState };

function reducer(state: JourneyState, action: Action): JourneyState {
  switch (action.type) {
    case 'SET_MOOD':
      return {
        ...state,
        step: 'ayah',
        mood: action.mood,
        customMoodText: action.customText ?? undefined,
        ayah: action.ayah,
        question: action.question,
      };
    case 'NEXT_STEP': {
      const currentIndex = action.stepOrder.indexOf(state.step);
      const nextStep = action.stepOrder[currentIndex + 1] ?? 'completion';
      return { ...state, step: nextStep };
    }
    case 'SET_SPEECH_RESULT': {
      const xpBonus = action.result.correct ? 5 : 0;
      return {
        ...state,
        speechResult: action.result,
        speechAttempts: state.speechAttempts + 1,
        xpEarned: state.xpEarned + xpBonus,
      };
    }
    case 'SET_ANSWER': {
      const xpBonus = action.index === state.question?.correctIndex ? 5 : 0;
      return {
        ...state,
        selectedAnswer: action.index,
        xpEarned: state.xpEarned + xpBonus,
      };
    }
    case 'SET_ACTION':
      return { ...state, action: action.action };
    case 'COMPLETE': {
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = state.lastCompletedDate !== today;
      const newStreak = isNewDay ? state.streak + 1 : state.streak;
      return {
        ...state,
        step: 'completion',
        streak: newStreak,
        xpEarned: state.xpEarned + 10,
        lastCompletedDate: today,
      };
    }
    case 'RESTART':
      return {
        ...INITIAL_STATE,
        streak: state.streak,
        lastCompletedDate: state.lastCompletedDate,
      };
    case 'LOAD':
      return action.state;
    default:
      return state;
  }
}

export function useJourney(goal?: UserGoal | null, uid?: string | null) {
  const stepOrder = goal === 'complete' ? COMPLETE_STEP_ORDER : LEARN_STEP_ORDER;
  const storageKey = uid ? `${STORAGE_KEY}_${uid}` : STORAGE_KEY;
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => {});
  }, [state, storageKey]);

  useEffect(() => {
    // Reset to initial when uid changes (new account)
    dispatch({ type: 'RESTART' });
    if (!uid) return;
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (!raw) return;
      try {
        const saved: JourneyState = JSON.parse(raw);
        if (saved.step === 'completion') {
          dispatch({
            type: 'LOAD',
            state: { ...INITIAL_STATE, streak: saved.streak, lastCompletedDate: saved.lastCompletedDate },
          });
        } else {
          // Validate that the saved step exists in current step order
          const validStep = stepOrder.includes(saved.step) ? saved.step : 'mood';
          dispatch({ type: 'LOAD', state: { ...saved, step: validStep } });
        }
      } catch {}
    });
  }, [uid]);

  const selectMood = useCallback((mood: Mood, ayah: Ayah, question: MCQData, customText?: string) => {
    dispatch({ type: 'SET_MOOD', mood, ayah, question, customText });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP', stepOrder });
  }, [stepOrder]);

  const setSpeechResult = useCallback((result: SpeechResult) => {
    dispatch({ type: 'SET_SPEECH_RESULT', result });
  }, []);

  const setAnswer = useCallback((index: number) => {
    dispatch({ type: 'SET_ANSWER', index });
  }, []);

  const setAction = useCallback((action: string) => {
    dispatch({ type: 'SET_ACTION', action });
  }, []);

  const complete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  const stepIndex = stepOrder.indexOf(state.step);
  const totalSteps = stepOrder.length;

  return {
    state,
    stepIndex,
    totalSteps,
    selectMood,
    nextStep,
    setSpeechResult,
    setAnswer,
    setAction,
    complete,
    restart,
  };
}
