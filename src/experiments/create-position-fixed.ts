import { Accessor, createEffect, createSignal, onCleanup, onMount } from "solid-js";

let previousBodyPosition: Record<string, string> | null = null;

export function createPositionFixed(props: {
  isOpen: Accessor<boolean>;
  modal: Accessor<boolean>;
  nested: Accessor<boolean>;
  hasBeenOpened: Accessor<boolean>;
}) {

  const [activeUrl, setActiveUrl] = createSignal(typeof window !== 'undefined' ? window.location.href : '');

  let scrollPos: number = 0;

  function setPositionFixed() {
    // If previousBodyPosition is already set, don't set it again.
    if (previousBodyPosition === null && props.isOpen()) {
      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        height: document.body.style.height,
      };

      // Update the dom inside an animation frame
      const { scrollX, innerHeight } = window;

      requestAnimationFrame(() => {
         document.body.style.setProperty('position', 'fixed', 'important');
         document.body.style.top = `${-scrollPos}px`;
         document.body.style.left = `${-scrollX}px`;
         document.body.style.right = '0px';
         document.body.style.height = 'auto';
      })

      setTimeout(
        () =>
          requestAnimationFrame(() => {
            // Attempt to check if the bottom bar appeared due to the position change
            const bottomBarHeight = innerHeight - window.innerHeight;
            if (bottomBarHeight && scrollPos >= innerHeight) {
              // Move the content further up so that the bottom bar doesn't hide it
              document.body.style.top = `${-(scrollPos + bottomBarHeight)}px`;
            }
          }),
        300,
      );
    }
  }

  function restorePositionSetting() {
    if (previousBodyPosition !== null) {
      // Convert the position from "px" to Int
      const y = -parseInt(document.body.style.top, 10);
      const x = -parseInt(document.body.style.left, 10);

      // Restore styles
      document.body.style.position = previousBodyPosition.position;
      document.body.style.top = previousBodyPosition.top;
      document.body.style.left = previousBodyPosition.left;
      document.body.style.height = previousBodyPosition.height;
      document.body.style.right = 'unset';

      requestAnimationFrame(() => {
        if (activeUrl() !== window.location.href) {
          setActiveUrl(window.location.href);
          return;
        }

        window.scrollTo(x, y);
      });

      previousBodyPosition = null;
    }
  }

  onMount(() => {
    function onScroll() {
        scrollPos = window.scrollY;
    }

    onScroll();

    window.addEventListener('scroll', onScroll);

    onCleanup(() => {
        window.removeEventListener('scroll', onScroll);
    })
  })

  createEffect(() => {

    const {nested, hasBeenOpened, isOpen, modal} = props;

     if (nested() || !hasBeenOpened()) {
        return;
     }

    // This is needed to force Safari toolbar to show **before** the drawer starts animating to prevent a gnarly shift from happening
     if (isOpen()) {
        setPositionFixed();
        if (!modal()) {
            setTimeout(() => {
                restorePositionSetting();
              }, 500);
        }
     } else {
        restorePositionSetting();
     }
  })

  return { restorePositionSetting };
}
