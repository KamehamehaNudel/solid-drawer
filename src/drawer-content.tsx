import {createEffect, splitProps, onCleanup, createMemo, createSignal} from "solid-js";
import {Dialog} from "@kobalte/core";
import {mergeRefs} from "@kobalte/utils";
import {useDrawerContext} from "./drawer-context";
import {NESTED_DISPLACEMENT} from "./constants";
import {buildTransitionString} from "./helpers";

export function DrawerContent(props) {

   const [local, others] = splitProps(props, ["ref", "children", "style", "onOpenAutoFocus", "onPointerDownOutside", "onAnimationEnd", "style"]);

   const drawerContext = useDrawerContext();

   createEffect(() => {
      // Trigger enter animation without using CSS animation
      drawerContext.setVisible(true)
   });

   onCleanup(() => {
      drawerContext.setVisible(false)
   })

   let hasTouch = false;

   const visibleHeight = () => {

      const height = drawerContext.drawerSize();

      if (drawerContext.isDragging()) {
         return height - drawerContext.draggedDistance()
      }
      if (drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset()?.length > 0) {
         return height - drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()]
      }

      return drawerContext.isOpen() ? height : 0;
   }

   const styleTransform = createMemo(() => {

      if (drawerContext.nestedDragging()) {

         const scaleOffset = NESTED_DISPLACEMENT - (NESTED_DISPLACEMENT / (drawerContext.nestedLevel + 2))

         const initialScale = (window.innerWidth - scaleOffset) / window.innerWidth;
         const newScale = initialScale + drawerContext.nestedProgress() * (1 - initialScale);
         const yOffset = - 24 + drawerContext.nestedProgress() * 24;

         const newY =  drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()] + yOffset : yOffset;

         return `scale(${newScale}) translate3d(0px, ${newY}px, 0px)`
      }

      if (drawerContext.isDragging()) {
         return `translate3d(0px, ${drawerContext.draggedDistance()}px, 0px)`;
      }

      if (drawerContext.nestedOpen()) {

         const scaleOffset = NESTED_DISPLACEMENT - (NESTED_DISPLACEMENT / (drawerContext.nestedLevel + 2))
         const scale =  (window.innerWidth - scaleOffset) / window.innerWidth;

         const yOffset = -24;

         const newY =  drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()] + yOffset : yOffset;

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

/*   createEffect(() => {
      console.log('nested State', drawerContext.nestedState())
   })

   createEffect(() => {
      console.log('nested open', drawerContext.nestedOpen())
   })*/

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
      if (!drawerContext.drawerRef()) return;

      drawerContext.drawerRef()?.addEventListener('pointerdown', drawerContext.onPress);
      drawerContext.drawerRef()?.addEventListener('pointermove', drawerContext.onDrag);
      drawerContext.drawerRef()?.addEventListener('pointerup', onPointerUp);

      drawerContext.drawerRef()?.addEventListener('touchstart', onTouchStart);
      drawerContext.drawerRef()?.addEventListener('touchmove', drawerContext.onDrag);
      drawerContext.drawerRef()?.addEventListener('touchend', drawerContext.onRelease);

      onCleanup(() => {
         drawerContext.drawerRef()?.removeEventListener('pointerdown', drawerContext.onPress);
         drawerContext.drawerRef()?.removeEventListener('pointermove', drawerContext.onDrag);
         drawerContext.drawerRef()?.removeEventListener('pointerup', onPointerUp);

         drawerContext.drawerRef()?.removeEventListener('touchstart', onTouchStart);
         drawerContext.drawerRef()?.removeEventListener('touchmove', drawerContext.onDrag);
         drawerContext.drawerRef()?.removeEventListener('touchend', drawerContext.onRelease);
      })
   })

   return (
      <Dialog.Content
         onPointerDownOutside={(e) => {
            local.onPointerDownOutside?.(e);
            if (!drawerContext.modal()) {
               e.preventDefault();
               return;
            }

            e.preventDefault();
            drawerContext.onOpenChange?.(false);

            if (!drawerContext.dismissible()) {
               return;
            }

            drawerContext.close();
         }}
         ref={mergeRefs(drawerContext.setDrawerRef, local.ref)}
         style={{
            '--visible-height': `${visibleHeight()}px`,
            '--snap-point-height': drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? `${drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()]}px` : undefined,
            '--first-snap-point-height': drawerContext.snapPointsOffset() && drawerContext.snapPointsOffset().length > 0 ? `${drawerContext.drawerSize() - drawerContext.snapPointsOffset()[0]}px` : undefined,
            'transition': styleTransition(),
            'transform': styleTransform(),
            ...local.style,
         }}
         {...others}
         vaul-drawer=""
         vaul-drawer-visible={drawerContext.visible() ? 'true' : 'false'}
         vaul-drawer-state={drawerContext.state()}
         vaul-dragging={drawerContext.isDragging() ? 'true' : 'false'}
      >
         <div
            class="drawer__inner"
            style={{
               transition: buildTransitionString('height', drawerContext.state(), drawerContext.isDragging()),
            }}
         >
            {local.children}
         </div>
      </Dialog.Content>
   )
}
