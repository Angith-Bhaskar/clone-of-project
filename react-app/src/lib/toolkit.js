// The site already has a shared toolkit (js/api.js) that every page loads before
// the React bundle: API calls with the login token, formatters, the login guard.
// These wrappers let React components use it as normal imports instead of
// reaching for window.* everywhere, so there is exactly one copy of that logic.

export const apiGet = (path) => window.apiGet(path);
export const formatRupees = (amount) => window.formatRupees(amount);
export const formatDate = (value) => window.formatDate(value);
export const formatRating = (rating) => window.formatRating(rating);
export const getQueryParam = (name) => window.getQueryParam(name);
export const requireLogin = (nextPage) => window.requireLogin(nextPage);
export const apiPost = (path, body) => window.apiPost(path, body);
export const saveSession = (token, user) => window.saveSession(token, user);
