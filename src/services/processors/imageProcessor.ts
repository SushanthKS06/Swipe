export async function processImageFile(file: File, onMimeTypeMeasured: (mime: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error("Failed to read file"));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 2048;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          // Fallback to uncompressed base64 if canvas is unavailable
          onMimeTypeMeasured(file.type || "image/jpeg");
          resolve(result.split(',')[1] || result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed WebP
        const mimeType = "image/webp";
        onMimeTypeMeasured(mimeType);
        
        const compressedDataUrl = canvas.toDataURL(mimeType, 0.8);
        const base64Str = compressedDataUrl.split(",")[1];
        resolve(base64Str);
      };

      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
