import { useEffect, useState } from 'react';

/** Returns `value`, but only after it has stopped changing for `delay` ms (e.g. a dragged slider). */
export function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // a newer value arrived: cancel the old timer
  }, [value, delay]);

  return debounced;
}

/**
 * Runs `load()` whenever `deps` change and tracks the request as
 * { status: 'loading' | 'ready' | 'error', data }.
 * If the inputs change while a request is in flight, the old response is
 * ignored, so a slow early request can never overwrite newer results.
 */
export function useLoader(load, deps) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let ignore = false;
    setState((prev) => ({ status: 'loading', data: prev.data }));

    load()
      .then((data) => {
        if (!ignore) setState({ status: 'ready', data });
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) setState({ status: 'error', data: null });
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
