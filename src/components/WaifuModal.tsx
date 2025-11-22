import { useState, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { validateFile, compressImage } from "../lib/imageUpload";
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file (all users can upload GIF for waifus)
    const validation = validateFile(file, true); // true = allow GIF
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Compress image (automatically skips GIFs)
      const compressedFile = await compressImage(file);

      setImageFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to process image");
    } finally {
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
            />
          </div>

          <div className="form-group">
            <label>Image (Max 2MB • JPG, PNG, GIF)</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleImageChange}
                id="waifu-image-input"
                disabled={uploading}
              />
              <label htmlFor="waifu-image-input" className="upload-label">
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
            {uploading && (
              <p style={{ color: "#667eea", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Processing image...
              </p>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            {editMode && onDelete && (
              <button
                type="button"
                className="delete-btn-modal"
                onClick={handleDelete}
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? "Processing..." : editMode ? "Update Mybini" : "Add Mybini"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWaifuModal;
