import type { GeoTiff } from "@/lib/geotiff";

/**
 * Visualization helpers adapted from Google's Solar API sample
 * (js-solar-potential / visualize.ts, Apache-2.0).
 */

export function renderRGB(rgb: GeoTiff, mask?: GeoTiff): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = mask ? mask.width : rgb.width;
  canvas.height = mask ? mask.height : rgb.height;

  const dw = rgb.width / canvas.width;
  const dh = rgb.height / canvas.height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const rgbIdx = Math.floor(y * dh) * rgb.width + Math.floor(x * dw);
      const maskIdx = y * canvas.width + x;
      const imgIdx = y * canvas.width * 4 + x * 4;
      img.data[imgIdx + 0] = rgb.rasters[0][rgbIdx];
      img.data[imgIdx + 1] = rgb.rasters[1][rgbIdx];
      img.data[imgIdx + 2] = rgb.rasters[2][rgbIdx];
      img.data[imgIdx + 3] = mask ? mask.rasters[0][maskIdx] * 255 : 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function renderPalette({
  data,
  mask,
  colors,
  min,
  max,
  index,
}: {
  data: GeoTiff;
  mask?: GeoTiff;
  colors?: string[];
  min?: number;
  max?: number;
  index?: number;
}): HTMLCanvasElement {
  const palette = createPalette(colors ?? ["000000", "ffffff"]);
  const indices = data.rasters[index ?? 0]
    .map((x) => normalize(x, max ?? 1, min ?? 0))
    .map((x) => Math.round(x * (palette.length - 1)));
  return renderRGB(
    {
      ...data,
      rasters: [
        indices.map((i) => palette[i].r),
        indices.map((i) => palette[i].g),
        indices.map((i) => palette[i].b),
      ],
    },
    mask,
  );
}

export function createPalette(hexColors: string[]): { r: number; g: number; b: number }[] {
  const rgb = hexColors.map(colorToRGB);
  const size = 256;
  const step = (rgb.length - 1) / (size - 1);
  return Array.from({ length: size }, (_, i) => {
    const index = i * step;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return {
      r: lerp(rgb[lower].r, rgb[upper].r, index - lower),
      g: lerp(rgb[lower].g, rgb[upper].g, index - lower),
      b: lerp(rgb[lower].b, rgb[upper].b, index - lower),
    };
  });
}

export function colorToRGB(color: string): { r: number; g: number; b: number } {
  const hex = color.startsWith("#") ? color.slice(1) : color;
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

export function normalize(x: number, max = 1, min = 0): number {
  return clamp((x - min) / (max - min), 0, 1);
}

export function lerp(x: number, y: number, t: number): number {
  return x + t * (y - x);
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export function rgbToColor({ r, g, b }: { r: number; g: number; b: number }): string {
  const f = (x: number) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${f(r)}${f(g)}${f(b)}`;
}
