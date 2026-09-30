// Shared query-parsing helpers for list-style filters (?genre=Action,Thriller)
// and safe user-supplied text used inside a RegExp.

function parseListParam(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parses a query param as a finite number, or returns undefined if absent.
// Throws if present but not a valid number, so callers can turn that into a 400.
function parseNumberParam(value, name) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) {
    const err = new Error(`Invalid ${name}`);
    err.status = 400;
    throw err;
  }
  return n;
}

module.exports = { parseListParam, escapeRegex, parseNumberParam };
