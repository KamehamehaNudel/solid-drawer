import {useDrawerContext} from "./drawer-context";
import {createMemo, JSX} from "solid-js";
import {buildTransitionString, getProgressBetweenPoints} from "./helpers";

export function createDrawerOverlay(props: {style?: JSX.CSSProperties}) {

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

         if (drawerContext.state() === 'exiting') {
            return 0;
         }
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

   return {
      drawerOverlayProps: {
         "vaul-overlay": "",
         get "style"() {
            return {
               transition: styleTransition(),
               opacity: styleOpacity(),
               ...props.style,
            }
         }
      }
   }
}
