import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import MobileNavbar from "./MobileNavbar";
import WaifuSearchbar from "./Searchbar";
import AddUserModal from "./AddUserModal";
import { supabase } from "../lib/supabase";
import type { User } from "../lib/supabase";
import zynexeProfile from "../assets/zynexe-profile-pic.jpg";
import "../styles/ChangeUser.css";

const ChangeUser = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);

  const usersPerPage = 12;

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddUser = async (data: {
    name: string;
    role: string;
    image: File | null;
  }) => {
    try {
      let avatar_url = null;

      // Upload image if provided
      if (data.image) {
        avatar_url = await uploadAvatar(data.image);
        if (!avatar_url) return; // Upload failed
      }

      // Insert user into database
      const { error } = await supabase
        .from("users")
        .insert([{ name: data.name, role: data.role, avatar_url }]);

      if (error) throw error;

      alert("User added successfully!");
      fetchUsers();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user");
    }
  };

  const handleEditUser = async (data: {
    name: string;
    role: string;
    image: File | null;
  }) => {
    if (!selectedUser) return;

    try {
      let avatar_url = selectedUser.avatar_url;

      // Upload new image if provided
      if (data.image) {
        // Delete old image if exists
        if (selectedUser.avatar_url) {
          const oldPath = selectedUser.avatar_url.split("/").pop();
          if (oldPath) {
            await supabase.storage
              .from("avatars")
              .remove([`avatars/${oldPath}`]);
          }
        }

        avatar_url = await uploadAvatar(data.image);
        if (!avatar_url) return;
      }

      // Update user in database
      const { error } = await supabase
        .from("users")
        .update({ name: data.name, role: data.role, avatar_url })
        .eq("id", selectedUser.id);

      if (error) throw error;

      alert("User updated successfully!");
      fetchUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string, avatarUrl: string | null) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      // Delete avatar from storage if exists
      if (avatarUrl) {
        const filePath = avatarUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([filePath]);
      }

      // Delete user from database
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      alert("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleSelectUser = (user: User) => {
    // Store selected user in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Navigate back to home
    navigate("/");
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="change-user-page">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p>Loading users...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="change-user-page">
        <header className="change-user-header">
          <div className="header-left">
            <h1>Change User</h1>
            <p className="subtitle">Please select, add, edit, or delete user</p>
          </div>
          <div className="header-right">
            <WaifuSearchbar
              placeholder="Search for member..."
              onSearch={handleSearch}
            />
            <button
              className="add-user-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add
            </button>
          </div>
        </header>

        <main className="users-content">
          {currentUsers.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}
            >
              <p>No users found. Click "Add" to create your first user!</p>
            </div>
          ) : (
            <>
              <div className="users-grid">
                {currentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-card"
                    onMouseEnter={() => setHoveredUser(user.id)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    <img
                      src={user.avatar_url || zynexeProfile}
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
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() =>
                            handleDeleteUser(user.id, user.avatar_url)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
              )}
            </>
          )}
        </main>

        {uploading && (
          <div className="uploading-overlay">
            <p>Uploading image...</p>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <AddUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleEditUser}
        editMode={true}
        initialData={
          selectedUser
            ? {
                id: selectedUser.id,
                name: selectedUser.name,
                role: selectedUser.role,
                avatar_url: selectedUser.avatar_url,
                is_supporter: selectedUser.is_supporter, // Pass supporter status
              }
            : undefined
        }
      />
    </>
  );
};

export default ChangeUser;
