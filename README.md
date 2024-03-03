<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-drawer&background=tiles&project=%20" alt="solid-drawer">
</p>

# solid-drawer

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

This library is a port of https://github.com/emilkowalski/vaul for solid JS.\
Instead of radix it is built on top of the kobalte https://github.com/kobaltedev/kobalte/ libraries dialog component.\
The "vaul" library has been modified to utilize solids fine grained reactivity vs. relying on direct style-manipulation of a ref.

## Showcase



https://github.com/KamehamehaNudel/solid-drawer/assets/46644843/d8855fe8-6a4c-4f12-9d31-5a8bec587be6



## Quick start

Install it:

```bash
npm i solid-drawer
# or
yarn add solid-drawer
# or
pnpm add solid-drawer
```

Use it:

```tsx
import {Drawer, useDrawerContext} from 'solid-drawer'
import {Dialog} from "@kobalte/core";

export default function MyAwesomeDrawer() {

   return (
      <Drawer.Root>
         <Dialog.Portal>
            <Drawer.Overlay/>
            <Drawer.Content>
               Hello From the Drawer
            </Drawer.Content>
         </Dialog.Portal>
      </Drawer.Root>
   )
}
```

### New Addition: Primitive functions
In addition to the exported components. There are now also "primitive" versions of the functionality.
`createDrawer`
`createDrawerContent`
and `createDrawerOverlay`

Use them to turn any Kobalte modal-like content layer (Dialog, Menus, Selects, Popovers) into a drawer.
`createDrawer` creates the root of the drawer. It returns a `DrawerProvider` you have to wrap your Dialog/Menu/Select etc. with and also `rootProps` you have to apply on the respective Kobalte's Root component.
For the Content Component you have the use `createDrawerContent` and apply the returned `drawerContentProps` to the respective Content Element.

## Props
These are the same between the `Drawer` Component version and the `createDrawer` primitive.
### `isDisabled`
*   Type: `boolean | undefined`
*   Description: Disable the whole drawer logic. Component will behave as if it were a "normal" Dialog. Useful if you want to do drawers conditionally, For example only on small-screen devices
### `snapPoints`

*   Type: `(number | string)[] | undefined`
*   Description: Define snap-points at which the Drawer should "snap" to. Points in px (string) or fraction of the total height of the drawer (calculated open visible mount). Have to be in ascending order.

### `defaultSnapPoint`

*   Type: `number | undefined`
*   Description: The index of the snap-point to "snap to" when the drawer is opened. Defaults to 1 (the first visible snap-point).

### `fadeRange`

*   Type: `[number, number] | undefined`
*   Description: Snap-points indexes between which the fading of the background should happen. By default, spans all snap-points, meaning the overlay will get progressively darker between snap-points.

### `open`
*   Type: `boolean | undefined`
*   Description: Supply for controlling the open state.

### `onOpenChange`

*   Type: `(open: boolean) => void | undefined`
*   Description: Setter for the open state
*   Parameters:
    *   `open`: Wheter to open or close

### `activeSnapPoint`

*   Type: `number | undefined`
*   Description: Supply for controlling the active snap-point. Index has to exist in provided snap-points. Otherwise broken behavior

### `setActiveSnapPoint`

*   Type: `(snapPoint: number) => void | undefined`
*   Description: Setter for the active snap point.
*   Parameters:
    *   `snapPoint`: The snap point to set.

### `children`

*   Type: `JSX.Element`
*   Description: Children components rendered inside the DrawerRoot component.

### `closeThreshold`

*   Type: `number | undefined`
*   Description: Threshold value for closing.

### `shouldScaleBackground`

*   Type: `boolean | undefined`
*   Description: Flag for enabling the scaling background effect.

### `scrollLockTimeout`

*   Type: `number | undefined`
*   Description: Timeout in ms for locking dragging after scrolling happened. Defaults to 100ms.

### `dismissible`

*   Type: `boolean | undefined`
*   Description: If false, the drawer is not dismissible via gestures or by clicking the overlay. Attempts to drag lower than the first visible snap-point are damped (same as dragging higher than the highest one). If no explicit snap-points are defined, attempts to drag in either direction are dampened. Defaults to `true`.

### `onDrag`

*   Type: `(event: TouchEvent | PointerEvent, percentageDragged: number) => void | undefined`
*   Description: Callback upon dragging.
*   Parameters:
    *   `event`: Touch or pointer event triggering the drag.
    *   `percentageDragged`: The percentage of the drawer's height that has been dragged.

### `onRelease`

*   Type: `(event: TouchEvent | PointerEvent, open: boolean) => void | undefined`
*   Description: Callback fired upon releasing a drag. Receives the "open" state as a second argument.
*   Parameters:
    *   `event`: Touch or pointer event triggering the release.
    *   `open`: Boolean indicating whether the drawer is open.
