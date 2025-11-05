import { useState } from "react";
import { X, Upload } from "lucide-react";
import "../styles/AddUserModal.css";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role: string; image: File | null }) => void;
  editMode?: boolean;
  initialData?: { name: string; role: string; avatar_url?: string | null };
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editMode = false,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialData?.avatar_url || "");
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        setError("File size must be less than 1MB");
        return;
      }

      // Check file type
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setError("Only PNG and JPG files are allowed");
        return;
      }

      setError("");
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !role) {
      setError("Please fill in all required fields");
      return;
    }

    if (!imageFile && !editMode && !preview) {
      setError("Please upload a profile picture");
      return;
    }

    onSubmit({ name, role, image: imageFile });
    handleClose();
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
    <div className="add-user-modal-overlay" onClick={handleClose}>
      <div
        className="add-user-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>
          <X size={24} />
        </button>

        <h2>{editMode ? "Edit User" : "Add User"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name.."
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Gooner, Jobless, Weeb"
              required
            />
          </div>

          <div className="form-group">
            <label>Image (Max 500KB, PNG/JPG)</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                id="profile-image-input"
              />
              <label htmlFor="profile-image-input" className="upload-label">
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn">
            {editMode ? "Update User" : "Add User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
