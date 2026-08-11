// categoryColors.ts - one colour per category, shared by every surface that
// shows categories (the mix donut, the filter pills, the card chips), so a
// category looks the same everywhere.
//
// Assignment is by the category's ORDER, never by size or by anything that
// can change, so a category keeps its colour as the mix changes.
//
// The palette was checked with the dataviz validator: every hue sits inside
// the lightness band and above the chroma floor, worst adjacent colourblind
// separation 9.1 (target >= 8), worst normal-vision separation 19.6 (floor
// 15). Some hues fall under 3:1 against white, so colour is never the only
// signal - every place that uses these also shows the category's name.
export const CATEGORY_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
]

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
