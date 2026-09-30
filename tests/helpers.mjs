import { loadFonts } from '../src/typography.mjs';

export async function loadTestFonts() {
  return loadFonts({
    regular: new URL('../vendor/fonts/NotoSans-Regular.ttf', import.meta.url),
    bold: new URL('../vendor/fonts/NotoSans-Bold.ttf', import.meta.url),
  });
}
