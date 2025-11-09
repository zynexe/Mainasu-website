import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";
import personIcon from "../assets/person.png";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleChangeUser = () => {
    setIsDropdownOpen(false);
    navigate("/change-user");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="page-navbar">
      <div className="page-navbar-container">
        <div className="page-navbar-logo" onClick={() => navigate("/")}>
          <img src={logo} alt="Mainasu Logo" className="page-logo-icon" />
          <span className="page-logo-text">Mainasu</span>
        </div>

        <div className="page-navbar-center">
          <div className="page-navbar-links">
            <Link
              to="/gallery"
              className={`page-nav-link ${
                isActive("/gallery") ? "active" : ""
              }`}
            >
              Gallery
            </Link>
            <Link
              to="/waifu"
              className={`page-nav-link ${isActive("/waifu") ? "active" : ""}`}
            >
              Waifu
            </Link>
            <Link
              to="/rating"
              className={`page-nav-link ${isActive("/rating") ? "active" : ""}`}
            >
              Rating
            </Link>
            <Link
              to="/about"
              className={`page-nav-link ${isActive("/about") ? "active" : ""}`}
            >
              About
            </Link>
          </div>
        </div>

        <div className="page-navbar-profile">
          <button
            className="page-profile-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <img
              src={currentUser?.avatar_url || personIcon}
              alt="Profile"
              className="page-profile-icon"
            />
            <span className="page-username">
              {currentUser?.name || "Guest"}
            </span>
            <svg
              className={`page-dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="page-dropdown-menu">
              <button className="page-dropdown-item" onClick={handleChangeUser}>
                Change User
              </button>
              <button
                className="page-dropdown-item danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
