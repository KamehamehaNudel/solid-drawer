import {createEffect, createMemo, splitProps} from "solid-js";
import {Dialog} from "@kobalte/core";
import {useDrawerContext} from "./drawer-context";
import {mergeRefs} from "@kobalte/utils";
import {TRANSITIONS} from "./constants";
import {buildTransitionString, getProgressBetweenPoints} from "./helpers";

export function DrawerOverlay(props) {

   const [local, others] = splitProps(props, ["ref", "style"])
   const drawerContext = useDrawerContext();

   const hasSnapPoints = () => drawerContext.snapPoints() && drawerContext.snapPoints().length > 0;

   const styleOpacity = createMemo(() => {
      let height = (drawerContext.drawerSize());
      if (drawerContext.isDragging()) {

         if (hasSnapPoints()) {
            return getProgressBetweenPoints(drawerContext.snapPointsOffset(), drawerContext.draggedDistance(), drawerContext.fadeRange()[0], drawerContext.fadeRange()[1], height)
         }

         return 1 - drawerContext.draggedDistance() / height;

      } else {
         if (hasSnapPoints()) {
            return getProgressBetweenPoints(drawerContext.snapPointsOffset(), drawerContext.state() === 'exiting' ? height : drawerContext.snapPointsOffset()[drawerContext.activeSnapPoint()], drawerContext.fadeRange()[0], drawerContext.fadeRange()[1], height)
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
         }}
      />
   )
}
