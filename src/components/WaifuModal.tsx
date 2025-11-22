import { useState, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import "../styles/Waifu.css";

interface AddWaifuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role: string; image: File | null }) => void;
  onDelete?: () => void;
  editMode?: boolean;
  initialData?: { name: string; role: string; image?: string };
}

const AddWaifuModal: React.FC<AddWaifuModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  editMode = false,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialData?.image || "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");

  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const MAX_GIF_SIZE_MB = 5; // Allow 5MB for GIFs
  const MAX_GIF_SIZE_BYTES = MAX_GIF_SIZE_MB * 1024 * 1024;

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPreview(initialData.image || "");
    } else {
      setName("");
      setRole("");
      setPreview("");
    }
    setImageFile(null);
    setError("");
    setProgress(0);
    setCurrentStep("");
  }, [initialData, isOpen]);

  // Manage body scroll when modal is open/closed
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const compressImage = async (
    file: File
  ): Promise<{ success: boolean; file?: File; error?: string }> => {
    // Don't compress GIFs (would lose animation)
    if (file.type === "image/gif") {
      // Check if GIF is under 5MB (larger limit for GIFs)
      if (file.size <= MAX_GIF_SIZE_BYTES) {
        return { success: true, file };
      } else {
        return {
          success: false,
          error: `GIF files cannot be compressed. Please use a GIF under ${MAX_GIF_SIZE_MB}MB. Current size: ${formatFileSize(
            file.size
          )}MB`,
        };
      }
    }

    // If file is already under 2MB, return it as is
    if (file.size <= MAX_SIZE_BYTES) {
      return { success: true, file };
    }

    // File is larger than 2MB, try to compress (JPG/PNG only)
    const options = {
      maxSizeMB: 1.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type as string,
      initialQuality: 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      if (compressedFile.size > MAX_SIZE_BYTES) {
        return {
          success: false,
          error: `Image is still ${formatFileSize(
            compressedFile.size
          )}MB after compression (original: ${formatFileSize(
            file.size
          )}MB). Please use a smaller image.`,
        };
      }

      return { success: true, file: compressedFile };
    } catch (error) {
      console.error("Error compressing image:", error);
      return {
        success: false,
        error: "Compression failed. Please try a different image.",
      };
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and GIF files are allowed");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setProgress(0);

      const originalSize = formatFileSize(file.size);

      // Show initial status
      if (file.size > MAX_SIZE_BYTES) {
        setCurrentStep(
          `Processing ${file.name} (${originalSize}MB - over ${MAX_SIZE_MB}MB limit)...`
        );
        setProgress(30);
      } else {
        setCurrentStep(`Processing ${file.name} (${originalSize}MB)...`);
        setProgress(30);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Compress the image
      setProgress(60);
      const result = await compressImage(file);

      if (!result.success || !result.file) {
        setError(result.error || "Failed to process image");
        setProgress(0);
        setCurrentStep("");
        setUploading(false);
        e.target.value = "";
        return;
      }

      // Success
      const compressedSize = formatFileSize(result.file.size);
      setProgress(90);

      if (file.size > MAX_SIZE_BYTES && file.type !== "image/gif") {
        setCurrentStep(`✓ Compressed: ${originalSize}MB → ${compressedSize}MB`);
      } else if (file.type === "image/gif") {
        setCurrentStep(`✓ GIF ready: ${compressedSize}MB`);
      } else {
        setCurrentStep(`✓ Image ready: ${compressedSize}MB`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      setImageFile(result.file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setProgress(100);
        setTimeout(() => {
          setProgress(0);
          setCurrentStep("");
          setUploading(false);
        }, 500);
      };
      reader.readAsDataURL(result.file);
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to process image");
      setProgress(0);
      setCurrentStep("");
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !role) {
      setError("Please fill in all fields");
      return;
    }

    if (!imageFile && !editMode && !preview) {
      setError("Please upload an image");
      return;
    }

    onSubmit({ name, role, image: imageFile });
    handleClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this waifu? This action cannot be undone."
      );
      if (confirmed) {
        onDelete();
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setName("");
    setRole("");
    setImageFile(null);
    setPreview("");
    setError("");
    setProgress(0);
    setCurrentStep("");
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={24} />
        </button>

        <h2>{editMode ? "Edit Mybini" : "Add Mybini"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter waifu name"
              required
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>From</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Aespa, ZZZ, Blue Archive"
              required
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>
              Image (JPG/PNG: Max {MAX_SIZE_MB}MB • GIF: Max {MAX_GIF_SIZE_MB}
              MB)
            </label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleImageChange}
                id="waifu-image-input"
                disabled={uploading}
              />
              <label
                htmlFor="waifu-image-input"
                className="upload-label"
                style={{
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={32} />
                    <span>Click to upload image</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Progress Bar - Same as AddPhotosModal */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-info">
                <span className="progress-text">{currentStep}</span>
                <span className="progress-percentage">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            {editMode && onDelete && (
              <button
                type="button"
                className="delete-btn-modal"
                onClick={handleDelete}
                disabled={uploading}
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading
                ? "Processing..."
                : editMode
                ? "Update Mybini"
                : "Add Mybini"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWaifuModal;
