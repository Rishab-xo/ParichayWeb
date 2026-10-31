import { getValidAuthToken, getActiveToken, formatAuthHeader } from './authTokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1.0';

/**
 * Resolves base URL cleanly
 */
const getBaseUrl = () => {
    return API_BASE_URL.replace(/\/+$/, '');
};

/**
 * Helper to execute authorized fetch requests to workspace endpoints
 */
async function workspaceFetch(endpoint, options = {}) {
    const base = getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${cleanEndpoint}`;

    const rawToken = options.token || await getValidAuthToken();
    const authHeader = formatAuthHeader(rawToken);

    const headers = {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        ...options.headers,
    };

    // If body is not FormData, default to application/json
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Auto-retry once on 401: Clerk token refresh
    if (response.status === 401 && !options._isRetry) {
        console.warn('[WorkspaceAPI] 401 Unauthorized received, attempting token refresh...');
        const freshToken = await getValidAuthToken(true);
        if (freshToken) {
            return workspaceFetch(endpoint, {
                ...options,
                _isRetry: true,
                token: freshToken,
            });
        }
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('You are currently logged out. Please sign in to use this service.');
        }
        let errorMsg = `HTTP ${response.status} ${response.statusText}`;
        try {
            const errJson = await response.json();
            errorMsg = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch {
            const text = await response.text();
            if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
}

/**
 * Lists workspaces for current user, optionally filtered by mode (QUICK_CONSULT | CASE_PROJECT).
 */
export async function listWorkspaces(mode = null) {
    const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
    return workspaceFetch(`/workspaces${query}`, { method: 'GET' });
}

/**
 * Retrieves full workspace details, fact ledger, latest brief, and document vault catalog.
 */
export async function getWorkspace(workspaceId) {
    return workspaceFetch(`/workspaces/${workspaceId}`, { method: 'GET' });
}

/**
 * Creates a fast Quick Consult workspace.
 */
export async function createQuickConsult(perspective = 'CLAIMANT_PETITIONER') {
    return workspaceFetch('/workspaces/quick-consult', {
        method: 'POST',
        body: JSON.stringify({ perspective }),
    });
}

/**
 * Creates a formal Case Project workspace.
 */
export async function createCaseProject({ caseTitle, clientName, perspective = 'CLAIMANT_PETITIONER' }) {
    return workspaceFetch('/workspaces/case-projects', {
        method: 'POST',
        body: JSON.stringify({ caseTitle, clientName, perspective }),
    });
}

/**
 * Promotes a Quick Consult workspace to a Case Project.
 */
export async function promoteWorkspace(workspaceId, { caseTitle, clientName, perspective, excludedDocumentIds = [] }) {
    return workspaceFetch(`/workspaces/${workspaceId}/promote`, {
        method: 'POST',
        body: JSON.stringify({ caseTitle, clientName, perspective, excludedDocumentIds }),
    });
}

/**
 * Runs the strategic two-pass pipeline within a workspace and updates the fact ledger.
 */
export async function runWorkspaceTriage(workspaceId, { userNarrative, userLocation = '' }) {
    return workspaceFetch(`/workspaces/${workspaceId}/triage`, {
        method: 'POST',
        body: JSON.stringify({ userNarrative, userLocation }),
    });
}

/**
 * Applies lawyer fact overrides and sets lock safeguards against AI regressions.
 */
export async function updateFactLedger(workspaceId, { updatedFacts, updatedRuleFacts, fieldsToLock = [] }) {
    return workspaceFetch(`/workspaces/${workspaceId}/facts`, {
        method: 'PATCH',
        body: JSON.stringify({ updatedFacts, updatedRuleFacts, fieldsToLock }),
    });
}

/**
 * Ingests a raw file (PDF, TXT, MD) into the workspace document vault.
 * Evaluates OCR Quality Gate, generates Page-OKF manifest + IRAC brief, and safe fact reconciliation.
 */
export async function uploadDocument(workspaceId, file, documentType = 'EVIDENCE_OTHER') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return workspaceFetch(`/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        body: formData,
    });
}

/**
 * Retrieves the StructuredDocumentSummary and DocumentOkfManifest for a specific document.
 */
export async function getDocumentSummary(workspaceId, documentId) {
    return workspaceFetch(`/workspaces/${workspaceId}/documents/${documentId}/summary`, {
        method: 'GET',
    });
}

/**
 * Queries the workspace legal assistant grounded in CaseFactLedger and Page-OKF retrieved pages.
 */
