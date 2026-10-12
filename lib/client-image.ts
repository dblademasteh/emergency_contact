export const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export const MAX_LOGO_SOURCE_SIZE = 20_000_000;
export const MAX_LOGO_DIMENSION = 512;

export const MAX_BANNER_SOURCE_SIZE = 20_000_000;
export const MAX_BANNER_DIMENSION = 1600;

export function readImageAsDataUrl(
  file: File,
  maxDimension = MAX_LOGO_DIMENSION
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Reject oversized files before even creating a canvas.
    if (file.size > MAX_LOGO_SOURCE_SIZE) {
      reject(
        new Error(
          `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${(MAX_LOGO_SOURCE_SIZE / 1024 / 1024).toFixed(0)}MB.`
        )
      );
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported.");
        ctx.drawImage(img, 0, 0, w, h);
        const mime = canvas
          .toDataURL("image/webp")
          .startsWith("data:image/webp")
          ? "image/webp"
          : "image/png";
        const dataUrl = canvas.toDataURL(mime, 0.85);

        // Ensure the compressed output is still under a sane size.
        // 512x512 WebP at 0.85 quality is typically < 100KB.
        if (dataUrl.length > MAX_LOGO_SOURCE_SIZE) {
          reject(
            new Error(
              "Compressed image is still too large. Try a smaller image."
            )
          );
          return;
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't decode image."));
    };
    img.src = url;
  });
}
