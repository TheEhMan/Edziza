// Pure transform math for zooming an equirectangular map about the mouse/touch
// position rather than making every zoom jump toward the middle of the image.
export const limit = (n, low, high) => Math.min(high, Math.max(low, n));
export function atlasZoom(current, factor, focusX = 0, focusY = 0) {
  const zoom = limit(current.zoom * factor, 1, 12);
  const ratio = zoom / current.zoom;
  return { zoom,
    x: focusX + (current.x - focusX) * ratio,
    y: focusY + (current.y - focusY) * ratio };
}
