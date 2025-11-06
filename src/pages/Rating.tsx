import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import AddMusicModal from "../components/AddMusicModal";
import VoteModal from "../components/VoteModal";
import "../styles/Rating.css";
import personIcon from "../assets/person.png";

interface Vote {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
}

interface MusicRating {
  id: string;
  title: string;
  artist: string;
  avgRating: number;
  votes: Vote[];
  sourceType: string;
  audioUrl: string | null;
  embedUrl: string | null;
  duration: number;
}

const Rating = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [musicList, setMusicList] = useState<MusicRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [isAddMusicModalOpen, setIsAddMusicModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicRating | null>(null);
  const [currentUserVote, setCurrentUserVote] = useState<number | undefined>(
    undefined
  );

  const musicPerPage = 15;

  // Fetch music from database
  const fetchMusic = async () => {
    try {
      setLoading(true);

      // Fetch music
      const { data: musicData, error: musicError } = await supabase
        .from("music")
        .select("*")
        .order("created_at", { ascending: false });

      if (musicError) throw musicError;

      // Fetch all votes
      const { data: votesData, error: votesError } = await supabase.from(
        "music_votes"
      ).select(`
          id,
          music_id,
          user_id,
          rating,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `);

      if (votesError) throw votesError;

      // Group votes by music_id
      const votesByMusic: { [key: string]: Vote[] } = {};
      (votesData || []).forEach((vote: any) => {
        if (!votesByMusic[vote.music_id]) {
          votesByMusic[vote.music_id] = [];
        }
        votesByMusic[vote.music_id].push({
          id: vote.id,
          userId: vote.user_id,
          userName: vote.users?.name || "Unknown",
          userAvatar: vote.users?.avatar_url || personIcon,
          rating: vote.rating,
        });
      });

      // Combine music with votes
      const musicWithRatings: MusicRating[] = (musicData || []).map((music) => {
        const votes = votesByMusic[music.id] || [];
        const avgRating =
          votes.length > 0
            ? parseFloat(
                (
                  votes.reduce((sum, v) => sum + v.rating, 0) / votes.length
                ).toFixed(1)
              )
            : 0;

        return {
          id: music.id,
          title: music.title,
          artist: music.artist,
          avgRating,
          votes: votes.slice(0, 4), // Show max 4 avatars
          sourceType: music.source_type,
          audioUrl: music.audio_url,
          embedUrl: music.embed_url,
          duration: music.duration || 0,
        };
      });

      setMusicList(musicWithRatings);
    } catch (error) {
      console.error("Error fetching music:", error);
      alert("Failed to load music. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusic();
  }, []);

  // Filter music based on search
  const filteredMusic = musicList.filter(
    (music) =>
      music.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      music.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredMusic.length / musicPerPage);
  const startIndex = (currentPage - 1) * musicPerPage;
  const currentMusic = filteredMusic.slice(
    startIndex,
    startIndex + musicPerPage
  );

  const handlePlayPause = (musicId: string) => {
    const audio = audioRefs.current[musicId];
    if (!audio) return;

    if (playingId === musicId) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause all other audio
      Object.keys(audioRefs.current).forEach((id) => {
        if (id !== musicId && audioRefs.current[id]) {
          audioRefs.current[id].pause();
        }
      });
      audio.play();
      setPlayingId(musicId);
    }
  };

  const handleTimeUpdate = (musicId: string) => {
    const audio = audioRefs.current[musicId];
    if (audio) {
      setCurrentTime((prev) => ({
        ...prev,
        [musicId]: audio.currentTime,
      }));
    }
  };

  const handleSeek = (musicId: string, value: number) => {
    const audio = audioRefs.current[musicId];
    if (audio) {
      audio.currentTime = value;
      setCurrentTime((prev) => ({
        ...prev,
        [musicId]: value,
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenVotesModal = async (musicId: string) => {
    const music = musicList.find((m) => m.id === musicId);
    if (!music) return;

    // Get current user's vote
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const user = JSON.parse(currentUser);
      const { data: userVote } = await supabase
        .from("music_votes")
        .select("rating")
        .eq("music_id", musicId)
        .eq("user_id", user.id)
        .single();

      setCurrentUserVote(userVote?.rating);
    }

    setSelectedMusic(music);
    setIsVoteModalOpen(true);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <MobileNavbar />
        <div className="rating-page">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "#888", fontSize: "1.1rem" }}>
              Loading music...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="rating-page">
        {/* Header */}
        <div className="rating-header">
          <div className="rating-header-left">
            <h1 className="rating-title">Rating Lagu</h1>
            <p className="rating-subtitle">Vote and discover the best music</p>
          </div>
          <div className="rating-header-right">
            <div className="rating-search-container">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search for Music or Artist..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="rating-search-input"
              />
            </div>
            <button
              className="add-music-btn"
              onClick={() => setIsAddMusicModalOpen(true)}
            >
              <span className="add-music-icon">+</span>
              Add Music
            </button>
          </div>
        </div>

        {/* Music Table */}
        <div className="music-table-container">
          <table className="music-table">
            <thead>
              <tr>
                <th>Music</th>
                <th>Artist</th>
                <th>Avg Rating</th>
                <th>Votes</th>
                <th>Play</th>
              </tr>
            </thead>
            <tbody>
              {currentMusic.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#666",
                    }}
                  >
                    {searchQuery
                      ? "No music found matching your search."
                      : "No music yet. Click 'Add Music' to get started!"}
                  </td>
                </tr>
              ) : (
                currentMusic.map((music) => (
                  <tr key={music.id}>
                    <td className="music-title-cell">{music.title}</td>
                    <td className="music-artist-cell">{music.artist}</td>
                    <td className="music-rating-cell">
                      {music.avgRating > 0
                        ? `${music.avgRating}/10`
                        : "No votes"}
                    </td>
                    <td className="music-votes-cell">
                      <button
                        className="votes-button"
                        onClick={() => handleOpenVotesModal(music.id)}
                      >
                        {music.votes.length > 0 ? (
                          <div className="votes-avatars">
                            {music.votes.map((vote, index) => (
                              <div
                                key={vote.id}
                                className="vote-avatar"
                                style={{
                                  zIndex: music.votes.length - index,
                                  left: `${index * 20}px`,
                                }}
                                title={vote.userName}
                              >
                                <img
                                  src={vote.userAvatar}
                                  alt={vote.userName}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#666", fontSize: "0.85rem" }}>
                            No votes
                          </span>
                        )}
                        <svg
                          className="votes-arrow"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M7.5 5L12.5 10L7.5 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="music-player-cell">
                      {/* File Upload - Audio Player */}
                      {music.sourceType === "file" && music.audioUrl && (
                        <div className="mini-player">
                          <button
                            className="play-pause-btn"
                            onClick={() => handlePlayPause(music.id)}
                          >
                            {playingId === music.id ? (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <rect
                                  x="3"
                                  y="2"
                                  width="3"
                                  height="12"
                                  rx="1"
                                />
                                <rect
                                  x="10"
                                  y="2"
                                  width="3"
                                  height="12"
                                  rx="1"
                                />
                              </svg>
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path d="M4 2l10 6-10 6V2z" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="range"
                            className="player-slider"
                            min="0"
                            max={audioRefs.current[music.id]?.duration || 100}
                            value={currentTime[music.id] || 0}
                            onChange={(e) =>
                              handleSeek(music.id, parseFloat(e.target.value))
                            }
                          />
                          <span className="player-time">
                            {formatTime(currentTime[music.id] || 0)}/
                            {audioRefs.current[music.id]
                              ? formatTime(
                                  audioRefs.current[music.id].duration || 0
                                )
                              : formatTime(music.duration)}
                          </span>
                          <audio
                            ref={(el) => {
                              if (el) audioRefs.current[music.id] = el;
                            }}
                            src={music.audioUrl}
                            onTimeUpdate={() => handleTimeUpdate(music.id)}
                            onEnded={() => setPlayingId(null)}
                          />
                        </div>
                      )}

                      {/* YouTube Embed */}
                      {music.sourceType === "youtube" && music.embedUrl && (
                        <div className="embed-player">
                          <iframe
                            width="380"
                            height="200"
                            src={`${music.embedUrl}?controls=1`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ borderRadius: "8px" }}
                          />
                        </div>
                      )}

                      {/* Spotify Embed */}
                      {music.sourceType === "spotify" && music.embedUrl && (
                        <div className="embed-player">
                          <iframe
                            width="380"
                            height="90"
                            src={`${music.embedUrl}?theme=0`}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ borderRadius: "8px" }}
                          />
                        </div>
                      )}

                      {/* SoundCloud or other links */}
                      {music.sourceType === "soundcloud" && music.embedUrl && (
                        <a
                          href={music.embedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link-btn"
                          style={{
                            color: "#fff",
                            background: "#2a2a2a",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontSize: "0.85rem",
                            display: "inline-block",
                          }}
                        >
                          Play on SoundCloud ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`page-number ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Music Modal */}
      <AddMusicModal
        isOpen={isAddMusicModalOpen}
        onClose={() => setIsAddMusicModalOpen(false)}
        onSubmit={() => {
          fetchMusic();
          setCurrentPage(1);
        }}
      />

      {/* Vote Modal */}
      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => {
          setIsVoteModalOpen(false);
          setSelectedMusic(null);
          setCurrentUserVote(undefined);
        }}
        musicId={selectedMusic?.id || ""}
        musicTitle={selectedMusic?.title || ""}
        musicArtist={selectedMusic?.artist || ""}
        votes={selectedMusic?.votes || []}
        currentUserVote={currentUserVote}
        onVoteSuccess={() => {
          fetchMusic();
        }}
      />
    </>
  );
};

export default Rating;
