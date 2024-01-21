import {Accessor, createContext, Setter, useContext} from "solid-js";
import {TransitionState} from "./create-transition-state";
import {n} from "vitest/dist/types-198fd1d9";

export interface DrawerContextValue {
   drawerRef: Accessor<HTMLElement | null>;
   setDrawerRef: Setter<HTMLElement | null>;
   overlayRef: Accessor<HTMLElement | null>;
   setOverlayRef: Setter<HTMLElement | null>;

   isOpen: Accessor<boolean>;
   close: () => void;

   onPress: (event: PointerEvent | TouchEvent) => void;
   onRelease: (event: PointerEvent | TouchEvent) => void;
   onDrag: (event: PointerEvent | TouchEvent) => void;
   onNestedDrag: (event: PointerEvent | TouchEvent, percentageDragged: number) => void;
   onNestedOpenChange: (o: boolean) => void;
   onNestedRelease: (event: PointerEvent | TouchEvent, open: boolean) => void;
   dismissible: Accessor<boolean>;
   isDragging: Accessor<boolean>;
   draggedDistance: Accessor<number>;
   snapPointsOffset: Accessor<number[]>;
   drawerSize: Accessor<number>;
   snapPoints: Accessor<(number | string)[]>;
   modal: Accessor<boolean>;
   fadeRange: Accessor<[number, number]>
   activeSnapPoint: Accessor<number>;
   setActiveSnapPoint: (o: number) => void;
   visible: Accessor<boolean>;
   setVisible: (o: boolean) => void;
   state: Accessor<TransitionState>;
   nestedOpen: Accessor<boolean>;
   nestedDragging: Accessor<boolean>;
   nestedProgress: Accessor<number>;
   nestedLevel: number;
   nestedState: Accessor<TransitionState>;
}

export const DrawerContext = createContext<DrawerContextValue>();

export function useDrawerContext() {
   const context = useContext(DrawerContext);

   if (context === undefined) {
      throw new Error("[Drawer]: `useDrawerContext` must be used within a `Drawer` component");
   }

   return context;
}

export interface DrawerPublicContextValue {
   drawerRef: Accessor<HTMLElement | null>
   overlayRef: Accessor<HTMLElement | null>

   /**
    * If currently open
    */

   isOpen: Accessor<boolean>
   /**
    * Close the drawer
    */
   close: () => void;

   /**
    * Open the drawer
    */
   open: () => void;

   /**
    * The calculated Offsets (in px) for the snap points
    */
   snapPointsOffset: Accessor<number[]>;

   /**
    * If the drawer is currently being dragged
    */
   isDragging: Accessor<boolean>;
   /**
    * Active's snap point's index. If none were explicitly defined, either 0 (closed) or 1 (open)
    */
   activeSnapPoint: Accessor<number>;

   /**
    * TransitionState.
    */
   state: Accessor<TransitionState>;

   /**
    * The currently dragged Distance in px
    */
   draggedDistance: Accessor<number>;

   /**
    * Size of the drawer element.
    */
   drawerSize: Accessor<number>;

   /**
    * Gives you the current transition style to apply
    *
    * @param property CSS property to transition
    */
   transition: (property: string) => string;
}

export const DrawerPublicContext = createContext<DrawerPublicContextValue>();

export function usePublicDrawerContext() {
   const context = useContext(DrawerPublicContext);

   if (context === undefined) {
      throw new Error("[Drawer]: `useDrawerContext` must be used within a `Drawer` component");
   }

   return context;
}
