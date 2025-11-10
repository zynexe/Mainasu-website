import { useState } from "react";
import imageCompression from "browser-image-compression";
import "../styles/Gallery.css";
import fileIcon from "../assets/file.svg";

interface AddPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; files: File[] }) => Promise<void>;
  categories: Array<{ id: string; name: string; label: string }>;
}

const AddPhotosModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: AddPhotosModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.id || ""
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validFiles = files.filter((file) => {
      const isValid =
        file.type === "image/png" ||
        file.type === "image/jpeg" ||
        file.type === "image/jpg";
      return isValid;
    });

    if (validFiles.length !== files.length) {
      setError("Only PNG and JPG files are allowed");
      return;
    }

    // No file size limit check here - we'll compress first
    // Just inform user about large files
    const largeFiles = validFiles.filter((file) => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setError(
        `${largeFiles.length} file(s) are larger than 5MB and will be compressed. If compression fails to reduce size below 5MB, those files will not be uploaded.`
      );
    }

    // Add to selected files
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Generate previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    // Reset input
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // Revoke URL to free memory
    URL.revokeObjectURL(previews[index]);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);

    // Clear error if no files left
    if (newFiles.length === 0) {
      setError("");
    }
  };

  const compressImage = async (
    file: File,
    fileName: string
  ): Promise<{ success: boolean; file?: File; error?: string }> => {
    const maxSizeMB = 5;

    // If file is already under 5MB, return it as is
    if (file.size <= maxSizeMB * 1024 * 1024) {
      return {
        success: true,
        file: file,
      };
    }

    // File is larger than 5MB, try to compress
    const options = {
      maxSizeMB: 4.5, // Target 4.5MB to have buffer below 5MB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type as string,
      initialQuality: 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // Check if compressed file is still over 5MB
      if (compressedFile.size > maxSizeMB * 1024 * 1024) {
        return {
          success: false,
          error: `${fileName}: Original size ${formatFileSize(
            file.size
          )}, compressed to ${formatFileSize(
            compressedFile.size
          )} - still over 5MB limit. Please use a smaller image or reduce quality manually.`,
        };
      }

      return {
        success: true,
        file: compressedFile,
      };
    } catch (error) {
      console.error("Error compressing image:", error);
      return {
        success: false,
        error: `${fileName}: Compression failed. Please try a different image.`,
      };
    }
  };

  const resetModalState = () => {
    // Clean up preview URLs
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    // Reset all state
    setSelectedCategory(categories[0]?.id || "");
    setSelectedFiles([]);
    setPreviews([]);
    setError("");
    setProgress(0);
    setCurrentStep("");
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one photo");
      return;
    }

    setUploading(true);
    setProgress(0);
    setCurrentStep("Compressing images...");
    setError(""); // Clear any previous errors

    try {
      const compressedFiles: File[] = [];
      const failedFiles: string[] = [];
      const totalFiles = selectedFiles.length;

      // Compress all images
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const originalSize = formatFileSize(file.size);

        setCurrentStep(
          `Compressing ${file.name} (${originalSize})... (${
            i + 1
          }/${totalFiles})`
        );
        setProgress(((i + 1) / totalFiles) * 30); // 0-30% for compression

        const result = await compressImage(file, file.name);

        if (result.success && result.file) {
          compressedFiles.push(result.file);
          const compressedSize = formatFileSize(result.file.size);

          // Show compression info
          if (file.size > 5 * 1024 * 1024) {
            setCurrentStep(
              `✓ ${file.name}: ${originalSize} → ${compressedSize}`
            );
          }
        } else {
          failedFiles.push(result.error || file.name);
        }

        // Small delay to show the message
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // If all files failed
      if (compressedFiles.length === 0) {
        setError(
          "All files failed compression or are too large:\n" +
            failedFiles.join("\n")
        );
        setUploading(false);
        setProgress(0);
        setCurrentStep("");
        return;
      }

      // If some files failed
      if (failedFiles.length > 0) {
        setError(
          `⚠️ ${
            failedFiles.length
          } file(s) could not be compressed below 5MB and will be skipped:\n${failedFiles.join(
            "\n"
          )}\n\nUploading ${compressedFiles.length} successful file(s)...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Show error for 2 seconds
      }

      // Update step to uploading
      setCurrentStep(
        `Uploading ${compressedFiles.length} image${
          compressedFiles.length !== 1 ? "s" : ""
        }...`
      );
      setProgress(40); // Start upload at 40%

      // Call parent's onSubmit with compressed files
      await onSubmit({
        category: selectedCategory,
        files: compressedFiles,
      });

      setProgress(100);
      setCurrentStep("Complete!");

      // Show summary
      let summaryMessage = `Successfully uploaded ${
        compressedFiles.length
      } photo${compressedFiles.length !== 1 ? "s" : ""}!`;
      if (failedFiles.length > 0) {
        summaryMessage += `\n\n${failedFiles.length} file(s) were skipped (too large after compression).`;
      }

      // Close modal after short delay
      setTimeout(() => {
        resetModalState();
        onClose();
        if (compressedFiles.length > 0) {
          alert(summaryMessage);
        }
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error?.message || "Failed to upload photos. Please try again.");
      setUploading(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const handleClose = () => {
    // Prevent closing while uploading
    if (uploading) return;

    resetModalState();
    onClose();
  };

  // Reset state when modal closes
  if (!isOpen && (selectedFiles.length > 0 || uploading)) {
    resetModalState();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content add-photos-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add Photos</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={uploading}
            title={uploading ? "Please wait for upload to complete" : "Close"}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Category Selection */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
              disabled={uploading}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>
              Photos * (PNG/JPG, any size - will be compressed if over 5MB)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleFileChange}
              className="file-input"
              id="photo-upload"
              disabled={uploading}
            />
            <label
              htmlFor="photo-upload"
              className={`file-upload-label ${uploading ? "disabled" : ""}`}
            >
              <img src={fileIcon} alt="Upload" className="upload-icon-img" />
              <span>Choose Files</span>
              <p>Click to select multiple photos (any size)</p>
            </label>
          </div>

          {/* Error/Warning Message */}
          {error && (
            <div
              className={`error-message ${
                error.includes("⚠️") ? "warning-message" : ""
              }`}
            >
              {error}
            </div>
          )}

          {/* Progress Bar */}
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

          {/* Preview Grid */}
          {previews.length > 0 && !uploading && (
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-preview-btn"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                  <div className="preview-filename">
                    {selectedFiles[index].name}
                    <span className="file-size">
                      {formatFileSize(selectedFiles[index].size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!uploading && (
            <div className="file-count">
              {selectedFiles.length} file
              {selectedFiles.length !== 1 ? "s" : ""} selected
            </div>
          )}

          {/* Submit Button */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Processing..." : "Upload Photos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotosModal;
