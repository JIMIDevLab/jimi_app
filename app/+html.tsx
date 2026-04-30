import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Mobile web: when the on-screen keyboard opens, the layout viewport
// stays at full height while the *visual* viewport shrinks — so a
// chat input pinned to the bottom of a 100%-height flex column ends
// up below the visible area. We mirror visualViewport.height into a
// CSS variable and clamp html/body/#root to it, so the layout adapts
// the same way native does. `interactive-widget=resizes-content` is
// the matching hint for Chromium; Safari is covered by the script.
const responsiveStyle = `
:root { --vvh: 100dvh; }
html, body, #root { height: var(--vvh) !important; }
body { overscroll-behavior: none; }
`;

const viewportSyncScript = `
(function () {
  if (typeof window === 'undefined') return;
  var docEl = document.documentElement;
  var vv = window.visualViewport;
  function update() {
    var h = vv ? vv.height : window.innerHeight;
    docEl.style.setProperty('--vvh', h + 'px');
  }
  update();
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  } else {
    window.addEventListener('resize', update);
  }
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveStyle }} />
        <script dangerouslySetInnerHTML={{ __html: viewportSyncScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
