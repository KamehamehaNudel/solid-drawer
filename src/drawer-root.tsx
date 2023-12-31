import {set, reset, getTranslateY, dampenValue, isInput, getProgressBetweenPoints, debug} from './helpers';
import {mergeDefaultProps, isIOS} from "@kobalte/utils";
import {
   JSX,
   createSignal,
   createEffect,
   mergeProps,
   splitProps, batch, Accessor, ParentProps, onCleanup,
} from "solid-js";

import {createDisclosureState} from "@kobalte/core";
import {Dialog} from '@kobalte/core';
import {createSnapPoints} from './create-snap-points';
import {DrawerContext, DrawerContextValue, useDrawerContext} from './drawer-context';
import {createTransition} from "./create-transition-state";
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
import {createPositionFixed} from "./experiments/create-position-fixed";
import {createPreventScroll} from "./experiments/create-prevent-scroll";

export interface DrawerRootOptions extends Omit<DialogRootOptions, 'forceMount'>{
   activeSnapPoint?: number | null;
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
}

interface DrawerRootInterface extends ParentProps<DrawerRootOptions> {}


interface WithFadeFromOptions extends DrawerRootInterface {
   snapPoints: (number | string)[];
   defaultSnapPoint?: number,
   fadeRange?: number[];
   scaleRange?: number[];
}

interface WithoutFadeFromOptions extends DrawerRootInterface {
   snapPoints?: never;
   defaultSnapPoint?: number,
   fadeRange?: never;
   scaleRange?: never;
}

export type DrawerRootProps = WithFadeFromOptions | WithoutFadeFromOptions;

