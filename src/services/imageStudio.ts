export interface ImageProcessingOptions {
  bgMode: 'ORIGINAL' | 'TRANSPARENT' | 'WHITE' | 'STUDIO_GREY' | 'WOOD_SHOWROOM' | 'ROYAL_NAVY';
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  sharpness: number; // 0 to 100
  cropSquare: boolean;
  outputWidth: number; // e.g. 1000
  quality: number; // 0.1 to 1.0
}

export class ImageStudioEngine {
  /**
   * Process an image using pure client-side Canvas and pixel manipulation.
   * This provides an instant, zero-cost, offline fallback when local rembg/Real-ESRGAN
   * Python workers are not active.
   */
  public static async processImage(
    sourceUrl: string,
    options: ImageProcessingOptions
  ): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let srcX = 0;
          let srcY = 0;
          let srcW = img.naturalWidth;
          let srcH = img.naturalHeight;

          // Handle 1:1 Square e-commerce crop
          if (options.cropSquare) {
            const minDim = Math.min(srcW, srcH);
            srcX = (srcW - minDim) / 2;
            srcY = (srcH - minDim) / 2;
            srcW = minDim;
            srcH = minDim;
          }

          const targetDim = options.outputWidth || 1000;
          const canvas = document.createElement('canvas');
          canvas.width = targetDim;
          canvas.height = options.cropSquare ? targetDim : Math.round((srcH / srcW) * targetDim);

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            return reject(new Error('Canvas 2D context unavailable'));
          }

          // Draw base image onto canvas
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

          // Get image data for pixel-level background removal and color enhancements
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // 1. Background replacement / removal
          if (options.bgMode !== 'ORIGINAL') {
            // Sample corner pixels to detect the predominant backdrop tone
            const samplePoints = [
              0, // Top-left
              (canvas.width - 1) * 4, // Top-right
              ((canvas.height - 1) * canvas.width) * 4, // Bottom-left
              ((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4, // Bottom-right
            ];

            let sampleR = 0, sampleG = 0, sampleB = 0;
            for (const sp of samplePoints) {
              sampleR += data[sp];
              sampleG += data[sp + 1];
              sampleB += data[sp + 2];
            }
            sampleR = Math.round(sampleR / 4);
            sampleG = Math.round(sampleG / 4);
            sampleB = Math.round(sampleB / 4);

            const tolerance = 48; // Euclidean distance threshold for studio backdrop

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Color distance to sampled backdrop
              const dist = Math.sqrt(
                Math.pow(r - sampleR, 2) +
                Math.pow(g - sampleG, 2) +
                Math.pow(b - sampleB, 2)
              );

              // Also check for high luminance/overexposed studio whites
              const isNearWhite = r > 230 && g > 230 && b > 230;

              if (dist < tolerance || (sampleR > 210 && isNearWhite)) {
                if (options.bgMode === 'TRANSPARENT') {
                  data[i + 3] = 0; // Alpha 0
                } else if (options.bgMode === 'WHITE') {
                  data[i] = 255;
                  data[i + 1] = 255;
                  data[i + 2] = 255;
                } else if (options.bgMode === 'STUDIO_GREY') {
                  data[i] = 241;
                  data[i + 1] = 245;
                  data[i + 2] = 249;
                } else if (options.bgMode === 'WOOD_SHOWROOM') {
                  data[i] = 245;
                  data[i + 1] = 239;
                  data[i + 2] = 230;
                } else if (options.bgMode === 'ROYAL_NAVY') {
                  data[i] = 20;
                  data[i + 1] = 30;
                  data[i + 2] = 50;
                }
              }
            }
          }

          // 2. Brightness & Contrast
          if (options.brightness !== 0 || options.contrast !== 0) {
            const bVal = options.brightness * 1.5;
            // Contrast factor: [-50..50] -> [0.5..1.5]
            const factor = (259 * (options.contrast * 2.5 + 255)) / (255 * (259 - options.contrast * 2.5));

            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] === 0) continue; // skip transparent pixels

              // Brightness
              let r = data[i] + bVal;
              let g = data[i + 1] + bVal;
              let b = data[i + 2] + bVal;

              // Contrast
              r = factor * (r - 128) + 128;
              g = factor * (g - 128) + 128;
              b = factor * (b - 128) + 128;

              data[i] = Math.min(255, Math.max(0, r));
              data[i + 1] = Math.min(255, Math.max(0, g));
              data[i + 2] = Math.min(255, Math.max(0, b));
            }
          }

          // Put adjusted pixels back
          ctx.putImageData(imgData, 0, 0);

          // 3. Sharpness Enhancement using 3x3 Laplace Convolution kernel
          if (options.sharpness > 0) {
            const sharpWeight = (options.sharpness / 100) * 0.75;
            this.applySharpen(ctx, canvas.width, canvas.height, sharpWeight);
          }

          const mimeType = options.bgMode === 'TRANSPARENT' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, options.quality || 0.9);

          resolve({
            dataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      img.src = sourceUrl;
    });
  }

  private static applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, weight: number) {
    const src = ctx.getImageData(0, 0, width, height);
    const dst = ctx.createImageData(width, height);
    const sData = src.data;
    const dData = dst.data;

    // Convolution kernel: center 1 + 4*w, edges -w
    const kCenter = 1 + 4 * weight;
    const kEdge = -weight;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const up = ((y - 1) * width + x) * 4;
        const down = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            sData[idx + c] * kCenter +
            sData[up + c] * kEdge +
            sData[down + c] * kEdge +
            sData[left + c] * kEdge +
            sData[right + c] * kEdge;
          dData[idx + c] = Math.min(255, Math.max(0, val));
        }
        dData[idx + 3] = sData[idx + 3];
      }
    }

    ctx.putImageData(dst, 0, 0);
  }
}
