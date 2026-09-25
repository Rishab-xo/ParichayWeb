const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1.0';

/**
 * Helper to get the active Clerk JWT token if available.
 */
export const getActiveToken = () => {
    if (typeof window !== 'undefined' && window.jwt) {
        return window.jwt;
    }
    return null;
};

/**
 * Generic request helper with automatic auth header injection and error handling.
 */
async function apiRequest(endpoint, options = {}, customToken = null) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = customToken || getActiveToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        let errorDetails = `HTTP ${response.status} ${response.statusText}`;
        try {
            const errorJson = await response.json();
            errorDetails = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } catch {
            const errorText = await response.text();
            if (errorText) errorDetails = errorText;
        }
        throw new Error(errorDetails);
    }

    // Return blob if response is a file download
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
        return response.blob();
    }

    // Return text if response is plain text (like draft markdown)
    if (contentType.includes('text/plain') || contentType.includes('text/markdown')) {
        return response.text();
    }

    // Return JSON by default
    try {
        return await response.json();
    } catch {
        return await response.text();
    }
}

// ─────────────────────────────────────────────────────────────
// TRIAGE API ENDPOINTS (/triage)
// ─────────────────────────────────────────────────────────────

/**
 * Start a new AI legal triage intake session.
 * @param {string} [token] - Optional Clerk JWT token
 * @returns {Promise<{ sessionId: string, status: string, message: string }>}
 */
export async function startTriageSession(token = null) {
    return apiRequest('/triage/start', {
        method: 'POST',
    }, token);
}

/**
 * Send an intake message in a multi-turn chat session with memory.
 * If sessionId is null/undefined, the backend generates a new session and returns it.
 * @param {string} message - User's input text
 * @param {string} [sessionId] - Optional session ID
 * @param {string} [token] - Optional Clerk JWT token
 * @returns {Promise<{ sessionId: string, reply: string, nextQuestion: string, status: string, isComplete: boolean, complete: boolean, issueCategory: string, isEmergency: boolean, extractedFacts: string[] }>}
 */
export async function sendTriageChat(message, sessionId = null, token = null) {
    return apiRequest('/triage/chat', {
        method: 'POST',
        body: JSON.stringify({
            message,
            sessionId: sessionId || undefined
        }),
    }, token);
}

/**
 * Send an intake message in an active triage session.
 * @param {string} sessionId - UUID of the session
 * @param {string} message - User's input text
 * @param {string} [token] - Optional Clerk JWT token
 * @returns {Promise<{ sessionId: string, isComplete: boolean, nextQuestion: string, issueCategory: string, isEmergency: boolean, extractedFacts: Record<string, any> }>}
 */
export async function sendTriageMessage(sessionId, message, token = null) {
    return sendTriageChat(message, sessionId, token);
}

/**
 * Retrieve the current session state and chat history.
 * @param {string} sessionId - UUID of the session
 * @param {string} [token] - Optional Clerk JWT token
 */
export async function getTriageSession(sessionId, token = null) {
    return apiRequest(`/triage/${sessionId}`, {
        method: 'GET',
    }, token);
}

// ─────────────────────────────────────────────────────────────
// DRAFT GENERATION API ENDPOINTS (/draft)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a legal brief draft in Markdown format using Spring AI RAG.
 * @param {string} facts - Extracted facts or narrative
 * @param {string} domain - Legal domain/category
 * @param {string} [token] - Optional Clerk JWT token
 * @returns {Promise<string>} Markdown draft string
 */
export async function generateDraftBrief(facts, domain, token = null) {
    return apiRequest('/draft/generate', {
        method: 'POST',
        body: JSON.stringify({ facts, domain }),
    }, token);
}

// ─────────────────────────────────────────────────────────────
// EXPORT API ENDPOINTS (/export)
// ─────────────────────────────────────────────────────────────

/**
 * Export document HTML content as PDF or DOCX file blob.
 * @param {'pdf' | 'docx'} format
 * @param {string} htmlContent - Final edited HTML from TipTap
 * @param {string} [token] - Optional Clerk JWT token
 * @returns {Promise<Blob>}
 */
export async function exportDocument(format, htmlContent, token = null) {
    return apiRequest(`/export/${format}`, {
        method: 'POST',
        body: JSON.stringify({ htmlContent }),
    }, token);
}

// ─────────────────────────────────────────────────────────────
// AI TEST & DIAGNOSTICS ENDPOINTS (/ai)
// ─────────────────────────────────────────────────────────────

/**
 * Diagnostic call to test AI connectivity
 */
export async function testAiConnection(message = 'Hello', model = '', token = null) {
    return apiRequest('/ai/test', {
        method: 'POST',
        body: JSON.stringify({ message, model }),
    }, token);
}

export default {
    startTriageSession,
    sendTriageMessage,
    getTriageSession,
    generateDraftBrief,
    exportDocument,
    testAiConnection,
    getActiveToken,
    API_BASE_URL,
};
