import { useState } from "react";
import { X, Upload } from "lucide-react";
import "../styles/Waifu.css";

interface AddWaifuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role: string; image: File }) => void;
  editMode?: boolean;
  initialData?: { name: string; role: string; image?: string };
}

const AddWaifuModal: React.FC<AddWaifuModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editMode = false,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialData?.image || "");
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (500KB = 512000 bytes)
      if (file.size > 512000) {
        setError("File size must be less than 500KB");
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
      setError("Please fill in all fields");
      return;
    }

    if (!imageFile && !editMode) {
      setError("Please upload an image");
      return;
    }

    if (imageFile) {
      onSubmit({ name, role, image: imageFile });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
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
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., oshi, oshipa"
            />
          </div>

          <div className="form-group">
            <label>Image (Max 500KB, PNG/JPG)</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                id="image-input"
              />
              <label htmlFor="image-input" className="upload-label">
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
            {editMode ? "Update Mybini" : "Add Mybini"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWaifuModal;
