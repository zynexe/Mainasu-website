import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "../styles/Rating.css";

interface Vote {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicId: string;
  musicTitle: string;
  musicArtist: string;
  votes: Vote[];
  currentUserVote?: number;
  onVoteSuccess: () => void;
}

const VoteModal = ({
  isOpen,
  onClose,
  musicId,
  musicTitle,
  musicArtist,
  votes,
  currentUserVote,
  onVoteSuccess,
}: VoteModalProps) => {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Set current user's vote if exists
  useEffect(() => {
    if (currentUserVote) {
      setSelectedRating(currentUserVote);
    } else {
      setSelectedRating(0);
    }
  }, [currentUserVote, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        alert("Please select a user first");
        return;
      }
      const user = JSON.parse(currentUser);

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("music_votes")
        .select("id")
        .eq("music_id", musicId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from("music_votes")
          .update({
            rating: selectedRating,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingVote.id);

        if (error) throw error;
        alert("Vote updated successfully!");
      } else {
        // Insert new vote
        const { error } = await supabase.from("music_votes").insert({
          music_id: musicId,
          user_id: user.id,
          rating: selectedRating,
        });

        if (error) throw error;
        alert("Vote submitted successfully!");
      }

      onVoteSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      alert(`Failed to submit vote: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedRating(currentUserVote || 0);
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  // Calculate average rating
  const avgRating =
    votes.length > 0
      ? (
          votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content vote-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="vote-modal-title">
            <h2>Rate This Music</h2>
            <p className="vote-modal-subtitle">
              {musicTitle} • {musicArtist}
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Rating Section */}
          <div className="vote-rating-section">
            <div className="vote-rating-header">
              <h3>Your Rating</h3>
              {selectedRating > 0 && (
                <span className="selected-rating-display">
                  {selectedRating}/10
                </span>
              )}
            </div>

            <div className="rating-stars">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`star-btn ${
                    rating <= (hoveredRating || selectedRating) ? "active" : ""
                  }`}
                  onClick={() => setSelectedRating(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submitting}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={
                      rating <= (hoveredRating || selectedRating)
                        ? "currentColor"
                        : "none"
                    }
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="star-number">{rating}</span>
                </button>
              ))}
            </div>

            {selectedRating > 0 && (
              <p className="rating-hint">
                {selectedRating <= 3 && "Not great 😕"}
                {selectedRating > 3 && selectedRating <= 5 && "It's okay 😐"}
                {selectedRating > 5 && selectedRating <= 7 && "Good! 😊"}
                {selectedRating > 7 && selectedRating <= 9 && "Great! 😄"}
                {selectedRating === 10 && "Masterpiece! 🤩"}
              </p>
            )}
          </div>

          {/* Divider */}
          {votes.length > 0 && <div className="vote-divider" />}

          {/* Votes List Section */}
          {votes.length > 0 && (
            <div className="votes-list-section">
              <div className="votes-list-header">
                <h3>All Votes ({votes.length})</h3>
                <div className="avg-rating-badge">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{avgRating}/10 avg</span>
                </div>
              </div>

              <div className="votes-list">
                {votes.map((vote) => (
                  <div key={vote.id} className="vote-item">
                    <div className="vote-user-info">
                      <img
                        src={vote.userAvatar}
                        alt={vote.userName}
                        className="vote-user-avatar"
                      />
                      <span className="vote-user-name">{vote.userName}</span>
                    </div>
                    <div className="vote-rating-display">
                      <div className="vote-stars-small">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <svg
                            key={star}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={star <= vote.rating ? "#FFD700" : "#2a2a2a"}
                            stroke={star <= vote.rating ? "#FFD700" : "#444"}
                            strokeWidth="2"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="vote-rating-number">
                        {vote.rating}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Votes Yet */}
          {votes.length === 0 && (
            <div className="no-votes-message">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <p>No votes yet. Be the first to rate this music!</p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={selectedRating === 0 || submitting}
            >
              {submitting
                ? "Submitting..."
                : currentUserVote
                ? "Update Vote"
                : "Submit Vote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoteModal;
