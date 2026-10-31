/**
 * Intake Types and State Machine Interfaces for Project Refirm.
 * Encapsulates the stateless 2-strike intake protocol between
 * the React client and the Spring Boot backend (/api/v1.0/intake).
 */

export type IntakeStatus = 'MISSING_DATA' | 'PROCESSED';

export interface IntakeRequest {
  userStory: string;
  intakeTurn: number;
}

export interface IntakeResponse {
  status: IntakeStatus;
  followUpQuestion: string | null;
  generatedBrief: string | null;
}

export type IntakeFsmState =
  | 'IDLE'
  | 'SUBMITTING_TURN_1'
  | 'CLARIFICATION_REQUIRED'
  | 'SUBMITTING_TURN_2'
  | 'COMPLETE'
  | 'ERROR';

export interface IntakeStateContext {
  state: IntakeFsmState;
  initialStory: string;
  clarificationAnswer: string;
  followUpQuestion: string | null;
  generatedBrief: string | null;
  errorMessage: string | null;
  turnCounter: number;
}

/**
 * Structured, immutable delimiter separating the client's initial narrative
 * and the Turn 2 clarification payload.
 */
export const CLARIFICATION_DELIMITER = '\n\n--- User Clarification (Jurisdictional / Financial Facts) ---\n';

/**
 * Standardized Fail-Open marker used when the user selects "I don't know / Skip to draft".
 */
export const FAIL_OPEN_SKIP_MARKER = 'Amount unknown; client requested immediate draft under fail-open evaluation.';

/**
 * Return type definition for the useIntakeFsm hook.
 */
export interface UseIntakeFsmReturn {
  context: IntakeStateContext;
  state: IntakeFsmState;
  isSubmitting: boolean;
  isIdle: boolean;
  isClarificationRequired: boolean;
  isComplete: boolean;
  isError: boolean;
  submitInitialStory: (story: string) => Promise<IntakeResponse | null>;
  submitClarification: (answer: string) => Promise<IntakeResponse | null>;
  skipClarification: () => Promise<IntakeResponse | null>;
  resetIntake: () => void;
  clearError: () => void;
}
