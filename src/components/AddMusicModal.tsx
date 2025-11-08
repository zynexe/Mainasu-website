import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "../styles/Rating.css";

interface AddMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void; // Just refresh callback
}

const AddMusicModal = ({ isOpen, onClose, onSubmit }: AddMusicModalProps) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"file" | "link">("file");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioLink, setAudioLink] = useState("");
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setArtist("");
      setUploadMethod("file");
      setAudioFile(null);
      setAudioLink("");
      setAudioPreview(null);
    }
  }, [isOpen]);

  const detectSourceType = (url: string): string => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    } else if (url.includes("spotify.com")) {
      return "spotify";
    } else if (url.includes("soundcloud.com")) {
      return "soundcloud";
    }
    return "link";
  };

  const extractEmbedUrl = (url: string, type: string): string => {
    try {
      if (type === "youtube") {
        const videoId = url.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
        )?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      } else if (type === "spotify") {
        const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
        return trackId
          ? `https://open.spotify.com/embed/track/${trackId}`
          : url;
      }
      return url;
    } catch (error) {
      return url;
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/aac",
        "audio/flac",
        "audio/m4a",
      ];
      if (!validTypes.includes(file.type)) {
        alert(
          "Please upload a valid audio file (MP3, WAV, OGG, AAC, FLAC, M4A)"
        );
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }

      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !artist.trim()) {
      alert("Please fill in music title and artist");
      return;
    }

    if (uploadMethod === "file" && !audioFile) {
      alert("Please select an audio file");
      return;
    }

    if (uploadMethod === "link" && !audioLink.trim()) {
      alert("Please enter an audio link");
      return;
    }

    try {
      setUploading(true);

      // Get current user from localStorage
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        alert("Please select a user first");
        return;
      }
      const user = JSON.parse(currentUser);

      // ✅ ADD THIS: Check upload limit
      const { count: uploadCount, error: countError } = await supabase
        .from("music")
        .select("*", { count: "exact", head: true })
        .eq("uploaded_by", user.id);

      if (countError) throw countError;

      if ((uploadCount || 0) >= 20) {
        alert(
          `Upload limit reached! You can only upload 20 songs.\nYou currently have ${uploadCount} songs uploaded.\n\nPlease delete some songs before uploading new ones.`
        );
        setUploading(false);
        return;
      }

      let audioUrl: string | null = null;
      let embedUrl: string | null = null;
      let sourceType: string = uploadMethod;
      let duration = 0;

      if (uploadMethod === "file" && audioFile) {
        // Upload file to Supabase Storage
        const fileExt = audioFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("music-files")
          .upload(filePath, audioFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("music-files")
          .getPublicUrl(filePath);

        audioUrl = urlData.publicUrl;
        sourceType = "file";

        // Get duration from audio file
        const audio = new Audio(URL.createObjectURL(audioFile));
        await new Promise((resolve) => {
          audio.addEventListener("loadedmetadata", () => {
            duration = Math.floor(audio.duration);
            resolve(null);
          });
        });
      } else if (uploadMethod === "link") {
        sourceType = detectSourceType(audioLink);
        embedUrl = extractEmbedUrl(audioLink, sourceType);
      }

      // Insert music record
      const { error: dbError } = await supabase.from("music").insert({
        title: title.trim(),
        artist: artist.trim(),
        source_type: sourceType,
        audio_url: audioUrl,
        embed_url: embedUrl,
        duration,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      alert("Music added successfully!");
      onSubmit(); // Refresh the list
      onClose();
    } catch (error: any) {
      console.error("Error adding music:", error);
      alert(`Failed to add music: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setArtist("");
    setUploadMethod("file");
    setAudioFile(null);
    setAudioLink("");
    setAudioPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content add-music-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add New Music</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Music Title */}
          <div className="form-group">
            <label htmlFor="music-title">Music Title *</label>
            <input
              type="text"
              id="music-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter music title"
              required
              disabled={uploading}
            />
          </div>

          {/* Artist */}
          <div className="form-group">
            <label htmlFor="artist">Artist *</label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              required
              disabled={uploading}
            />
          </div>

          {/* Upload Method */}
          <div className="form-group">
            <label>Upload Method *</label>
            <div className="upload-method-buttons">
              <button
                type="button"
                className={`method-btn ${
                  uploadMethod === "file" ? "active" : ""
                }`}
                onClick={() => {
                  setUploadMethod("file");
                  setAudioLink("");
                  setAudioPreview(null);
                }}
                disabled={uploading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ marginRight: "0.5rem" }}
                >
                  <path
                    d="M10 3v12m0 0l4-4m-4 4L6 11m11 6H3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Upload File
              </button>
              <button
                type="button"
                className={`method-btn ${
                  uploadMethod === "link" ? "active" : ""
                }`}
                onClick={() => {
                  setUploadMethod("link");
                  setAudioFile(null);
                  setAudioPreview(null);
                }}
                disabled={uploading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ marginRight: "0.5rem" }}
                >
                  <path
                    d="M10 13a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 19c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Embed Link
              </button>
            </div>
          </div>

          {/* Upload File Option */}
          {uploadMethod === "file" && (
            <div className="form-group">
              <label htmlFor="audio-file">
                Audio File * (MP3, WAV, OGG, AAC, FLAC, M4A - Max 5MB)
              </label>
              <input
                type="file"
                id="audio-file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/m4a"
                onChange={handleAudioFileChange}
                required
                disabled={uploading}
              />
              {audioPreview && (
                <div className="audio-preview">
                  <div className="audio-preview-header">
                    <span className="audio-file-name">{audioFile?.name}</span>
                    <span className="audio-file-size">
                      {audioFile
                        ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </span>
                  </div>
                  <audio controls src={audioPreview}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* Embed Link Option */}
          {uploadMethod === "link" && (
            <div className="form-group">
              <label htmlFor="audio-link">
                Audio Link * (YouTube, Spotify, SoundCloud, etc.)
              </label>
              <input
                type="text"
                id="audio-link"
                value={audioLink}
                onChange={(e) => setAudioLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                required
                disabled={uploading}
              />
              <div className="link-examples">
                <p className="link-examples-title">Supported platforms:</p>
                <ul className="link-examples-list">
                  <li>YouTube: youtube.com/watch?v=...</li>
                  <li>Spotify: open.spotify.com/track/...</li>
                  <li>SoundCloud: soundcloud.com/...</li>
                  <li>Other audio streaming platforms</li>
                </ul>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? "Adding..." : "Add Music"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMusicModal;
