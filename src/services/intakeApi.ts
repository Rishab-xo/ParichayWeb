import { IntakeRequest, IntakeResponse } from '../types/intake';

/**
 * Typed error class representing intake API exceptions.
 */
export class IntakeApiError extends Error {
  public readonly status?: number;
  public readonly isTimeout: boolean;
  public readonly details?: unknown;

  constructor(message: string, status?: number, isTimeout = false, details?: unknown) {
    super(message);
    this.name = 'IntakeApiError';
    this.status = status;
    this.isTimeout = isTimeout;
    this.details = details;
  }
}

export interface SubmitIntakeOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * Resolves the absolute URL for the intake endpoint based on environment configuration.
 */
const resolveEndpointUrl = (): string => {
  const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080/api/v1.0';
  const cleanBase = base.replace(/\/+$/, '');
  return cleanBase.endsWith('/api/v1.0') ? `${cleanBase}/intake` : `${cleanBase}/api/v1.0/intake`;
};

/**
 * Submits an intake turn to the Spring Boot stateless intake endpoint with extended timeout.
 *
 * @param request Inbound payload conforming to { userStory, intakeTurn }
 * @param options Configuration options including timeout and caller AbortSignal
 * @returns Promise resolving to IntakeResponse with MISSING_DATA or PROCESSED status
 * @throws IntakeApiError on timeout, network failure, or non-2xx HTTP responses
 */
export async function submitIntake(
  request: IntakeRequest,
  options: SubmitIntakeOptions = {}
): Promise<IntakeResponse> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal } = options;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort('TIMEOUT');
  }, timeoutMs);

  const handleCallerAbort = () => {
    controller.abort(callerSignal?.reason);
  };

  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new IntakeApiError('Intake request was cancelled before transmission.', undefined, false);
    }
    callerSignal.addEventListener('abort', handleCallerAbort, { once: true });
  }

  try {
    const url = resolveEndpointUrl();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = `Intake API error: HTTP ${response.status} ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        errorDetails = await response.json();
        if (errorDetails && typeof errorDetails === 'object') {
          const casted = errorDetails as Record<string, unknown>;
          if (casted.message && typeof casted.message === 'string') {
            errorMessage = casted.message;
          } else if (casted.error && typeof casted.error === 'string') {
            errorMessage = casted.error;
          }
        }
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {
          // ignore stream parse failure
        }
      }
      throw new IntakeApiError(errorMessage, response.status, false, errorDetails);
    }

    const data: IntakeResponse = await response.json();

    if (!data || typeof data !== 'object' || (data.status !== 'MISSING_DATA' && data.status !== 'PROCESSED')) {
      throw new IntakeApiError(
        'Malformed intake response received from server. Expected status MISSING_DATA or PROCESSED.',
        response.status,
        false,
        data
      );
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof IntakeApiError) {
      throw error;
    }

    if (timedOut || controller.signal.reason === 'TIMEOUT') {
      throw new IntakeApiError(
        `Legal intake analysis timed out after ${Math.round(timeoutMs / 1000)} seconds. Generating formal legal grounds and drafting a petition may take longer under high load. Please try again.`,
        408,
        true
      );
    }

    if (callerSignal?.aborted) {
      throw new IntakeApiError('Intake request was cancelled.', undefined, false);
    }

    const message = error instanceof Error ? error.message : 'Unknown network failure during intake submission.';
    throw new IntakeApiError(`Network error connecting to Refirm backend: ${message}`);
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal) {
      callerSignal.removeEventListener('abort', handleCallerAbort);
    }
  }
}

/**
 * Resolves the absolute URL for the export PDF endpoint based on environment configuration.
 */
export const resolvePdfExportUrl = (): string => {
  const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080/api/v1.0';
  const cleanBase = base.replace(/\/+$/, '');
  return cleanBase.endsWith('/api/v1.0') ? `${cleanBase}/export/pdf` : `${cleanBase}/api/v1.0/export/pdf`;
};

/**
 * Sends brief markdown to the stateless PDF engine and triggers a browser file download.
 *
 * @param markdown The sanitized legal brief markdown content
 * @param filename Custom download filename (defaults to Refirm_Legal_Strategy.pdf)
 */
export async function downloadBriefPdf(
  markdown: string,
  filename = `Refirm_Legal_Strategy_${new Date().toISOString().slice(0, 10)}.pdf`
): Promise<void> {
  const url = resolvePdfExportUrl();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ markdownBrief: markdown, markdown }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `PDF export failed with HTTP ${response.status}${errorText ? `: ${errorText}` : ''}`
    );
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export interface PipelineBriefPayload {
  userNarrative: string;
  location?: string;
}

export interface PipelineBriefResult {
  brief: string;
  location: string;
}

/**
 * Resolves the absolute URL for the Two-Pass Pipeline brief endpoint.
 */
export const resolvePipelineEndpointUrl = (): string => {
  const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080/api/v1.0';
  const cleanBase = base.replace(/\/+$/, '');
  return cleanBase.endsWith('/api/v1.0') ? `${cleanBase}/triage/pipeline-brief` : `${cleanBase}/api/triage/pipeline-brief`;
};

/**
 * Submits dispute narrative and location to the Two-Pass Legal Pipeline (Pass 1 Extraction -> Pass 2 o3-mini Drafting).
 * Strictly complies with payload { userNarrative, location } and enforces 60s timeout for reasoning models.
 */
export async function submitPipelineBrief(
  payload: PipelineBriefPayload,
  options: SubmitIntakeOptions = {}
): Promise<PipelineBriefResult> {
  const { timeoutMs = 60_000, signal: callerSignal } = options;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort('TIMEOUT');
  }, timeoutMs);

  const handleCallerAbort = () => {
    controller.abort(callerSignal?.reason);
  };

  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new IntakeApiError('Pipeline request was cancelled before transmission.', undefined, false);
    }
    callerSignal.addEventListener('abort', handleCallerAbort, { once: true });
  }

  try {
    const url = resolvePipelineEndpointUrl();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // STRICT PAYLOAD COMPLIANCE: exactly two fields, zero legacy fields
      body: JSON.stringify({
        userNarrative: payload.userNarrative,
        location: payload.location?.trim() || '',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = `Pipeline API error: HTTP ${response.status} ${response.statusText}`;
      try {
        const errorDetails = await response.json();
        if (errorDetails?.error) errorMessage = errorDetails.error;
        else if (errorDetails?.message) errorMessage = errorDetails.message;
      } catch {
        const text = await response.text().catch(() => '');
        if (text) errorMessage = text;
      }
      throw new IntakeApiError(errorMessage, response.status, false);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object' || typeof data.brief !== 'string') {
      throw new IntakeApiError('Malformed pipeline brief response received from server.', response.status, false, data);
    }

    return {
      brief: data.brief,
      location: data.location || payload.location?.trim() || '',
    };
  } catch (error: unknown) {
    if (error instanceof IntakeApiError) {
      throw error;
    }
    if (timedOut || controller.signal.reason === 'TIMEOUT') {
      throw new IntakeApiError(
        'Deep legal reasoning timed out after 60 seconds. High complexity cases may take longer. Please try again.',
        408,
        true
      );
    }
    if (callerSignal?.aborted) {
      throw new IntakeApiError('Pipeline request was cancelled.', undefined, false);
    }
    const message = error instanceof Error ? error.message : 'Unknown network failure during pipeline submission.';
    throw new IntakeApiError(`Network error connecting to Refirm Two-Pass Pipeline: ${message}`);
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal) {
      callerSignal.removeEventListener('abort', handleCallerAbort);
    }
  }
}

