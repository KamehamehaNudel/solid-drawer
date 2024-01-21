import {createEffect, createMemo, splitProps} from "solid-js";
import {Dialog} from "@kobalte/core";
import {useDrawerContext} from "./drawer-context";
import {mergeRefs} from "@kobalte/utils";
import {buildTransitionString, getProgressBetweenPoints} from "./helpers";

import {DialogOverlayProps} from "@kobalte/core/dist/types/dialog";

export function DrawerOverlay(props: DialogOverlayProps) {

   const [local, others] = splitProps(props, ["ref", "style"])
   const drawerContext = useDrawerContext();

   const hasSnapPoints = () => drawerContext.snapPoints() && drawerContext.snapPoints().length > 2;

   const styleOpacity = createMemo(() => {
      let height = (drawerContext.drawerSize());
      if (drawerContext.isDragging()) {

         const range = drawerContext.fadeRange();

         if (hasSnapPoints()) {
            return getProgressBetweenPoints(drawerContext.snapPointsOffset(), drawerContext.draggedDistance(), range[0], range[1])
         }

         return 1 - drawerContext.draggedDistance() / height;

      } else {
         const range = drawerContext.fadeRange();

         if (hasSnapPoints()) {
            return getProgressBetweenPoints(drawerContext.snapPointsOffset(), drawerContext.state() === 'exiting' ? height : drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()] as number, range[0], range[1])
         }
         if (drawerContext.isOpen() && drawerContext.state() !== 'enter-start') {
            return 1;
         }
         return 0;
      }
   })

   const styleTransition = createMemo(() => {
      return buildTransitionString('opacity', drawerContext.state(), drawerContext.isDragging());
   })

   return (
      <Dialog.Overlay
         ref={mergeRefs(drawerContext.setOverlayRef, local.ref)}
         vaul-drawer-visible={drawerContext.visible() ? 'true' : 'false'}
         vaul-overlay=""
         vaul-snap-points={drawerContext.isOpen() && hasSnapPoints() ? 'true' : 'false'}
         style={{
            opacity: styleOpacity(),
            transition: styleTransition(),
            ...local.style
         }}
         {...others}
      />
   )
}
