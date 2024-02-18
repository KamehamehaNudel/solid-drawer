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
} from "./drawer-context";

export {
   createDrawer,
   type DrawerApi,
   type DrawerProps,
   type DrawerPrimitive
} from "./create-drawer";

export {
   createDrawerOverlay
} from "./create-drawer-overlay";

export {
   createDrawerContent
} from "./create-drawer-content";

export type {
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
