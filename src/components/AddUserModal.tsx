import { useState, useEffect } from "react";
import "../styles/AddUserModal.css";
import { validateFile, compressImage } from "../lib/imageUpload";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role: string; image: File | null }) => void;
  editMode?: boolean;
  initialData?: {
    id?: string;
    name: string;
    role: string;
    avatar_url: string | null;
    is_supporter?: boolean;
  };
}

const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  editMode = false,
  initialData,
}: AddUserModalProps) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isSupporter = initialData?.is_supporter || false;

  // Pre-fill form when editing
  useEffect(() => {
    if (editMode && initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPreviewUrl(initialData.avatar_url);
      setImage(null);
    } else {
      setName("");
      setRole("");
      setImage(null);
      setPreviewUrl(null);
    }
  }, [editMode, initialData, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, isSupporter);
    if (!validation.valid) {
      alert(validation.error);
      e.target.value = ""; // Reset input
      return;
    }

    try {
      setUploading(true);

      // Compress image (skips GIFs automatically)
      const compressedFile = await compressImage(file);

      setImage(compressedFile);

      // Create preview URL
      const url = URL.createObjectURL(compressedFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !role.trim()) {
      alert("Please fill in all fields");
      return;
    }

    onSubmit({ name: name.trim(), role: role.trim(), image });

    // Reset form
    setName("");
    setRole("");
    setImage(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    setName("");
    setRole("");
    setImage(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editMode ? "Edit User" : "Add New User"}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter user role"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">
              Profile Image{" "}
              {editMode ? "(Optional - keep current if empty)" : ""}
            </label>
            <input
              type="file"
              id="image"
              accept={
                isSupporter
                  ? "image/jpeg,image/png,image/gif"
                  : "image/jpeg,image/png"
              }
              onChange={handleImageChange}
              disabled={uploading}
            />
            <p className="file-hint">
              Max 2MB •{" "}
              {isSupporter
                ? "JPG, PNG, GIF allowed"
                : "JPG, PNG only (GIF for supporters)"}
            </p>
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
            {uploading && (
              <p
                style={{
                  color: "#667eea",
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                }}
              >
                Processing image...
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading
                ? "Processing..."
                : editMode
                ? "Update User"
                : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
