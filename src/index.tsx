import {
  DrawerContent as Content,
   type DrawerContentProps,
} from "./drawer-content";

import {
  DrawerOverlay as Overlay,
} from "./drawer-overlay";

import {
  DrawerRoot as Root,
   type DrawerRootInterface
} from "./drawer-root";

import {
   usePublicDrawerContext as useDrawerContext,
   type DrawerPublicContextValue,
} from "./drawer-context";

export type {
   DrawerPublicContextValue as DrawerContextValue,
   DrawerRootInterface,
   DrawerContentProps
}

export {
   useDrawerContext
}

export const Drawer = {
  Root,
  Overlay,
  Content,
}