export async function askWorkspaceAssistant(workspaceId, question) {
    return workspaceFetch(`/workspaces/${workspaceId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question }),
    });
}

// ─── STEP 3: HYBRID OKF TEMPLATES & DRAFTING ENGINE ───

/**
 * Lists available master templates, optionally filtered by category or legal domain.
 */
export async function listTemplates(category = null, domain = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (domain) params.append('domain', domain);
    const query = params.toString() ? `?${params.toString()}` : '';
    return workspaceFetch(`/templates${query}`, { method: 'GET' });
}

/**
 * Fetches the complete manifest, particulars, aiBlocks, and skeleton of a specific master template.
 */
export async function getTemplate(templateId) {
    return workspaceFetch(`/templates/${templateId}`, { method: 'GET' });
}

/**
 * Obtains procedural recommendations ranked by domain (+50), perspective (+40), and procedural rules (+25).
 */
export async function getTemplateRecommendations(workspaceId) {
    return workspaceFetch(`/workspaces/${workspaceId}/templates/recommendations`, { method: 'GET' });
}

/**
 * Initializes a new versioned draft (v1) with 0-token fact auto-filling.
 */
export async function initializeDraft(workspaceId, templateId, userProvidedOverrides = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts`, {
        method: 'POST',
        body: JSON.stringify({ templateId, userProvidedOverrides }),
    });
}

/**
 * Lists all drafts persisted within a workspace ordered by updatedAt descending.
 */
export async function listDrafts(workspaceId) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts`, { method: 'GET' });
}

/**
 * Fetches a specific draft by ID.
 */
export async function getDraft(workspaceId, draftId) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}`, { method: 'GET' });
}

/**
 * Updates scalar particulars with 0 tokens and strictly preserves previously synthesized AI narrative blocks.
 */
export async function updateDraftParticulars(workspaceId, draftId, updatedParticulars) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}/particulars`, {
        method: 'PATCH',
        body: JSON.stringify(updatedParticulars),
    });
}

/**
 * Synthesizes isolated AI narrative blocks without modifying the statutory skeleton or verification clause.
 */
export async function populateAiNarrativeBlocks(workspaceId, draftId, customLawyerInstruction = '') {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}/ai-populate`, {
        method: 'POST',
        body: JSON.stringify({ customLawyerInstruction }),
    });
}

/**
 * Step 3.1: Refines an individual AI narrative block with chat directives and optional locking.
 */
export async function refineSingleAiBlock(workspaceId, draftId, blockKey, { lawyerInstruction = '', lockAfterRefine = true } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}/blocks/${encodeURIComponent(blockKey)}/refine`, {
        method: 'POST',
        body: JSON.stringify({ lawyerInstruction, lockAfterRefine }),
    });
}

/**
 * Step 3.1: Updates an AI narrative block manually and toggles its lock state.
 */
export async function updateAiBlockManually(workspaceId, draftId, blockKey, { manualMarkdownContent = '', lockBlock = false } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}/blocks/${encodeURIComponent(blockKey)}`, {
        method: 'PATCH',
        body: JSON.stringify({ manualMarkdownContent, lockBlock }),
    });
}

// ─── STEP 4: COURTROOM ARGUMENT PREP & ADVERSARIAL REBUTTAL MATRIX ───

/**
 * Generates or regenerates an end-to-end Courtroom Argument Sheet for a workspace.
 */
export async function generateArgumentSheet(workspaceId, { partyPerspective = null, customFocusInstruction = null } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments`, {
        method: 'POST',
        body: JSON.stringify({ partyPerspective, customFocusInstruction }),
    });
}

/**
 * Lists all courtroom argument sheets generated for a workspace.
 */
export async function listArgumentSheets(workspaceId) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments`, {
        method: 'GET',
    });
}

/**
 * Retrieves a specific courtroom argument sheet by ID.
 */
export async function getArgumentSheet(workspaceId, sheetId) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments/${sheetId}`, {
        method: 'GET',
    });
}

/**
 * Appends a targeted adversary contention and receives instant counter-rebuttal and authority anchors.
 */
export async function appendTargetedRebuttal(workspaceId, sheetId, oppositePartyContention) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments/${sheetId}/rebuttals`, {
        method: 'POST',
        body: JSON.stringify({ oppositePartyContention }),
    });
}

/**
 * Manually updates or locks/unlocks a specific legal submission in the argument sheet.
 */
export async function updateSubmission(workspaceId, sheetId, submissionId, { submission, lockSubmission = false } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments/${sheetId}/submissions/${encodeURIComponent(submissionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ submission, lockSubmission }),
    });
}

// ─── CONTRACT EXTENSIONS: PROMPT ROUTER, 4-PILL INSPECTOR, CITATION MUTATOR & WAR-ROOM ───

/**
 * Submits a prompt to the Safe Prompt Router (View 1B).
 * In AUTO mode, executes silent triage and returns the 3 "What's next?" suggestion cards.
 */
