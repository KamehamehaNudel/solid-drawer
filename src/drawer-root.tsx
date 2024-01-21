import {
   set,
   reset,
   getTranslateY,
   dampenValue,
   isInput,
   getProgressBetweenPoints,
   debug,
   buildTransitionString
} from './helpers';
import {mergeDefaultProps, isIOS, MaybeAccessor} from "@kobalte/utils";
import {
   JSX,
   createSignal,
   createEffect,
   mergeProps,
   splitProps, batch, ParentProps, onCleanup
} from "solid-js";

import {createDisclosureState} from "@kobalte/core";
import {Dialog} from '@kobalte/core';
import {createSnapPoints} from './create-snap-points';
import {DrawerContext, DrawerContextValue, DrawerPublicContext, useDrawerContext} from './drawer-context';
import {createTransitionState} from "./create-transition-state";
import "./style.css";
import {
   WINDOW_TOP_OFFSET,
   CLOSE_THRESHOLD,
   SCROLL_LOCK_TIMEOUT,
   BORDER_RADIUS,
   NESTED_DISPLACEMENT,
   TRANSITIONS,
   VELOCITY_THRESHOLD, SCROLLABLE_CSS
} from "./constants";
import {DialogRootOptions} from "@kobalte/core/dist/types/dialog";
import createPreventScroll from 'solid-prevent-scroll';

export interface DrawerRootOptions extends Omit<DialogRootOptions, 'forceMount'>{
   activeSnapPoint?: number;
   setActiveSnapPoint?: (snapPoint: number) => void;
   children?: any;
   open?: boolean;
   defaultOpen?: boolean;
   closeThreshold?: number;
   onOpenChange?: (open: boolean) => void;
   shouldScaleBackground?: boolean;
   scrollLockTimeout?: number;
   fixed?: boolean;
   dismissible?: boolean;
   onDrag?: (event: TouchEvent | PointerEvent, percentageDragged: number) => void;
   onRelease?: (event: TouchEvent | PointerEvent, open: boolean) => void;
   modal?: boolean;
   nested?: boolean;
   nestedLevel?: number;
   snapPoints?: (number | string)[];
   defaultSnapPoint?: number,
   fadeRange?: [number, number];
}

export interface DrawerRootInterface extends ParentProps<DrawerRootOptions> {}

