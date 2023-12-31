import { Accessor, createContext, JSX, Setter, useContext } from "solid-js";
import {TransitionState} from "./create-transition-state";

export interface DrawerContextValue {
    drawerRef: Accessor<HTMLElement | undefined>;
    setDrawerRef: Setter<HTMLElement | undefined>;
    overlayRef: Accessor<HTMLElement | undefined>;
    setOverlayRef: Setter<HTMLElement | undefined>;

    isOpen: Accessor<boolean>;
    close: () => void;

    onPress: (event: PointerEvent) => void;
    onRelease: (event: PointerEvent | TouchEvent) => void;
    onDrag: (event: PointerEvent | TouchEvent) => void;
    onNestedDrag: (event: PointerEvent | TouchEvent, percentageDragged: number) => void;
    onNestedOpenChange: (o: boolean) => void;
    onNestedRelease: (event: PointerEvent, open: boolean) => void;
    dismissible: Accessor<boolean>;
    isDragging: Accessor<boolean>;
    draggedDistance: Accessor<number>;
    snapPointsOffset: Accessor<number[]>;
    drawerSize: Accessor<number>;
    snapPoints?: Accessor<(number |string)[] | null>;
    modal: Accessor<boolean>;
    fadeRange: Accessor<number[]>
    activeSnapPoint?: Accessor<number>;
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
