// categoryColors.ts - one colour per category, shared by every surface that
// shows categories (the mix donut, the filter pills, the card chips, the
// mix rows), so a category looks the same everywhere.
//
// Colour is bound to the category's IDENTITY, not to its position: reordering
// the categories, or changing the mix, must never repaint them. That is why
// this is a map keyed by id rather than an array indexed by position.
//
// The palette was checked with the dataviz validator, in the order the
// categories are displayed: every hue inside the lightness band and above the
// chroma floor, worst adjacent colourblind separation 9.1 (target >= 8),
// worst normal-vision separation 22.9 (floor 15). Some hues fall under 3:1
// against white, so colour is never the only signal - every surface that uses
// these also shows the category's name.
const COLOR_BY_ID: Record<string, string> = {
  'vision-victory': '#2a78d6', // blue
  'zionist-unity': '#eb6834', // orange
  'winning-iron-wall': '#1baf7a', // aqua
  'service-integration': '#eda100', // yellow
  'education-revolution': '#008300', // green
  'legal-reform': '#4a3aa7', // violet
  'zionist-economy': '#e87ba4', // magenta
}

/** Used only if a category appears that this map does not know about */
const FALLBACK = '#777777'

export function categoryColor(id: string): string {
  return COLOR_BY_ID[id] ?? FALLBACK
}
