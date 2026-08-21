// Shared check-outcome shape: pass with a named count, or fail with the
// first offending items listed so diagnostics stay concise and deterministic.

const MAX_LISTED_PROBLEMS = 5;

export function outcome(problems, okDetail) {
  if (problems.length === 0) {
    return { ok: true, detail: okDetail };
  }
  const shown = problems.slice(0, MAX_LISTED_PROBLEMS).join("; ");
  const suffix = problems.length > MAX_LISTED_PROBLEMS ? ` (+${problems.length - MAX_LISTED_PROBLEMS} more)` : "";
  return { ok: false, detail: `${shown}${suffix}` };
}
