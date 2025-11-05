import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import "../styles/Rating.css";
import personIcon from "../assets/person.png";

interface MusicRating {
  id: string;
  title: string;
  artist: string;
  avgRating: number;
  votes: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
  }>;
  audioUrl: string;
  duration: string;
}

const Rating = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [musicList, setMusicList] = useState<MusicRating[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const musicPerPage = 15;

  // Dummy data for frontend
  useEffect(() => {
    const dummyData: MusicRating[] = Array.from({ length: 32 }, (_, i) => ({
      id: `music-${i + 1}`,
      title: `Music ${String.fromCharCode(65 + (i % 26))}`,
      artist: `Artist ${String.fromCharCode(65 + (i % 26))}`,
      avgRating: 4.7,
      votes: Array.from(
        { length: Math.min(4, Math.floor(Math.random() * 5) + 1) },
        (_, j) => ({
          id: `vote-${i}-${j}`,
          userId: `user-${j}`,
          userName: `User ${j + 1}`,
          userAvatar: personIcon,
          rating: 5,
        })
      ),
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "1:22/2:30",
    }));
    setMusicList(dummyData);
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

  const handleVote = (musicId: string) => {
    // TODO: Implement voting logic
    alert(`Vote button clicked for music: ${musicId}`);
  };

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
            <button className="add-music-btn">
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
                <th>Vote</th>
              </tr>
            </thead>
            <tbody>
              {currentMusic.map((music) => (
                <tr key={music.id}>
                  <td className="music-title-cell">{music.title}</td>
                  <td className="music-artist-cell">{music.artist}</td>
                  <td className="music-rating-cell">{music.avgRating}/5</td>
                  <td className="music-votes-cell">
                    <button className="votes-button">
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
                            <img src={vote.userAvatar} alt={vote.userName} />
                          </div>
                        ))}
                      </div>
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
                            <rect x="3" y="2" width="3" height="12" rx="1" />
                            <rect x="10" y="2" width="3" height="12" rx="1" />
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
                          : "0:00"}
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
                  </td>
                  <td className="music-vote-cell">
                    <button
                      className="vote-btn"
                      onClick={() => handleVote(music.id)}
                    >
                      Vote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Fixed Position like Waifu page */}
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
    </>
  );
};

export default Rating;
