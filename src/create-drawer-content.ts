import {Accessor, createEffect, createMemo, JSX, onCleanup} from "solid-js";
import {useDrawerContext} from "./drawer-context";
import {NESTED_DISPLACEMENT} from "./constants";
import {buildTransitionString} from "./helpers";
import {PointerDownOutsideEvent} from "@kobalte/core";

export interface DrawerContentProps {
   onPointerDownOutside?: (e: PointerDownOutsideEvent) => void,
   style?: JSX.CSSProperties,
}

export function createDrawerContent(props: DrawerContentProps, ref: Accessor<HTMLElement | undefined>) {

   const drawerContext = useDrawerContext();

   createEffect(() => {
      // Trigger enter animation without using CSS animation
      drawerContext.setVisible(true)
   });

   onCleanup(() => {
      drawerContext.setVisible(false)
   })

   let hasTouch = false;

   const visibleHeight = createMemo(() => {

      const height = drawerContext.drawerSize();

      if (drawerContext.isDragging()) {
         return height - drawerContext.draggedDistance()
      }
      if (drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset()?.length > 0) {
         // @ts-ignore
         return height - drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()]
      }

      return drawerContext.isOpen() ? height : 0;
   });

   const styleTransform = createMemo(() => {

      if (drawerContext.nestedDragging()) {

         const scaleOffset = NESTED_DISPLACEMENT - (NESTED_DISPLACEMENT / (drawerContext.nestedLevel + 2))

         const initialScale = (window.innerWidth - scaleOffset) / window.innerWidth;
         const newScale = initialScale + drawerContext.nestedProgress() * (1 - initialScale);
         const yOffset = - 24 + drawerContext.nestedProgress() * 24;

         const newY =  drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()] as number + yOffset : yOffset;

         return `scale(${newScale}) translate3d(0px, ${newY}px, 0px)`
      }

      if (drawerContext.isDragging()) {
         return `translate3d(0px, ${drawerContext.draggedDistance()}px, 0px)`;
      }

      if (drawerContext.nestedOpen()) {

         const scaleOffset = NESTED_DISPLACEMENT - (NESTED_DISPLACEMENT / (drawerContext.nestedLevel + 2))
         const scale =  (window.innerWidth - scaleOffset) / window.innerWidth;

         const yOffset = -24;

         const newY =  drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()] as number + yOffset : yOffset;

         return `scale(${scale}) translate3d(0, ${newY}px, 0)`;
      }

      if (drawerContext.state() === 'exit-start' || drawerContext.state() === 'exiting' || drawerContext.state() === 'enter-start') {
         return `translate3d(0px, 100%, 0)`;
      }

      return undefined;
   });

   const styleTransition = createMemo(() => {
      return buildTransitionString('transform', drawerContext.nestedState() !== 'exited' ? drawerContext.nestedState() : drawerContext.state(), drawerContext.isDragging() || drawerContext.nestedDragging())
   })

   const onPointerUp = (e: PointerEvent) => {
      if (!hasTouch) {
         drawerContext.onRelease(e);
      }
      hasTouch = false;
      return true;
   }

   const onTouchStart = (e: TouchEvent) => {
      hasTouch = true;
      return true;
   }

   /* assign directly to ref, as layer-stack/dismissible logic doesn't allow for pointer events on DialogContent */
   createEffect(() => {
      const drawerRef = drawerContext.drawerRef();

      if (!drawerRef || drawerContext.isDisabled()) return;

      drawerRef.addEventListener('pointerdown', drawerContext.onPress);
      drawerRef.addEventListener('pointermove', drawerContext.onDrag);
      drawerRef.addEventListener('pointerup', onPointerUp);

      drawerRef.addEventListener('touchstart', onTouchStart);
      drawerRef.addEventListener('touchmove', drawerContext.onDrag);
      drawerRef.addEventListener('touchend', drawerContext.onRelease);

      onCleanup(() => {
         drawerRef.removeEventListener('pointerdown', drawerContext.onPress);
         drawerRef.removeEventListener('pointermove', drawerContext.onDrag);
         drawerRef.removeEventListener('pointerup', onPointerUp);

         drawerRef.removeEventListener('touchstart', onTouchStart);
         drawerRef.removeEventListener('touchmove', drawerContext.onDrag);
         drawerRef.removeEventListener('touchend', drawerContext.onRelease);
      })
   })

   createEffect(() => {
      let el = ref()
      if (el) {
         drawerContext.setDrawerRef(el)
      }
   })

   return {
      drawerContentProps: {
         onPointerDownOutside: (e: PointerDownOutsideEvent) => {
            props.onPointerDownOutside?.(e);
            if (!drawerContext.modal()) {
               e.preventDefault();
               return;
            }

            e.preventDefault();

            if (!drawerContext.dismissible()) {
               return;
            }

            drawerContext.close();
         },
         get style() {
            if (drawerContext.isDisabled()) {
               return undefined;
            }
            return {
               '--visible-height': `${visibleHeight()}px`,
               '--snap-point-height': drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? `${drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()]}px` : undefined,
               '--first-snap-point-height': drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? `${drawerContext.drawerSize() - drawerContext.snapPointsOffset()[0]!}px` : undefined,
               'transition': styleTransition(),
               'transform': styleTransform(),
               ...props.style,
            } as JSX.CSSProperties
         },
         get "vaul-drawer"() {
            return !drawerContext.isDisabled() ? '' : undefined;
         },
         get "vaul-drawer-visible"() {
            return drawerContext.visible() ? 'true': 'false'
         },
         get "vaul-state"() {
            return drawerContext.state()
         },
         get "vaul-dragging"() {
            return drawerContext.isDragging() ? 'true': 'false'
         }
      },
   }
}
