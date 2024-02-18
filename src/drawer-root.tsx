import {
   splitProps, ParentProps
} from "solid-js";

import {Dialog} from '@kobalte/core';
import {DrawerPublicContext} from './drawer-context';
import "./style.css";
import {DialogRootOptions} from "@kobalte/core/dist/types/dialog";
import {createDrawer, DrawerProps} from "./create-drawer";

export interface DrawerRootOptions extends Omit<DialogRootOptions, 'forceMount'>{
   /**
    * INTERNAL ONLY
    * used when detecting nested drawers. Specifying yourself can lead to BROKEN behavior
    */
   nested?: boolean;

   /** INTERNAL ONLY
    * used when detecting nested drawers. Specifying yourself can lead to BROKEN behavior
    */
   nestedLevel?: number;
}

export interface DrawerRootInterface extends ParentProps<DrawerProps> {}

export function DrawerRoot(props: DrawerRootInterface) {

   const [drawerProps, others] = splitProps(props, [
      'open',
      'onOpenChange',
      'defaultOpen',
      'preventScroll',
      'modal',
      'activeSnapPoint',
      'setActiveSnapPoint',
      'closeThreshold',
      'shouldScaleBackground',
      'dismissible',
      'onDrag',
      'onRelease',
      'snapPoints',
      'snapPoints',
      'fadeRange',
      ]
   )

   const {
      DrawerProvider,
      rootProps,
      api,
   } = createDrawer(drawerProps);

   return (
      <DrawerProvider>
         <Dialog.Root {...rootProps} {...others}>
            <DrawerPublicContext.Provider value={api}>
               {props.children}
            </DrawerPublicContext.Provider>
         </Dialog.Root>
      </DrawerProvider>
   );
}
