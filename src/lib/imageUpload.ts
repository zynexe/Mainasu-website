import imageCompression from "browser-image-compression";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateFile = (
  file: File,
  isSupporter: boolean
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check file type
  const allowedTypes = isSupporter
    ? ["image/jpeg", "image/png", "image/gif"]
    : ["image/jpeg", "image/png"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: isSupporter
        ? "Only JPG, PNG, and GIF files are allowed"
        : "Only JPG and PNG files are allowed. GIF is available for supporters.",
    };
  }

  return { valid: true };
};

export const compressImage = async (file: File): Promise<File> => {
  // Don't compress GIFs (would lose animation)
  if (file.type === "image/gif") {
    return file;
  }

  const options = {
    maxSizeMB: 1.8, // Target 1.8MB to stay safely under 2MB
    maxWidthOrHeight: 1920, // Increased from 1024 for better quality
    useWebWorker: true,
    fileType: file.type as "image/jpeg" | "image/png",
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed: ${file.size} → ${compressedFile.size} bytes`);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // Return original if compression fails
  }
};

export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<{ url: string; error?: string }> => {
  try {
    const { supabase } = await import("./supabase");

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log(`Uploading: ${fileName} (${file.size} bytes)`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error: any) {
    return { url: "", error: error.message };
  }
};