export function DrawerRoot(props: DrawerRootProps) {

   props = mergeDefaultProps(
      {
         nested: false,
         nestedLevel: 0,
         modal: true,
         closeThreshold: CLOSE_THRESHOLD,
         scrollLockTimeout: SCROLL_LOCK_TIMEOUT,
         dismissible: true,
         fadeRange: props.snapPoints ? [-1, props.snapPoints.length - 1] : undefined,
         scaleRange: props.snapPoints ? [-1, props.snapPoints.length - 1] : undefined,
         defaultSnapPoint: props.snapPoints ? 0 : undefined,
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
      'scaleRange',
      'nestedLevel',
   ])

   const [draggedDistance, setDraggedDistance] = createSignal<number>(0);

   const [visible, setVisible] = createSignal<boolean>(false);
   const [isDragging, setIsDragging] = createSignal<boolean>(false);
   const [isAllowedToDrag, setIsAllowedToDrag] = createSignal<boolean>(false);
   const [drawerSize, setDrawerSize] = createSignal<number>(0);

   //not sure
   const [hasBeenOpened, setHasBeenOpened] = createSignal<boolean>(false);
   const [justReleased, setJustReleased] = createSignal<boolean>(false);

   const [drawerRef, setDrawerRef] = createSignal<HTMLElement>();
   const [overlayRef, setOverlayRef] = createSignal<HTMLElement>();

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
   } = createSnapPoints({
      snapPoints: local.snapPoints,
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

   /* */

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

   /*
      createEffect(() => {
         function onVisualViewportChange() {
            if (!drawerRef()) return;

            const focusedElement = document.activeElement as HTMLElement;

            const {snapPoints, fixed} = local;

            if (isInput(focusedElement) || keyboardIsOpen()) {
               const visualViewportHeight = window.visualViewport?.height || 0;
               // This is the height of the keyboard
               let diffFromInitial = window.innerHeight - visualViewportHeight;
               const drawerHeight = drawerRef().getBoundingClientRect().height || 0;
               if (!initialDrawerHeight) {
                  initialDrawerHeight = drawerHeight;
               }
               const offsetFromTop = drawerRef().getBoundingClientRect().top;

               // visualViewport height may change due to some subtle changes to the keyboard. Checking if the height changed by 60 or more will make sure that they keyboard really changed its open state.
               if (Math.abs(previousDiffFromInitial - diffFromInitial) > 60) {
                  setKeyboardIsOpen(false);
               }

               if (snapPoints && snapPoints.length > 0 && snapPointsOffset() && activeSnapPointIndex() !== null) {
                  const activeSnapPointHeight = snapPointsOffset()[activeSnapPointIndex()] || 0;
                  diffFromInitial += activeSnapPointHeight;
               }

               previousDiffFromInitial = diffFromInitial;
               // We don't have to change the height if the input is in view, when we are here we are in the opened keyboard state so we can correctly check if the input is in view
               if (drawerHeight > visualViewportHeight || keyboardIsOpen()) {
                  const height = drawerRef().getBoundingClientRect().height;
                  let newDrawerHeight = height;

                  if (height > visualViewportHeight) {
                     newDrawerHeight = visualViewportHeight - WINDOW_TOP_OFFSET;
                  }
                  // When fixed, don't move the drawer upwards if there's space, but rather only change it's height so it's fully scrollable when the keyboard is open
                  if (fixed) {
                     drawerRef().style.height = `${height - Math.max(diffFromInitial, 0)}px`;
                  } else {
                     drawerRef().style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`;
                  }
               } else {
                  drawerRef().style.height = `${initialDrawerHeight}px`;
               }

               if (snapPoints && snapPoints.length > 0 && !keyboardIsOpen()) {
                  drawerRef().style.bottom = `0px`;
               } else {
                  // Negative bottom value would never make sense
                  drawerRef().style.bottom = `${Math.max(diffFromInitial, 0)}px`;
               }
            }
         }

         window.visualViewport?.addEventListener('resize', onVisualViewportChange);

         onCleanup(() => {
            window.visualViewport?.removeEventListener('resize', onVisualViewportChange)
         })
      });*/

   function shouldDrag(el: EventTarget, isDraggingDown: boolean) {
      let element = el as HTMLElement;
      const date = new Date();
      const highlightedText = window.getSelection()?.toString();
      const swipeAmount = drawerRef() ? getTranslateY(drawerRef()) : null;

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
         lastTimeDragPrevented &&
         date.getTime() - lastTimeDragPrevented.getTime() < local.scrollLockTimeout &&
         swipeAmount === 0
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
      if (drawerRef()) {
         setDrawerSize(drawerRef().getBoundingClientRect().height)
      }
   })

   /* Side effects of toggling "open" state of the drawer */
   createEffect((prev) => {
      const open = disclosureState.isOpen();

      if (open) {
         setHasBeenOpened(true);
         openTime = new Date();

         window.setTimeout(() => {
            setActiveSnapPoint(local.defaultSnapPoint);
         }, 0)

      } else if (prev !== open) {
         setActiveSnapPoint(0);
      }

      if (local.nested) {
         let outerDrawerContext = useDrawerContext();
         outerDrawerContext.onNestedOpenChange(open);
      }

      return open;

   }, disclosureState.isOpen()) //wire in initial state

   /* background scaling effect */

   const hasSnapPoints = () => local.snapPoints && local.snapPoints.length > 0;

   createEffect((prevPath) => {
      const wrapper = document.querySelector('[vaul-drawer-wrapper]');

      if (!wrapper || !local.shouldScaleBackground) return;

      const st = openState();

      let percentageDragged = 0;

      if (isDragging()) {

         if (hasSnapPoints()) {
            percentageDragged = 1 - getProgressBetweenPoints(snapPointsOffset(), draggedDistance(), 0, 1, drawerSize())

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

      } else if (((hasSnapPoints() && activeSnapPoint() >= 1) || (st === 'entering' || st === 'entered')) && prevPath !== 'setting') {

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

      } else if (((hasSnapPoints() && activeSnapPoint() <= 0) || st === 'exiting') && prevPath !== 'unsetting') {

         reset(wrapper, 'overflow');
         reset(wrapper, 'transform');
         reset(wrapper, 'borderRadius');
         set(wrapper, {
            transitionProperty: 'transform, border-radius',
            transitionDuration: `${TRANSITIONS.EXIT.DURATION}s`,
            transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EXIT.EASE.join(',')})`,
         });

         return 'unsetting';

      } else if (st === 'exited' && prevPath !== 'resetting') {
         reset(document.body);
         return 'resetting';
      } else {
         return prevPath;
      }
   }, undefined)

   const openState = createTransition({
      active: () => disclosureState.isOpen(),
      delay: TRANSITIONS.ENTRY.DURATION * 1000,
      exitDelay: TRANSITIONS.EXIT.DURATION * 1000,
   });


   createPreventScroll({
      ownerRef: () => drawerRef(),
      isDisabled: () => !disclosureState.isOpen(),
   })

   const nestedState = createTransition({
      active: () => nestedOpen(),
      delay: TRANSITIONS.ENTRY.DURATION * 1000,
      exitDelay: TRANSITIONS.EXIT.DURATION * 1000,
   })

   function onPress(event: JSX.EventHandlerUnion<any, PointerEvent | TouchEvent>) {
      if (!local.dismissible && !local.snapPoints) return;
      if (drawerRef() && !drawerRef().contains(event.target as Node)) return;

      setIsDragging(true);
      dragStartTime = new Date();

      // iOS doesn't trigger mouseUp after scrolling so we need to listen to touched in order to disallow dragging
      if (isIOS()) {
         window.addEventListener('touchend', () => (setIsAllowedToDrag(false)), {once: true});
      }
      pointerStartY = event.clientY;
   }

   function onDrag(event: PointerEvent | TouchEvent) {
      // We need to know how much of the drawer has been dragged in percentages so that we can transform background accordingly
      if (isDragging()) {

         const drawerHeight = drawerRef()?.getBoundingClientRect().height || 0;
         const dragDistance = pointerStartY - (event.clientY || event.touches?.[0]?.clientY);
         const isDraggingDown = dragDistance > 0;

         // Disallow dragging down to close when first snap point is the active one and dismissible prop is set to false.
         if (local.snapPoints && activeSnapPoint() === 1 && !local.dismissible) return;

         if (!isAllowedToDrag() && !shouldDrag(event.target, isDraggingDown)) return;

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
      if (!isDragging || !drawerRef()) return;

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

      const swipeAmount = getTranslateY(drawerRef());

      if (!shouldDrag(event.target, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;

      if (dragStartTime === null || dragStartTime === undefined) return;

      const y = event.clientY || event.changedTouches?.[0]?.clientY;

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

      const visibleDrawerHeight = Math.min(drawerRef().getBoundingClientRect().height || 0, window.innerHeight);

      if (swipeAmount >= visibleDrawerHeight * closeThreshold) {
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
      snapPoints: () => local.snapPoints,
      fadeRange: () => local.fadeRange,
      setActiveSnapPoint,
      drawerRef,
      setDrawerRef,
      overlayRef,
      setOverlayRef,
      onOpenChange: local.onOpenChange,
      onPress,
      onRelease,
      onDrag,
      isDragging: isAllowedToDrag,
      draggedDistance,
      dismissible: () => local.dismissible || false,
      onNestedDrag,
      onNestedOpenChange,
      onNestedRelease,
      keyboardIsOpen,
      setKeyboardIsOpen,
      modal: () => local.modal || false,
      snapPointsOffset,
      drawerSize,
      nestedOpen,
      nestedDragging,
      nestedProgress,
      nestedLevel: local.nestedLevel || 0,
      nestedState,
   }

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
            {local.children}
         </DrawerContext.Provider>
      </Dialog.Root>
   );
}
