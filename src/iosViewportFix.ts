// iOS Safari (browser tab) leaves a black bar at the bottom because the on-screen
// URL bar shrinks the *visual* viewport while CSS `100dvh` / fixed `height:100%`
// resolve to the larger layout viewport, so the game canvas ends up taller than the
// visible area and gets pushed up with black underneath. We pin a precise pixel
// height from window.visualViewport and expose it as `--app-height`, then (touch
// only, via CSS) drive the canvas + root off it. Dispatching a resize lets the
// renderer recompute its drawing buffer to the new height so it actually repaints.

const setAppHeight = () => {
  const vv = window.visualViewport
  const height = vv ? vv.height : window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
}

setAppHeight()

const onChange = () => {
  setAppHeight()
  // nudge the three.js renderer to re-read the canvas size and repaint
  window.dispatchEvent(new Event('resize'))
}

window.visualViewport?.addEventListener('resize', onChange)
window.visualViewport?.addEventListener('scroll', setAppHeight)
window.addEventListener('orientationchange', onChange)
window.addEventListener('pageshow', setAppHeight)
