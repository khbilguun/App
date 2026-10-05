export const MAX_SIDE = 1600;

export interface Resized {
  blob: Blob;
  width: number;
  height: number;
}

function fit(w: number, h: number) {
  const s = Math.min(1, MAX_SIDE / Math.max(w, h));
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Зураг хөрвүүлж чадсангүй"))), "image/jpeg", 0.85),
  );
}

/** Видео эсвэл зургийг урт тал нь ≤1600px JPEG болгоно. */
export async function drawResized(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
): Promise<Resized> {
  const { width, height } = fit(srcW, srcH);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return { blob: await toJpeg(canvas), width, height };
}

export async function resizeFile(file: File): Promise<Resized> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return await drawResized(bmp, bmp.width, bmp.height);
  } finally {
    bmp.close();
  }
}
