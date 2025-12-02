/**
 * Check file type by reading magic bytes (file signature)
 * More secure than relying on MIME type or extension
 */
export const validateFileType = async (
  file: File
): Promise<{
  valid: boolean;
  type: string;
  error?: string;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);

      // Check magic bytes
      const header = Array.from(arr.slice(0, 4))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Image signatures
      if (header.startsWith("ffd8ff")) {
        resolve({ valid: true, type: "image/jpeg" });
      } else if (header.startsWith("89504e47")) {
        resolve({ valid: true, type: "image/png" });
      } else if (header.startsWith("47494638")) {
        resolve({ valid: true, type: "image/gif" });
      } else if (header.startsWith("52494646")) {
        resolve({ valid: true, type: "image/webp" });
      }
      // Audio signatures
      else if (header.startsWith("494433") || header.startsWith("fffb")) {
        resolve({ valid: true, type: "audio/mpeg" });
      } else if (header.startsWith("4f676753")) {
        resolve({ valid: true, type: "audio/ogg" });
      } else if (header.startsWith("52494646")) {
        // Could be WAV or WebP, check further
        const subheader = Array.from(arr.slice(8, 12))
          .map((b) => String.fromCharCode(b))
          .join("");

        if (subheader === "WAVE") {
          resolve({ valid: true, type: "audio/wav" });
        } else {
          resolve({
            valid: false,
            type: "unknown",
            error: "Unknown RIFF format",
          });
        }
      } else {
        resolve({
          valid: false,
          type: "unknown",
          error: `Invalid file type (signature: ${header})`,
        });
      }
    };

    reader.onerror = () => {
      resolve({ valid: false, type: "unknown", error: "Failed to read file" });
    };

    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (
  file: File,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          valid: false,
          error: `Image dimensions ${img.width}x${img.height} exceed limit ${maxWidth}x${maxHeight}`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "Failed to load image" });
    };

    img.src = url;
  });
};
