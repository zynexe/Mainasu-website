import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WaifuSearchbar from "./Searchbar";
import zynexeProfile from "../assets/zynexe-profile-pic.jpg";
import "../styles/ChangeUser.css";

interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

const ChangeUser = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const usersPerPage = 12; // 3 columns x 4 rows

  // Mock data - replace with Supabase data later
  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "2",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "3",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "4",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "5",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "6",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "7",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "8",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
    {
      id: "9",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
    },
  ]);

  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = users.slice(startIndex, startIndex + usersPerPage);

  const handleSelectUser = (user: User) => {
    // Store selected user in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Navigate back to home
    navigate("/");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (confirmed) {
      console.log("Delete user:", userId);
      // Handle delete logic here
    }
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="change-user-page">
        <header className="change-user-header">
          <div className="header-left">
            <h1>Change User</h1>
            <p className="subtitle">Please select, add, edit, or delete user</p>
          </div>
          <div className="header-right">
            <WaifuSearchbar placeholder="Search for member..." />
            <button className="add-user-btn" onClick={handleAddUser}>
              Add
            </button>
          </div>
        </header>

        <main className="users-content">
          <div className="users-grid">
            {currentUsers.map((user) => (
              <div
                key={user.id}
                className="user-card"
                onMouseEnter={() => setHoveredUser(user.id)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-avatar"
                />
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>{user.role}</p>
                </div>

                {hoveredUser === user.id && (
                  <div className="user-actions">
                    <button
                      className="action-btn select-btn"
                      onClick={() => handleSelectUser(user)}
                    >
                      Select
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              className="page-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default ChangeUser;
