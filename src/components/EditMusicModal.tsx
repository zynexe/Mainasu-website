import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "../styles/Rating.css";

interface EditMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  musicId: string;
  initialData: {
    title: string;
    artist: string;
    sourceType: string;
  };
}

const EditMusicModal = ({
  isOpen,
  onClose,
  onSuccess,
  musicId,
  initialData,
}: EditMusicModalProps) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title);
      setArtist(initialData.artist);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !artist.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("music")
        .update({
          title: title.trim(),
          artist: artist.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", musicId);

      if (error) throw error;

      alert("Music updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating music:", error);
      alert(`Failed to update music: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Get current user
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        alert("Please select a user first");
        return;
      }
      const user = JSON.parse(currentUser);

      // Get music data to check if it has a file to delete
      const { data: musicData, error: fetchError } = await supabase
        .from("music")
        .select("*")
        .eq("id", musicId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if it's a file upload
      if (musicData.source_type === "file" && musicData.audio_url) {
        // Extract file path from URL
        const urlParts = musicData.audio_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from("music-files")
          .remove([filePath]);

        if (storageError) console.error("Error deleting file:", storageError);
      }

      // Delete music record (votes will be deleted automatically due to CASCADE)
      const { error: deleteError } = await supabase
        .from("music")
        .delete()
        .eq("id", musicId);

      if (deleteError) throw deleteError;

      alert("Music deleted successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting music:", error);
      alert(`Failed to delete music: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setArtist("");
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content edit-music-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{showDeleteConfirm ? "Delete Music?" : "Edit Music"}</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={updating || deleting}
          >
            ✕
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleUpdate} className="modal-form">
            {/* Music Title */}
            <div className="form-group">
              <label htmlFor="edit-music-title">Music Title *</label>
              <input
                type="text"
                id="edit-music-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter music title"
                required
                disabled={updating}
              />
            </div>

            {/* Artist */}
            <div className="form-group">
              <label htmlFor="edit-artist">Artist *</label>
              <input
                type="text"
                id="edit-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name"
                required
                disabled={updating}
              />
            </div>

            {/* Source Type Info */}
            <div className="form-group">
              <label>Source Type</label>
              <div className="source-type-display">
                {initialData.sourceType === "file" && "📁 Uploaded File"}
                {initialData.sourceType === "youtube" && "▶️ YouTube"}
                {initialData.sourceType === "spotify" && "🎵 Spotify"}
                {initialData.sourceType === "soundcloud" && "☁️ SoundCloud"}
              </div>
              <p className="form-hint">
                Note: You can only edit title and artist. To change the audio
                source, delete and re-upload.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updating}
              >
                Delete Music
              </button>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleClose}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Music"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="modal-form">
            {/* Delete Confirmation */}
            <div className="delete-confirmation">
              <div className="delete-warning-icon">⚠️</div>
              <h3 className="delete-confirmation-title">
                Are you sure you want to delete this music?
              </h3>
              <div className="delete-music-info">
                <p className="delete-music-title">{initialData.title}</p>
                <p className="delete-music-artist">by {initialData.artist}</p>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone. All votes for this music will also
                be deleted.
              </p>
            </div>

            {/* Delete Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditMusicModal;
