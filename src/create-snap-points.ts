import {dampenValue} from './helpers';
import {VELOCITY_THRESHOLD} from './constants';
import {createControllableSignal} from '@kobalte/core';
import {Accessor, createMemo} from 'solid-js';

export function createSnapPoints(props: {
   activeSnapPointProp: number |  undefined;
   setActiveSnapPointProp?(snapPoint: number): void;
   snapPoints?: (number | string)[];
   fadeRange?: [number, number];
   onSnapPointChange(activeSnapPointIndex: number): void;
   setDraggedDistance(distance: number): void;
   drawerRef: Accessor<HTMLElement| null>;
}) {

   const [activeSnapPoint, setActiveSnapPoint] = createControllableSignal({
      value: () => props.activeSnapPointProp,
      defaultValue: () => 0,
      onChange: props.setActiveSnapPointProp,
   });

   /*
    * ensures there are always at least 2 snap points. "0" for closed state and "1" for full if no other was given
    */
   const resolvedSnapPoints = createMemo(() => {
      let snapPoints = [];

      if (!props.snapPoints || props.snapPoints[0] !== 0) {
         snapPoints.push(0);
      }

      if (props.snapPoints) {
         snapPoints = [...snapPoints, ...props.snapPoints];
      } else {
         snapPoints.push(1);
      }

      return snapPoints;
   })

   // @ts-ignore
   const resolvedFadeRange: Accessor<[number, number]> = createMemo(() => {

      const snapPoints = resolvedSnapPoints();

      if (props.fadeRange === undefined || props.fadeRange.length !== 2) {
         return [0, snapPoints.length -1];
      }

      return props.fadeRange;
   })

   const isLastSnapPoint = createMemo(() => {
      return activeSnapPoint() === resolvedSnapPoints().length - 1;
   })

   const snapPointsOffset = createMemo(() =>
      resolvedSnapPoints().map((snapPoint) => {
         const hasWindow = typeof window !== 'undefined';
         const isPx = typeof snapPoint === 'string';
         let snapPointAsNumber = 0;

         const drawerHeight = props.drawerRef()?.getBoundingClientRect().height || window?.innerHeight;

         if (isPx) {
            snapPointAsNumber = parseInt(snapPoint, 10);
         }

         const height = isPx ? snapPointAsNumber : hasWindow ? snapPoint * drawerHeight : 0;

         if (hasWindow) {
            return drawerHeight - height;
         }

         return height;
      }),
   );

   // @ts-ignore
   const activeSnapPointOffset: Accessor<number> = createMemo(() => {
      return snapPointsOffset()[activeSnapPoint()];
   });

   function onRelease({draggedDistance, closeDrawer, velocity}: {
      draggedDistance: number;
      closeDrawer: () => void;
      velocity: number;
   }) {

      const currentPosition = activeSnapPointOffset() - draggedDistance;
      const isFirst = activeSnapPoint() === 1; //not "0" because that one represents is the closed state

      if (velocity > 2 && draggedDistance < 0) {
         closeDrawer();
         return;
      }

      if (velocity > 2 && draggedDistance > 0 && snapPointsOffset() && props.snapPoints) {
         setActiveSnapPoint(props.snapPoints.length -1)
         return;
      }

      // Find the closest snap point to the current position
      const closestSnapPoint = snapPointsOffset()?.reduce((prev, curr) => {
         if (typeof prev !== 'number' || typeof curr !== 'number') {
            return prev;
         }

         return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
      });

      if (velocity > VELOCITY_THRESHOLD && Math.abs(draggedDistance) < window.innerHeight * 0.4) {
         // -1 = down, 1 = up, might need a better name
         const dragDirection = draggedDistance > 0 ? 1 : -1;

         // Don't do anything if we swipe upwards while being on the last snap point
         if (dragDirection > 0 && isLastSnapPoint()) {
            return;
         }

         if (isFirst && dragDirection < 0) {
            closeDrawer();
            return;
         }

         setActiveSnapPoint(activeSnapPoint() + dragDirection);
         return;
      }

      const closesSnapPointIndex = snapPointsOffset().findIndex(value => closestSnapPoint === value);
      if (closesSnapPointIndex === 0) {
         closeDrawer();
         return;
      }
      setActiveSnapPoint(closesSnapPointIndex);
   }

   function onDrag({draggedDistance, dismissible}: { draggedDistance: number , dismissible: boolean}) {

      const lastOffset = snapPointsOffset()[snapPointsOffset().length -1] as number;
      const firstOffset = snapPointsOffset()[1] as number;
      const newYValue = activeSnapPointOffset() - draggedDistance;

      if (newYValue < lastOffset) {
         const dampenedDraggedDistance = dampenValue(newYValue * -1);
         props.setDraggedDistance(lastOffset + Math.min(dampenedDraggedDistance * -1, 0));
      } else if (newYValue > firstOffset && !dismissible) {
         const dampenedDraggedDistance = dampenValue(newYValue - firstOffset);
         props.setDraggedDistance(firstOffset - Math.min(dampenedDraggedDistance * -1, 0));
      } else {
         props.setDraggedDistance(newYValue);
      }
   }

   return {
      activeSnapPoint,
      setActiveSnapPoint,
      onRelease,
      onDrag,
      snapPointsOffset,
      snapPoints: resolvedSnapPoints,
      fadeRange: resolvedFadeRange,
   };
}
