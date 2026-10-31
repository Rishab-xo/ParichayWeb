import { useReducer, useRef, useCallback, useEffect } from 'react';
import {
  IntakeFsmState,
  IntakeResponse,
  IntakeStateContext,
  UseIntakeFsmReturn,
  CLARIFICATION_DELIMITER,
  FAIL_OPEN_SKIP_MARKER,
} from '../types/intake';
import { submitIntake } from '../services/intakeApi';

const STORAGE_KEY = 'refirm_intake_fsm_context_v1';

type IntakeAction =
  | { type: 'START_TURN_1'; initialStory: string }
  | { type: 'TURN_1_MISSING_DATA'; followUpQuestion: string }
  | { type: 'TURN_1_PROCESSED'; generatedBrief: string }
  | { type: 'START_TURN_2'; clarificationAnswer: string }
  | { type: 'TURN_2_PROCESSED'; generatedBrief: string }
  | { type: 'SET_ERROR'; errorMessage: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

const DEFAULT_CONTEXT: IntakeStateContext = {
  state: 'IDLE',
  initialStory: '',
  clarificationAnswer: '',
  followUpQuestion: null,
  generatedBrief: null,
  errorMessage: null,
  turnCounter: 1,
};

/**
 * Reducer executing explicit, deterministic FSM state transitions.
 */
function intakeReducer(state: IntakeStateContext, action: IntakeAction): IntakeStateContext {
  switch (action.type) {
    case 'START_TURN_1':
      return {
        ...state,
        state: 'SUBMITTING_TURN_1',
        initialStory: action.initialStory,
        clarificationAnswer: '',
        followUpQuestion: null,
        generatedBrief: null,
        errorMessage: null,
        turnCounter: 1,
      };

    case 'TURN_1_MISSING_DATA':
      return {
        ...state,
        state: 'CLARIFICATION_REQUIRED',
        followUpQuestion: action.followUpQuestion,
        turnCounter: 2,
        errorMessage: null,
      };

    case 'TURN_1_PROCESSED':
      return {
        ...state,
        state: 'COMPLETE',
        generatedBrief: action.generatedBrief,
        followUpQuestion: null,
        turnCounter: 1,
        errorMessage: null,
      };

    case 'START_TURN_2':
      return {
        ...state,
        state: 'SUBMITTING_TURN_2',
        clarificationAnswer: action.clarificationAnswer,
        errorMessage: null,
        turnCounter: 2,
      };

    case 'TURN_2_PROCESSED':
      return {
        ...state,
        state: 'COMPLETE',
        generatedBrief: action.generatedBrief,
        turnCounter: 2,
        errorMessage: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        state: 'ERROR',
        errorMessage: action.errorMessage,
      };

    case 'CLEAR_ERROR':
      // Recover to CLARIFICATION_REQUIRED if Strike 1 question exists, otherwise IDLE
      if (state.turnCounter >= 2 && state.followUpQuestion) {
        return {
          ...state,
          state: 'CLARIFICATION_REQUIRED',
          errorMessage: null,
        };
      }
      return {
        ...state,
        state: 'IDLE',
        errorMessage: null,
      };

    case 'RESET':
      return DEFAULT_CONTEXT;

    default:
      return state;
  }
}

/**
 * Initializes state context by hydrating from sessionStorage, sanitizing
 * any interrupted in-flight states caused by browser reloads.
 */
function getInitialContext(): IntakeStateContext {
  if (typeof window === 'undefined') {
    return DEFAULT_CONTEXT;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTEXT;

    const parsed = JSON.parse(raw) as Partial<IntakeStateContext>;
    let sanitizedState: IntakeFsmState = parsed.state || 'IDLE';

    // If page reloaded while submitting, reset to actionable non-locked state
    if (sanitizedState === 'SUBMITTING_TURN_1') {
      sanitizedState = parsed.initialStory ? 'IDLE' : 'IDLE';
    } else if (sanitizedState === 'SUBMITTING_TURN_2') {
      sanitizedState = parsed.followUpQuestion ? 'CLARIFICATION_REQUIRED' : 'IDLE';
    }

    return {
      state: sanitizedState,
      initialStory: parsed.initialStory || '',
      clarificationAnswer: parsed.clarificationAnswer || '',
      followUpQuestion: parsed.followUpQuestion ?? null,
      generatedBrief: parsed.generatedBrief ?? null,
      errorMessage: parsed.errorMessage ?? null,
      turnCounter: parsed.turnCounter ?? 1,
    };
  } catch (err) {
    console.warn('Failed to hydrate intake state from sessionStorage:', err);
    return DEFAULT_CONTEXT;
  }
}

/**
 * Custom React hook encapsulating the 2-Strike Stateless Intake Finite State Machine.
 * Manages synchronous in-flight locking, sessionStorage hydration, extended timeout handling,
 * and deterministic narrative compilation.
 */
export function useIntakeFsm(): UseIntakeFsmReturn {
  const [context, dispatch] = useReducer(intakeReducer, undefined, getInitialContext);

  // Synchronous lock to prevent duplicate network dispatches on rapid multi-clicks
  const inFlightRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize state context with sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (context.state === 'IDLE') {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
      }
    } catch (err) {
      console.warn('Failed to persist intake state to sessionStorage:', err);
    }
  }, [context]);

  // Clean up any pending abort controllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('UNMOUNT');
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Submits the client's initial narrative on Turn 1.
   * If critical data is missing, transitions to CLARIFICATION_REQUIRED.
   * If all data is present, transitions directly to COMPLETE.
   */
  const submitInitialStory = useCallback(async (story: string): Promise<IntakeResponse | null> => {
    if (inFlightRef.current) {
      console.warn('Intake submission ignored: another request is in flight.');
      return null;
    }

    const trimmedStory = story.trim();
    if (!trimmedStory) {
      dispatch({
        type: 'SET_ERROR',
        errorMessage: 'Please enter a description of your legal dispute before proceeding.',
      });
      return null;
    }

    inFlightRef.current = true;
    dispatch({ type: 'START_TURN_1', initialStory: trimmedStory });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await submitIntake(
        { userStory: trimmedStory, intakeTurn: 1 },
        { signal: controller.signal }
      );

      if (response.status === 'MISSING_DATA') {
        dispatch({
          type: 'TURN_1_MISSING_DATA',
          followUpQuestion:
            response.followUpQuestion ||
            'Could you provide additional details regarding the financial amount or location?',
        });
      } else {
        dispatch({
          type: 'TURN_1_PROCESSED',
          generatedBrief: response.generatedBrief || '',
        });
      }
      return response;
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during submission.';
      dispatch({ type: 'SET_ERROR', errorMessage: message });
      return null;
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Submits the user's clarification answer on Turn 2.
   * Compiles the initial narrative and clarification into a deterministic delimiter-separated payload.
   */
  const submitClarification = useCallback(async (answer: string): Promise<IntakeResponse | null> => {
    if (inFlightRef.current) {
      console.warn('Clarification submission ignored: another request is in flight.');
      return null;
    }

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      dispatch({
        type: 'SET_ERROR',
        errorMessage: 'Please provide clarification or click "Skip to draft" to proceed.',
      });
      return null;
    }

    const compiledStory = `${context.initialStory.trim()}${CLARIFICATION_DELIMITER}${trimmedAnswer}`;

    inFlightRef.current = true;
    dispatch({ type: 'START_TURN_2', clarificationAnswer: trimmedAnswer });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await submitIntake(
        { userStory: compiledStory, intakeTurn: 2 },
        { signal: controller.signal }
      );

      dispatch({
        type: 'TURN_2_PROCESSED',
        generatedBrief: response.generatedBrief || '',
      });
      return response;
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during clarification.';
      dispatch({ type: 'SET_ERROR', errorMessage: message });
      return null;
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, [context.initialStory]);

  /**
   * Bypasses the clarification prompt with a fail-open marker on Turn 2.
   * Compiles the initial narrative with the fail-open marker and requests immediate brief generation.
   */
  const skipClarification = useCallback(async (): Promise<IntakeResponse | null> => {
    if (inFlightRef.current) {
      console.warn('Skip clarification ignored: another request is in flight.');
      return null;
    }

    const compiledStory = `${context.initialStory.trim()}${CLARIFICATION_DELIMITER}${FAIL_OPEN_SKIP_MARKER}`;

    inFlightRef.current = true;
    dispatch({ type: 'START_TURN_2', clarificationAnswer: FAIL_OPEN_SKIP_MARKER });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await submitIntake(
        { userStory: compiledStory, intakeTurn: 2 },
        { signal: controller.signal }
      );

      dispatch({
        type: 'TURN_2_PROCESSED',
        generatedBrief: response.generatedBrief || '',
      });
      return response;
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        return null;
      }
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred during fail-open draft generation.';
      dispatch({ type: 'SET_ERROR', errorMessage: message });
      return null;
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, [context.initialStory]);

  /**
   * Resets the entire intake flow back to IDLE and clears sessionStorage.
   */
  const resetIntake = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('RESET');
      abortControllerRef.current = null;
    }
    inFlightRef.current = false;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    dispatch({ type: 'RESET' });
  }, []);

  /**
   * Clears any active error state and returns to an actionable state.
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    context,
    state: context.state,
    isSubmitting: context.state === 'SUBMITTING_TURN_1' || context.state === 'SUBMITTING_TURN_2',
    isIdle: context.state === 'IDLE',
    isClarificationRequired: context.state === 'CLARIFICATION_REQUIRED',
    isComplete: context.state === 'COMPLETE',
    isError: context.state === 'ERROR',
    submitInitialStory,
    submitClarification,
    skipClarification,
    resetIntake,
    clearError,
  };
}
