import {Accessor, createEffect, createRenderEffect, createSignal, createUniqueId, onCleanup} from 'solid-js';
import { isServer } from 'solid-js/web';

interface Props {
   active: Accessor<boolean>;
   delay?: number;
   exitDelay?: number;
   onExited?: () => void;
}

export type TransitionState =
   | 'enter-start'
   | 'entering'
   | 'entered'
   | 'exit-start'
   | 'exiting'
   | 'exited';

export const createTransition = (props: Props): Accessor<TransitionState> => {
   const [state, setState] = createSignal<TransitionState>(props.active() ? 'entered' : 'exited');

   // Transitions are always static on the server.
   if (isServer) {
      return () => (props.active() ? 'entered' : 'exited');
   }

   createRenderEffect(() => {
      const { active } = props;

      if (active()) {
         if (state() === 'exited' || state() === 'exiting') {
            setState('enter-start');
         }
      } else {
         if (state() === 'entering' || state() === 'entered') {
            setState('exit-start');
         }
      }
   });

   createEffect(() => {
      const { delay = 100, exitDelay, onExited } = props;
      const st = state();
      if (st === 'entering' || st === 'exiting') {
         const timer = window.setTimeout(
            () => {
               if (st === 'exiting') {
                  setState('exited');
                  onExited && onExited();
               } else if (st === 'entering') {
                  setState('entered');
               }
            },
            st === 'entering' ? delay : exitDelay ?? delay
         );

         onCleanup(() => window.clearTimeout(timer));
      } else if (st === 'enter-start') {
         // This used to be RAF but doesn't produce the effect we want on Firefox.
         window.setTimeout(() => {
            setState('entering');
         }, 1);
      } else if (st === 'exit-start') {
         window.setTimeout(() => {
            setState('exiting');
         }, 1);
      }
   });

   return state;
};
