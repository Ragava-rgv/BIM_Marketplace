import { useRef } from 'react';

/**
 * Scrolls to and focuses the first invalid field, given a fixed field order.
 * `fieldErrors` maps a field key to its error message (falsy = valid); `refs` maps
 * the same keys to the actual DOM node to scroll to. Fields without a registered
 * ref are skipped (defensive — every field a form validates should register one).
 */
export function scrollToFirstError(
  fieldOrder: string[],
  fieldErrors: Record<string, string | undefined | false>,
  refs: Record<string, HTMLElement | null>,
): boolean {
  for (const key of fieldOrder) {
    if (fieldErrors[key] && refs[key]) {
      refs[key]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[key]!.focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

/** Small ergonomic wrapper: a stable ref-map object plus a setter factory for `ref={setFieldRef('title')}`. */
export function useFieldRefs<T extends HTMLElement = HTMLElement>() {
  const refs = useRef<Record<string, T | null>>({});
  const setFieldRef = (key: string) => (el: T | null) => {
    refs.current[key] = el;
  };
  return { refs: refs.current, setFieldRef };
}
