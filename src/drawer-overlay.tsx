import {splitProps} from "solid-js";
import {Dialog} from "@kobalte/core";

import {DialogOverlayProps} from "@kobalte/core/dist/types/dialog";
import {createDrawerOverlay} from "./create-drawer-overlay";

export function DrawerOverlay(props: DialogOverlayProps) {

   const [local, others] = splitProps(props, ["style"])

   const {drawerOverlayProps} = createDrawerOverlay(local);

   return (
      <Dialog.Overlay
         {...drawerOverlayProps}
         {...others}
      />
   )
}
