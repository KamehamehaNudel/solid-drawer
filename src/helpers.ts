import {TransitionState} from "./create-transition-state";
import {TRANSITIONS} from "./constants";

interface Style {
   [key: string]: string;
}

const cache = new WeakMap();

export function isInView(el: HTMLElement): boolean {
   const rect = el.getBoundingClientRect();

   if (!window.visualViewport) return false;

   return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      // Need + 40 for safari detection
      rect.bottom <= window.visualViewport.height - 40 &&
      rect.right <= window.visualViewport.width
   );
}

export function set(el?: Element | HTMLElement | null, styles?: Style, ignoreCache = false) {
   if (!el || !(el instanceof HTMLElement) || !styles) return;
   let originalStyles: Style = {};

   Object.entries(styles).forEach(([key, value]: [string, string]) => {
      if (key.startsWith('--')) {
         el.style.setProperty(key, value);
         return;
      }

      originalStyles[key] = (el.style as any)[key];
      (el.style as any)[key] = value;
   });

   if (ignoreCache) return;

   cache.set(el, originalStyles);
}

export function reset(el: Element | HTMLElement | null, prop?: string) {
   if (!el || !(el instanceof HTMLElement)) return;
   let originalStyles = cache.get(el);


   if (prop) {
      if (originalStyles && originalStyles[prop]) {
         (el.style as any)[prop] = originalStyles[prop];
      } else {
         (el.style as any)[prop] = '';
      }
   } else if (originalStyles) {
      Object.entries(originalStyles).forEach(([key, value]) => {
         (el.style as any)[key] = value;
      });
   }
}

export function getTranslateY(element: HTMLElement): number | null {
   const style = window.getComputedStyle(element);
   const transform =
      // @ts-ignore
      style.transform || style.webkitTransform || style.mozTransform;
   let mat = transform.match(/^matrix3d\((.+)\)$/);
   if (mat) return parseFloat(mat[1].split(', ')[13]);
   mat = transform.match(/^matrix\((.+)\)$/);
   return mat ? parseFloat(mat[1].split(', ')[5]) : null;
}

export function getProgressBetweenPoints(offsets: number[], current: number, fromIndex: number, tillIndex: number): number {

   if (offsets.length < fromIndex || offsets.length < tillIndex) {
      return 0;
   }

   const fromOffset = offsets[fromIndex] || 100;
   const tillOffset = offsets[tillIndex] || 0;

   if (current <= tillOffset) {
      return 1;
   }

   if (current >= fromOffset) {
      return 0;
   }

   return (fromOffset - current) / (fromOffset - tillOffset);
}

export function buildTransitionString(property: string, state: TransitionState, disable: boolean) {
   if (disable) {
      return 'none';
   }

   if (state === 'exit-start' || state === 'exiting') {
      return `${property} ${TRANSITIONS.EXIT.DURATION}s cubic-bezier(${TRANSITIONS.EXIT.EASE.join(',')})`;
   }
   if (state === 'enter-start' || state === 'entering') {
      return `${property} ${TRANSITIONS.ENTRY.DURATION}s cubic-bezier(${TRANSITIONS.ENTRY.EASE.join(',')})`;
   }

   return `${property} ${TRANSITIONS.SNAP.DURATION}s cubic-bezier(${TRANSITIONS.SNAP.EASE.join(',')})`;
}

export function dampenValue(v: number) {
   return 8 * (Math.log(v + 1) - 2);
}

// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
   'checkbox',
   'radio',
   'range',
   'color',
   'file',
   'image',
   'button',
   'submit',
   'reset',
]);

export function isInput(target: Element) {
   return (
      (target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type)) ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
   );
}
