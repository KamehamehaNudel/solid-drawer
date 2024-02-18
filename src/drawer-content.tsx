import { splitProps, JSX, createSignal} from "solid-js";
import {Dialog} from "@kobalte/core";
import {mergeRefs, OverrideComponentProps} from "@kobalte/utils";
import {DialogContentOptions} from "@kobalte/core/dist/types/dialog";
import {createDrawerContent} from "./create-drawer-content";

export interface DrawerContentOptions extends Omit<DialogContentOptions, "style"> {
   /** The HTML styles attribute (object form only). */
   style?: Omit<JSX.CSSProperties, 'transition' | 'transform' | 'transform-style' | 'transition-duration' | 'transition-delay'>;
}

export interface DrawerContentProps extends OverrideComponentProps<"div", DrawerContentOptions> {}

/**
 * The Content of the Drawer. Extension of the DialogContent component
 * Avoid applying transitions on it. This is ha
 */

export function DrawerContent(props: DrawerContentProps) {

   const [local, refProp, others] = splitProps(props, ["onPointerDownOutside", "style"], ["ref"]);

   const [ref, setRef] = createSignal<HTMLElement | undefined>();

   const {drawerContentProps} = createDrawerContent(local, ref);

   return (
      <Dialog.Content
         {...drawerContentProps}
         {...others}
         ref={mergeRefs(props.ref, setRef)}
      >
         {props.children}
      </Dialog.Content>
   )
}
