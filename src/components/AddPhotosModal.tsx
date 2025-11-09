import { useState } from "react";
import "../styles/Gallery.css";
import fileIcon from "../assets/file.svg"; // Add this import

interface AddPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; files: File[] }) => void;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file sizes (5MB max per file)
    const oversizedFiles = validFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setError("Each file must be less than 5MB");
      return;
    }

    // Add to selected files
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Generate previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    setError("");

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

    try {
      await onSubmit({
        category: selectedCategory,
        files: selectedFiles,
      });
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;

    // Clean up preview URLs
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    setSelectedCategory(categories[0]?.id || "");
    setSelectedFiles([]);
    setPreviews([]);
    setError("");
    onClose();
  };

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

          {/* File Upload - Updated with file.svg icon */}
          <div className="form-group">
            <label>Photos * (PNG/JPG, max 5MB each)</label>
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
              <img
                src={fileIcon}
                alt="Upload"
                className="upload-icon-img"
              />
              <span>Choose Files</span>
              <p>Click to select multiple photos</p>
            </label>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Preview Grid */}
          {previews.length > 0 && (
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
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="file-count">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
            selected
          </div>

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
              {uploading
                ? `Uploading ${selectedFiles.length} photo${
                    selectedFiles.length !== 1 ? "s" : ""
                  }...`
                : "Upload Photos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotosModal;
