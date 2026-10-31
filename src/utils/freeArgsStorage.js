// ─── LOCAL STORAGE HELPERS FOR FREE ARGUMENT SESSIONS ───
const FREE_ARGS_KEY = 'refirm_free_args_sessions';

export const loadFreeArgSessions = () => {
  try {
    const raw = localStorage.getItem(FREE_ARGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
};

export const saveFreeArgSessions = (sessions) => {
  try {
    localStorage.setItem(FREE_ARGS_KEY, JSON.stringify(sessions));
  } catch { /* ignore */ }
};

export const deleteFreeArgSession = (sessionId) => {
  try {
    const existing = loadFreeArgSessions();
    const filtered = existing.filter((s) => s.sessionId !== sessionId);
    saveFreeArgSessions(filtered);
    localStorage.removeItem(`refirm_freearg_msgs_${sessionId}`);
  } catch { /* ignore */ }
};