export async function submitWorkspacePrompt(workspaceId, {
    promptText,
    executionMode = 'AUTO',
    responseLanguage = 'English',
    locationHint = '',
    partyPerspective = null,
    temporary = false,
} = {}) {
    const isRealWorkspace = workspaceId && workspaceId !== 'default-ws' && workspaceId !== 'ws-default' && workspaceId !== 'new';
    const target = isRealWorkspace ? `/workspaces/${workspaceId}/prompt` : '/workspaces/prompt';
    return workspaceFetch(target, {
        method: 'POST',
        body: JSON.stringify({
            promptText,
            executionMode,
            responseLanguage,
            locationHint,
            partyPerspective,
            temporary,
        }),
    });
}


/**
 * Unified 4-pill right inspector endpoint (Particulars | Cited | Statutes | Relevant) (View 2B).
 */
export async function getRightPaneInspector(workspaceId, { targetType = 'DRAFT', targetId = null } = {}) {
    const query = new URLSearchParams();
    if (targetType) query.append('targetType', targetType);
    if (targetId) query.append('targetId', targetId);
    return workspaceFetch(`/workspaces/${workspaceId}/inspector?${query.toString()}`, {
        method: 'GET',
    });
}

/**
 * Menu Item 1: Opens full judgment in-app IRAC + full-text slide-over drawer (0 external redirect).
 */
export async function getAuthorityDrawer(workspaceId, authorityId) {
    return workspaceFetch(`/workspaces/${workspaceId}/authorities/${encodeURIComponent(authorityId)}/drawer`, {
        method: 'GET',
    });
}

/**
 * Menu Items 4 & 5 & Relevant Tab: Mutates draft citation (USE_IN_DRAFT | REPLACE | REMOVE).
 */
export async function mutateDraftCitation(workspaceId, draftId, { action, targetAuthorityId, replacementAuthorityId = null, targetBlockKey = null } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/drafts/${draftId}/citations/mutate`, {
        method: 'POST',
        body: JSON.stringify({ action, targetAuthorityId, replacementAuthorityId, targetBlockKey }),
    });
}

/**
 * Mutates argument sheet citation (USE_IN_DRAFT | REPLACE | REMOVE).
 */
export async function mutateArgumentCitation(workspaceId, sheetId, { action, targetAuthorityId, replacementAuthorityId = null } = {}) {
    return workspaceFetch(`/workspaces/${workspaceId}/arguments/${sheetId}/citations/mutate`, {
        method: 'POST',
        body: JSON.stringify({ action, targetAuthorityId, replacementAuthorityId }),
    });
}

/**
 * Menu Item 6: Saves authority to matter.
 */
export async function saveAuthorityToMatter(workspaceId, authorityId) {
    return workspaceFetch(`/workspaces/${workspaceId}/authorities/${encodeURIComponent(authorityId)}/save`, {
        method: 'POST',
    });
}

/**
 * Attaches an orphan Quick Consult chat into an existing Case Project matter (View 3B).
 */
export async function attachChatToMatter(targetMatterWorkspaceId, sourceQuickConsultWorkspaceId) {
    return workspaceFetch(`/workspaces/${targetMatterWorkspaceId}/attach-chat/${sourceQuickConsultWorkspaceId}`, {
        method: 'POST',
    });
}

/**
 * Retrieves the full Matter Dashboard War-Room payload (View 3C).
 */
export async function getMatterDashboard(workspaceId) {
    return workspaceFetch(`/workspaces/${workspaceId}/dashboard`, {
        method: 'GET',
    });
}

/**
 * Permanently deletes a workspace and all associated documents, drafts, and arguments.
 */
export async function deleteWorkspace(workspaceId) {
    if (!workspaceId) throw new Error('workspaceId is required for deletion');
    return workspaceFetch(`/workspaces/${workspaceId}`, {
        method: 'DELETE',
    });
}

export default {
    listWorkspaces,
    getWorkspace,
    deleteWorkspace,
    createQuickConsult,
    createCaseProject,
    promoteWorkspace,
    runWorkspaceTriage,
    updateFactLedger,
    uploadDocument,
    getDocumentSummary,
    askWorkspaceAssistant,
    listTemplates,
    getTemplate,
    getTemplateRecommendations,
    initializeDraft,
    listDrafts,
    getDraft,
    updateDraftParticulars,
    populateAiNarrativeBlocks,
    refineSingleAiBlock,
    updateAiBlockManually,
    generateArgumentSheet,
    listArgumentSheets,
    getArgumentSheet,
    appendTargetedRebuttal,
    updateSubmission,
    submitWorkspacePrompt,
    getRightPaneInspector,
    getAuthorityDrawer,
    mutateDraftCitation,
    mutateArgumentCitation,
    saveAuthorityToMatter,
    attachChatToMatter,
    getMatterDashboard,
};
