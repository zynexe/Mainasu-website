import { useState, useEffect } from "react";
import "../styles/AddUserModal.css";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role: string; image: File | null }) => void;
  editMode?: boolean;
  initialData?: {
    name: string;
    role: string;
    avatar_url: string | null;
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

  // Pre-fill form when editing
  useEffect(() => {
    if (editMode && initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPreviewUrl(initialData.avatar_url);
      setImage(null); // Reset image file
    } else {
      // Reset form when adding new user
      setName("");
      setRole("");
      setImage(null);
      setPreviewUrl(null);
    }
  }, [editMode, initialData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !role.trim()) {
      alert("Please fill in all fields");
      return;
    }

    // If editing and no new image selected, pass null (keep existing image)
    onSubmit({ name: name.trim(), role: role.trim(), image });

    // Reset form
    setName("");
    setRole("");
    setImage(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    // Reset form on close
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
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {editMode ? "Update User" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
