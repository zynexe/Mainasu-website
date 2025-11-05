import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WaifuSearchbar from "../components/Searchbar";
import AddWaifuModal from "../components/WaifuModal";
import { supabase } from "../lib/supabase";
import type { User } from "../lib/supabase";
import addIcon from "../assets/add-icon.webp";
import "../styles/Waifu.css";

interface WaifuItem {
  id: string;
  name: string;
  role: string;
  image_url: string;
  user_id: string;
}

interface MemberWithWaifus extends User {
  waifus: WaifuItem[];
  maxWaifus: number;
}

const Waifu = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingWaifu, setEditingWaifu] = useState<WaifuItem | null>(null);
  const [members, setMembers] = useState<MemberWithWaifus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const membersPerPage = 5;
  const maxWaifusPerMember = 4;

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    fetchMembersAndWaifus();
  }, []);

  const fetchMembersAndWaifus = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch all waifus
      const { data: waifusData, error: waifusError } = await supabase
        .from("waifus")
        .select("*")
        .order("created_at", { ascending: false });

      if (waifusError) throw waifusError;

      // Combine users with their waifus
      const membersWithWaifus: MemberWithWaifus[] = (usersData || []).map(
        (user) => ({
          ...user,
          waifus: (waifusData || []).filter(
            (waifu) => waifu.user_id === user.id
          ),
          maxWaifus: maxWaifusPerMember,
        })
      );

      setMembers(membersWithWaifus);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load members and waifus");
    } finally {
      setLoading(false);
    }
  };

  const uploadWaifuImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("waifus")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("waifus").getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading waifu image:", error);
      alert(`Failed to upload image: ${error.message || "Unknown error"}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddWaifu = () => {
    if (!currentUser) {
      alert("Please select a user first from Change User page");
      return;
    }
    setEditingWaifu(null);
    setIsModalOpen(true);
  };

  const handleEditWaifu = (waifu: WaifuItem) => {
    if (!currentUser || waifu.user_id !== currentUser.id) {
      alert("You can only edit your own waifus");
      return;
    }
    setEditingWaifu(waifu);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: {
    name: string;
    role: string;
    image: File | null;
  }) => {
    if (!currentUser) return;

    try {
      if (editingWaifu) {
        // EDIT MODE
        let image_url = editingWaifu.image_url;

        // Upload new image if provided
        if (data.image) {
          // Delete old image
          const oldFileName = editingWaifu.image_url.split("/").pop();
          if (oldFileName) {
            await supabase.storage.from("waifus").remove([oldFileName]);
          }

          const uploadedUrl = await uploadWaifuImage(data.image);
          if (!uploadedUrl) return; // Exit if upload failed
          image_url = uploadedUrl; // ✅ Now TypeScript knows it's not null
        }

        // Update waifu in database
        const { error } = await supabase
          .from("waifus")
          .update({ name: data.name, role: data.role, image_url })
          .eq("id", editingWaifu.id);

        if (error) throw error;

        alert("Waifu updated successfully!");
      } else {
        // ADD MODE
        if (!data.image) {
          alert("Please upload an image");
          return;
        }

        const uploadedUrl = await uploadWaifuImage(data.image);
        if (!uploadedUrl) return; // Exit if upload failed

        const image_url = uploadedUrl; // ✅ Now TypeScript knows it's not null

        // Insert new waifu
        const { error } = await supabase.from("waifus").insert([
          {
            user_id: currentUser.id,
            name: data.name,
            role: data.role,
            image_url,
          },
        ]);

        if (error) throw error;

        alert("Waifu added successfully!");
      }

      fetchMembersAndWaifus();
      setIsModalOpen(false);
      setEditingWaifu(null);
    } catch (error) {
      console.error("Error saving waifu:", error);
      alert("Failed to save waifu");
    }
  };

  const handleDeleteWaifu = async (waifu: WaifuItem) => {
    if (!currentUser || waifu.user_id !== currentUser.id) {
      alert("You can only delete your own waifus");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${waifu.name}?`
    );

    if (!confirmed) return;

    try {
      // Delete image from storage
      const fileName = waifu.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("waifus").remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from("waifus")
        .delete()
        .eq("id", waifu.id);

      if (error) throw error;

      alert("Waifu deleted successfully!");
      fetchMembersAndWaifus();
    } catch (error) {
      console.error("Error deleting waifu:", error);
      alert("Failed to delete waifu");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Filter members based on search
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.waifus.some(
        (waifu) =>
          waifu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          waifu.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const currentMembers = filteredMembers.slice(
    startIndex,
    startIndex + membersPerPage
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="waifu-page">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p>Loading members and waifus...</p>
          </div>
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <div className="waifu-page">
          <div
            style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}
          >
            <h2>No User Selected</h2>
            <p>Please select a user from the Change User page first.</p>
            <button
              onClick={() => navigate("/change-user")}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Go to Change User
            </button>
          </div>
        </div>
      </>
    );
  }

  if (members.length === 0) {
    return (
      <>
        <Navbar />
        <div className="waifu-page">
          <div
            style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}
          >
            <h2>No members found</h2>
            <p>Please add members in the Change User page first.</p>
            <button
              onClick={() => navigate("/change-user")}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Go to Change User
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="waifu-page">
        <header className="waifu-header">
          <div className="header-left">
            <h1>Waifu</h1>
            <p className="subtitle">
              Claim your own waifu,{" "}
              <span className="highlight">maximum 4 waifu per member</span>{" "}
              "karbit" not allowed especially for faiz.
            </p>
          </div>
          <div className="header-right">
            <WaifuSearchbar
              placeholder="Search for member or waifu..."
              onSearch={handleSearch}
            />
          </div>
        </header>

        <main className="waifu-content">
          {currentMembers.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}
            >
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              {currentMembers.map((member) => {
                // Check if this member is the current user
                const isCurrentUser =
                  currentUser && member.id === currentUser.id;

                return (
                  <div key={member.id} className="member-section">
                    <div className="member-info">
                      <img
                        src={member.avatar_url || "/default-avatar.png"}
                        alt={member.name}
                        className="member-avatar"
                      />
                      <div className="member-details">
                        <h3>
                          {member.name}
                          {isCurrentUser && (
                            <span
                              style={{
                                marginLeft: "0.5rem",
                                padding: "0.25rem 0.5rem",
                                background: "#3b82f6",
                                color: "#fff",
                                fontSize: "0.75rem",
                                borderRadius: "4px",
                                fontWeight: "500",
                              }}
                            >
                              You
                            </span>
                          )}
                        </h3>
                        <p>{member.role}</p>
                      </div>
                      <div className="waifu-count">
                        {member.waifus.length} of {member.maxWaifus}{" "}
                        <span className="count-label">Mybini Claimed</span>
                      </div>
                    </div>

                    <div className="waifu-grid">
                      {member.waifus.map((waifu) => (
                        <div
                          key={waifu.id}
                          className="waifu-card"
                          onClick={() =>
                            isCurrentUser && handleEditWaifu(waifu)
                          }
                          style={{
                            cursor: isCurrentUser ? "pointer" : "default",
                            opacity: isCurrentUser ? 1 : 0.7,
                          }}
                        >
                          <img src={waifu.image_url} alt={waifu.name} />
                          <div className="waifu-info">
                            <h4>{waifu.name}</h4>
                            <p>{waifu.role}</p>
                          </div>
                          {isCurrentUser && (
                            <div className="edit-overlay">
                              <span>Click to edit</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Only show Add button for current user if they haven't reached max */}
                      {isCurrentUser &&
                        member.waifus.length < member.maxWaifus && (
                          <div
                            className="add-waifu-card"
                            onClick={handleAddWaifu}
                          >
                            <img src={addIcon} alt="Add" className="add-icon" />
                            <div className="add-text">
                              <h4>Add Mybini</h4>
                              <p>
                                Max 500KB (png/jpg)
                                <br />
                                {member.maxWaifus - member.waifus.length} slots
                                left
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}

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

      <AddWaifuModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWaifu(null);
        }}
        onSubmit={handleModalSubmit}
        onDelete={
          editingWaifu ? () => handleDeleteWaifu(editingWaifu) : undefined
        }
        editMode={!!editingWaifu}
        initialData={
          editingWaifu
            ? {
                name: editingWaifu.name,
                role: editingWaifu.role,
                image: editingWaifu.image_url,
              }
            : undefined
        }
      />
    </>
  );
};

export default Waifu;
