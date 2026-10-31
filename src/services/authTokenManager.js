/**
 * Auth Token Manager
 * Follows Single Responsibility Principle (SRP) to reliably manage and refresh Clerk JWT tokens.
 * Automatically obtains fresh tokens from Clerk's session, avoiding stale/expired JWT failures.
 */

let tokenProviderFn = null;

/**
 * Registers an async token provider function (e.g. from React useAuth).
 * @param {Function} providerFn - Async function that resolves to fresh token
 */
export function registerTokenProvider(providerFn) {
    tokenProviderFn = providerFn;
}

/**
 * Obtains a fresh, valid Clerk JWT token.
 * 1. Checks window.Clerk?.session?.getToken() (which automatically refreshes if expired).
 * 2. If provider is registered, calls it.
 * 3. Falls back to window.jwt if set.
 * @param {boolean} forceRefresh - If true, skips cache to force a fresh JWT from Clerk
 * @returns {Promise<string|null>}
 */
export async function getValidAuthToken(forceRefresh = false) {
    // 1. Try window.Clerk session directly (works anywhere in the browser)
    if (typeof window !== 'undefined' && window.Clerk?.session) {
        try {
            const token = await window.Clerk.session.getToken(forceRefresh ? { skipCache: true } : undefined);
            if (token) {
                window.jwt = token;
                return token;
            }
        } catch (err) {
            console.warn('[AuthTokenManager] window.Clerk.session.getToken failed:', err);
        }
    }

    // 2. Try registered token provider from React useAuth hook
    if (tokenProviderFn) {
        try {
            const token = await tokenProviderFn(forceRefresh ? { skipCache: true } : undefined);
            if (token) {
                window.jwt = token;
                return token;
            }
        } catch (err) {
            console.warn('[AuthTokenManager] Registered tokenProvider failed:', err);
        }
    }

    // 3. Fallback to existing window.jwt if set
    if (typeof window !== 'undefined' && window.jwt) {
        return window.jwt;
    }

    return null;
}

/**
 * Synchronous fallback getter for backward compatibility.
 * @returns {string|null}
 */
export function getActiveToken() {
    if (typeof window !== 'undefined' && window.jwt) {
        return window.jwt;
    }
    return null;
}

/**
 * Formats a Bearer Authorization header cleanly.
 * Prevents double "Bearer ", double spaces, or empty/undefined tokens.
 * @param {string|null} token
 * @returns {string|null}
 */
export function formatAuthHeader(token) {
    if (!token || typeof token !== 'string') return null;
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean === 'undefined' || clean === 'null') return null;
    return `Bearer ${clean}`;
}

export default {
    registerTokenProvider,
    getValidAuthToken,
    getActiveToken,
    formatAuthHeader,
};