export function DrawerRoot(props: DrawerRootInterface) {

   props = mergeDefaultProps(
      {
         nested: false,
         nestedLevel: 0,
         modal: true,
         closeThreshold: CLOSE_THRESHOLD as number,
         scrollLockTimeout: SCROLL_LOCK_TIMEOUT,
         dismissible: true,
         defaultSnapPoint: 1,
         shouldScaleBackground: false,
      },
      props,
   );

   // Check if we are nested inside another drawer
   try {
      const {
         onNestedDrag: onNestedDragContext,
         onNestedRelease: onNestedReleaseContext,
         nestedLevel
      } = useDrawerContext();

      const [innerLocal, innerOthers] = splitProps(props, ['onDrag']);

      props = mergeProps(innerOthers, {
         nested: true,
         onDrag: (e: PointerEvent | TouchEvent, p: number) => {
            onNestedDragContext(e, p);
            innerLocal?.onDrag?.(e, p);
         },
         onRelease: onNestedReleaseContext,
         nestedLevel: nestedLevel + 1
      })

   } catch (e) {
      //error just means we are not nested so can be ignored
   }

   const [local, others] = splitProps(props, [
      'activeSnapPoint',
      'setActiveSnapPoint',
      'children',
      'open',
      'defaultOpen',
      'onOpenChange',
      'shouldScaleBackground',
      'scrollLockTimeout',
      'fixed',
      'dismissible',
      'onDrag',
      'onRelease',
      'modal',
      'nested',
      'snapPoints',
      'defaultSnapPoint',
      'fadeRange',
      'nestedLevel',
      'preventScroll',
      'closeThreshold',
   ])

   const [draggedDistance, setDraggedDistance] = createSignal<number>(0);

   const [visible, setVisible] = createSignal<boolean>(false);
   const [isDragging, setIsDragging] = createSignal<boolean>(false);
   const [isAllowedToDrag, setIsAllowedToDrag] = createSignal<boolean>(false);
   const [drawerSize, setDrawerSize] = createSignal<number>(0);

   //not sure if needed anymore
   const [hasBeenOpened, setHasBeenOpened] = createSignal<boolean>(false);
   const [justReleased, setJustReleased] = createSignal<boolean>(false);

   const [drawerRef, setDrawerRef] = createSignal<HTMLElement| null>(null);
   const [overlayRef, setOverlayRef] = createSignal<HTMLElement|null>(null);

   const [keyboardIsOpen, setKeyboardIsOpen] = createSignal<boolean>(false);

   const [nestedOpen, setNestedOpen] = createSignal(false);
   const [nestedDragging, setNestedDragging] = createSignal(false);
   const [nestedProgress, setNestedProgress] = createSignal(0);

   const {
      activeSnapPoint,
      setActiveSnapPoint,
      onRelease: onReleaseSnapPoints,
      snapPointsOffset,
      snapPoints,
      onDrag: onDragSnapPoints,
      fadeRange,
   } = createSnapPoints({
      snapPoints: local.snapPoints,
      fadeRange: local.fadeRange,
      get activeSnapPointProp() {
         return local.activeSnapPoint
      },
      setActiveSnapPointProp: local.setActiveSnapPoint,
      setDraggedDistance,
      onSnapPointChange: function (activeSnapPointIndex: number) {
         if (local.snapPoints && activeSnapPointIndex === snapPointsOffset().length - 1) {
            openTime = new Date()
         }
      },
      drawerRef: () => drawerRef(),
   });

   let openTime: Date;
   let dragStartTime: Date;
   let lastTimeDragPrevented: Date;
   let dragEndTime: Date;
   let pointerStartY: number;

   const disclosureState = createDisclosureState({
      open: () => local.open,
      defaultOpen: () => local.defaultOpen,
      onOpenChange: isOpen => local.onOpenChange?.(isOpen),
   });

   function getScale() {
      return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
   }

   function shouldDrag(el: EventTarget, isDraggingDown: boolean) {

      const ref = drawerRef();

      let element = el as HTMLElement;
      const date = new Date();
      const highlightedText = window.getSelection()?.toString();
      const swipeAmount = ref ? getTranslateY(ref) : null;

      // Allow scrolling when animating
      if (openTime && date.getTime() - openTime.getTime() < 500) {
         return false;
      }

      // Don't drag if there's highlighted text
      if (highlightedText && highlightedText.length > 0) {
         return false;
      }

      // Disallow dragging if drawer was scrolled within `scrollLockTimeout`
      if (
         lastTimeDragPrevented
         && (date.getTime() - lastTimeDragPrevented.getTime()) < local.scrollLockTimeout!
         && swipeAmount === 0
      ) {
         lastTimeDragPrevented = new Date();
         return false;
      }

      // Keep climbing up the DOM tree as long as there's a parent
      while (element) {
         markScrollable(element);
         // Check if the element is scrollable
         if (element.scrollHeight > element.clientHeight) {
            if (element.scrollTop !== 0) {
               lastTimeDragPrevented = new Date();

               // The element is scrollable and not scrolled to the top, so don't drag
               return false;
            }

            if (element.getAttribute('role') === 'dialog') {
               return true;
            } else if (isDraggingDown) {
               lastTimeDragPrevented = new Date();
               // We are dragging down so we should allow scrolling
               return false;
            }
         }

         // Move up to the parent element
         element = element.parentNode as HTMLElement;
      }

      if (isDraggingDown) {
         lastTimeDragPrevented = new Date();

         // We are dragging down so we should allow scrolling
         return false;
      }

      // No scrollable parents not scrolled to the top found, so drag
      return true;
   }

   /* */
   function markScrollable(el: HTMLElement) {
      if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
         el.classList.add(SCROLLABLE_CSS);
      } else if (el.classList.contains(SCROLLABLE_CSS)) {
         el.classList.remove(SCROLLABLE_CSS)
      }
   }

   function onNestedOpenChange(o: boolean) {
      setNestedOpen(o);
   }

   function onNestedDrag(event: PointerEvent | TouchEvent, percentageDragged: number) {
      if (percentageDragged < 0) return;
      setNestedDragging(true);
      setNestedProgress(percentageDragged);
   }

   function onNestedRelease(event: PointerEvent | TouchEvent, o: boolean) {
      setNestedDragging(false);
   }

   createEffect(() => {
      const ref = drawerRef();
      if (ref) {
         setDrawerSize(ref.getBoundingClientRect().height)
      }
   })

   /* Side effects of toggling "open" state of the drawer */
   /* probably not best-practice to sync state like this, but it is what it is*/
   createEffect((prev) => {
      const open = disclosureState.isOpen();

      if (open) {
         setHasBeenOpened(true);
         openTime = new Date();

         window.requestAnimationFrame(() => {
            setActiveSnapPoint(local.defaultSnapPoint!);
         })
      } else if (prev !== open) {
         setActiveSnapPoint(0);
      }

      if (local.nested) {
         let outerDrawerContext = useDrawerContext();
         outerDrawerContext.onNestedOpenChange(open);
      }

      return open;
   }, disclosureState.isOpen()) //wire in initial state

   const hasSnapPoints = () => local.snapPoints && local.snapPoints.length > 0;

   /* background scaling effect */
   /* This feels super cursed. Currently lack of better idea but it works ¯\_(ツ)_/¯ */
   createEffect((prevPath) => {
      const wrapper = document.querySelector('[vaul-drawer-wrapper]');

      if (!wrapper || !local.shouldScaleBackground) return;

      const st = openState();

      let percentageDragged = 0;

      /* always apply background effect between the last two snap points (for now). Everything else looked weird */
      const fromIndex = snapPoints().length -2;
      const tillIndex = snapPoints().length -1;

      /* Approach: We debounce the execution by returning the previously execution path taken and checkin against it (except for when we are dragging) */

      if (isAllowedToDrag()) {
         /* when dragging apply based on progress between "from" and "till" range */

         if (hasSnapPoints()) {
            percentageDragged = 1 - getProgressBetweenPoints(snapPointsOffset(), draggedDistance(), fromIndex, tillIndex)

         } else {
            percentageDragged = draggedDistance() / drawerSize();
         }

         const scaleValue = Math.min(getScale() + percentageDragged * (1 - getScale()), 1);
         const borderRadiusValue = 8 - percentageDragged * 8;
         const translateYValue = Math.max(0, NESTED_DISPLACEMENT - percentageDragged * NESTED_DISPLACEMENT);

         set(
            wrapper,
            {
               borderRadius: `${borderRadiusValue}px`,
               transform: `scale(${scaleValue}) translate3d(0, ${translateYValue}px, 0)`,
               transition: 'none',
            },
            true,
         );

         return 'dragging';
      } else if (st === 'enter-start' && prevPath !== 'start') {
         /* apply initial styles so transitions work */
         set(document.body,
            {
               background: 'black',
            }
         );

         set(wrapper, {
            borderRadius: '0px',
            transform: 'scale(1) translate3d(0,0,0)',
         })

         return 'start';

      } else if ((hasSnapPoints() && activeSnapPoint() >= tillIndex) && prevPath !== 'setting') {

         set(wrapper, {
            borderRadius: `${BORDER_RADIUS}px`,
            overflow: 'hidden',
            transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
            transformOrigin: 'top',
            transitionProperty: 'transform, border-radius',
            transitionDuration: `${TRANSITIONS.SNAP.DURATION}s`,
            transitionTimingFunction: `cubic-bezier(${TRANSITIONS.SNAP.EASE.join(',')})`,
         }, prevPath !== undefined);

         return 'setting';

      } else if ((hasSnapPoints() && activeSnapPoint() <= fromIndex) && prevPath !== 'unsetting') {

         reset(wrapper, 'overflow');
         reset(wrapper, 'transform');
         reset(wrapper, 'borderRadius');
         set(wrapper, {
            transitionProperty: 'transform, border-radius',
            transitionDuration: `${TRANSITIONS.EXIT.DURATION}s`,
            transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EXIT.EASE.join(',')})`,
         }, true);

         return 'unsetting';

      } else if (st === 'exited' && prevPath !== 'resetting') {
         reset(document.body);
         return 'resetting';
      } else {
         return prevPath;
      }
   }, undefined)

   onCleanup(() => {
      if (!local.shouldScaleBackground) {
         return false;
      }
      const wrapper = document.querySelector('[vaul-drawer-wrapper]');
      reset(document.body);
      if (wrapper) {
         reset(wrapper, 'overflow');
         reset(wrapper, 'transform');
         reset(wrapper, 'borderRadius');
      }
   })

   const openState = createTransitionState({
      active: () => disclosureState.isOpen(),
      delay: TRANSITIONS.ENTRY.DURATION * 1000,
      exitDelay: TRANSITIONS.EXIT.DURATION * 1000,
   });

   const nestedState = createTransitionState({
      active: () => nestedOpen(),
      delay: TRANSITIONS.ENTRY.DURATION * 1000,
      exitDelay: TRANSITIONS.EXIT.DURATION * 1000,
   })

   function onPress(event: PointerEvent | TouchEvent) {

      const ref = drawerRef();

      if (!local.dismissible && !local.snapPoints) return;
      if (ref && !ref.contains(event.target as Node)) return;

      setIsDragging(true);
      dragStartTime = new Date();

      // iOS doesn't trigger mouseUp after scrolling so we need to listen to touched in order to disallow dragging
      if (isIOS()) {
         window.addEventListener('touchend', () => (setIsAllowedToDrag(false)), {once: true});
      }

      // Ensure we maintain correct pointer capture even when going outside of the drawer
      if ("pointerId" in event) {
         (event.target as HTMLElement).setPointerCapture(event.pointerId);
      }

      if ("clientY" in event) {
         pointerStartY = event.clientY;
      }
   }

   function onDrag(event: PointerEvent | TouchEvent) {
      // We need to know how much of the drawer has been dragged in percentages so that we can transform background accordingly
      if (isDragging()) {

         const drawerHeight = drawerRef()?.getBoundingClientRect().height || 0;
         let dragDistance;

         if ("clientY" in event) {
            dragDistance = pointerStartY - event.clientY;
         } else if ("touches" in event) {
            dragDistance = pointerStartY - (event.touches?.[0]?.clientY || 0);
         } else {
            dragDistance = pointerStartY;
         }

         const isDraggingDown = dragDistance > 0;

         // Disallow dragging down to close when first snap point is the active one and dismissible prop is set to false.
         if (local.snapPoints && activeSnapPoint() === 1 && !local.dismissible) return;

         if (!isAllowedToDrag() && !shouldDrag(event.target!, isDraggingDown)) return;

         // If shouldDrag gave true once after pressing down on the drawer, we set isAllowedToDrag to true and it will remain true until we let go, there's no reason to disable dragging mid way, ever, and that's the solution to it
         setIsAllowedToDrag(true);

         if (local.snapPoints) {
            onDragSnapPoints({draggedDistance: dragDistance});
         }

         // Run this only if snapPoints are not defined or if we are at the last snap point (highest one)
         if (dragDistance > 0 && (!local.snapPoints)) {

            const dampenedDraggedDistance = dampenValue(dragDistance);
            setDraggedDistance(Math.min(dampenedDraggedDistance * -1, 0));

            return;
         }

         // We need to capture last time when drag with scroll was triggered and have a timeout between
         const absDraggedDistance = Math.abs(dragDistance);

         let percentageDragged = absDraggedDistance / drawerHeight;

         local?.onDrag?.(event, percentageDragged);

         if (!local.snapPoints) {
            setDraggedDistance(absDraggedDistance);
         }
      }
   }

   function onRelease(event: PointerEvent | TouchEvent) {
      const ref = drawerRef();

      if (!isDragging || !ref) return;

      const {snapPoints, closeThreshold} = local;

      if (isAllowedToDrag() && isInput(event.target as HTMLElement)) {
         // If we were just dragging, prevent focusing on inputs etc. on release
         (event.target as HTMLInputElement).blur();
      }

      batch(() => {
         setIsAllowedToDrag(false);
         setIsDragging(false);
      })

      dragEndTime = new Date();

      const swipeAmount = getTranslateY(ref);

      if (!shouldDrag(event.target as HTMLElement, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;

      if (dragStartTime === null || dragStartTime === undefined) return;

      let y;

      if ("clientY" in event) {
         y = event.clientY;
      } else if ("touches" in event) {
         y =  (event.touches?.[0]?.clientY || 0);
      } else {
         y = 0;
      }

      const timeTaken = dragEndTime.getTime() - dragStartTime.getTime();
      const distMoved = pointerStartY - y;
      const velocity = Math.abs(distMoved) / timeTaken;

      if (velocity > 0.05) {
         // `justReleased` is needed to prevent the drawer from focusing on an input when the drag ends, as it's not the intent most of the time.
         setJustReleased(true);

         setTimeout(() => {
            setJustReleased(false);
         }, 200);
      }

      if (snapPoints) {
         local.onRelease?.(event, true);
         onReleaseSnapPoints({
            draggedDistance: distMoved,
            closeDrawer: function () {
               disclosureState.close();
            },
            velocity,
         });
         return;
      }

      setDraggedDistance(0);

      // Moved upwards, don't do anything
      if (distMoved > 0) {
         local.onRelease?.(event, true);
         return;
      }

      if (velocity > VELOCITY_THRESHOLD) {
         disclosureState.close();
         local.onRelease?.(event, false);
         return;
      }

      const visibleDrawerHeight = Math.min(ref.getBoundingClientRect().height || 0, window.innerHeight);

      if (swipeAmount >= visibleDrawerHeight * closeThreshold!) {
         local.onRelease?.(event, false);
         return;
      }

      local.onRelease?.(event, true);
   }

   const context: DrawerContextValue = {
      visible,
      setVisible,
      state: openState,
      close: () => disclosureState.close(),
      isOpen: disclosureState.isOpen,
      activeSnapPoint: () => activeSnapPoint(),
      snapPoints: () => snapPoints(),
      fadeRange: () => fadeRange(),
      setActiveSnapPoint,
      drawerRef,
      setDrawerRef,
      overlayRef,
      setOverlayRef,
      onPress,
      onRelease,
      onDrag,
      isDragging: isAllowedToDrag,
      draggedDistance,
      dismissible: () => local.dismissible ?? true,
      onNestedDrag,
      onNestedOpenChange,
      onNestedRelease,
      modal: () => local.modal ?? false,
      snapPointsOffset,
      drawerSize,
      nestedOpen,
      nestedDragging,
      nestedProgress,
      nestedLevel: local.nestedLevel || 0,
      nestedState,
   }

   /**
    * We use our own preventScroll because kobalte's is bugged on ios
    */
   createPreventScroll({
      element: () => drawerRef(),
      enabled: () => local.preventScroll !== false && openState() !== 'exited',
   })

   return (
      <Dialog.Root
         modal={local.modal}
         onOpenChange={(o) => {
            if (local.open !== undefined) {
               local.onOpenChange?.(o);
               return;
            }
            if (o) {
               disclosureState.open();
            } else {
               disclosureState.close();
            }
         }}
         open={disclosureState.isOpen()}
         preventScroll={false}
         forceMount={openState() !== "exited"}
         {...others}
      >
         <DrawerContext.Provider value={context}>
            <DrawerPublicContext.Provider value={
               {
                  state: openState,
                  close: () => disclosureState.close(),
                  open: () => disclosureState.open(),
                  isOpen: () => disclosureState.isOpen(),
                  activeSnapPoint: activeSnapPoint,
                  snapPointsOffset: snapPointsOffset,
                  isDragging: isAllowedToDrag,
                  drawerRef: drawerRef,
                  overlayRef: overlayRef,
                  draggedDistance,
                  drawerSize,
                  transition: (property) => buildTransitionString(property, openState(),isAllowedToDrag()),
               }
            }>
               {local.children}
            </DrawerPublicContext.Provider>
         </DrawerContext.Provider>
      </Dialog.Root>
   );
}
