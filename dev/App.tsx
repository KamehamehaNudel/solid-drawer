import type { Component } from 'solid-js'
import logo from './logo.svg'
import styles from './App.module.css'
import { Drawer } from '../src'
import { Dialog } from '@kobalte/core'
import {createSignal} from "solid-js";

const App: Component = () => {

  const [open, setOpen] = createSignal(false);

  return (
    <div class={styles.App} vaul-drawer-wrapper>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <img src={logo} class={styles.logo} alt="logo" />
        <img src={logo} class={styles.logo} alt="logo" />
        <img src={logo} class={styles.logo} alt="logo" />
        <h1>
          <Drawer.Root shouldScaleBackground={false} defaultSnapPoint={1} snapPoints={[0.6, 1]} modal={true}>
            <Dialog.Trigger class="dialog__trigger">Open</Dialog.Trigger>
            <Dialog.Portal>
              <Drawer.Content class="drawer__content">
                <div class="drawer__header">
                  <Dialog.Title class="dialog__title">About Kobalte Drawer</Dialog.Title>
                  <Dialog.CloseButton class="dialog__close-button">
                    X
                  </Dialog.CloseButton>
                </div>
                <Drawer.Root modal={true} open={open()} onOpenChange={setOpen}>
                  <button type={"button"} onClick={() => setOpen(!open())}>
                    Controlled Test <br/>
                    open: {open() ? 'true': 'false'}
                  </button>
                  <Dialog.Portal>
                    <Drawer.Overlay class="drawer__overlay" />
                    <Drawer.Content class="drawer__content">
                      <div class="drawer__header">
                        <Dialog.Title class="dialog__title">Nested Controlled Kobalte Drawer</Dialog.Title>
                        <Dialog.CloseButton class="dialog__close-button">
                          X
                        </Dialog.CloseButton>
                      </div>
                      <Dialog.Description class="dialog__description">

                      </Dialog.Description>
                    </Drawer.Content>
                  </Dialog.Portal>
                </Drawer.Root>
                <Dialog.Description class="dialog__description">

                  This Container is scrollable even when snap Points are used. This is done via a <code>"--visible-height"</code> css property made available.
                  Also note the Footer disappearing only once its lower than the first snap Points.
                  <br/>
                  <br/>
                  Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>



                  Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>
                  foundation for your design system implementation.<br/>

                  Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the

                  <input type="text"/>

                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>                        Kobalte is a UI toolkit for building accessible web apps and design systems with
                  SolidJS. It provides a set of low-level UI components and primitives which can be the
                  foundation for your design system implementation.<br/>
                </Dialog.Description>
                <div class="drawer__footer">
                  <Dialog.CloseButton>
                    Close
                  </Dialog.CloseButton>
                </div>
              </Drawer.Content>
            </Dialog.Portal>
          </Drawer.Root>
        </h1>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
       <div style={{height: "300px"}}>

       </div>
       <pre id="debug">

       </pre>
    </div>
  )
}

export default App
