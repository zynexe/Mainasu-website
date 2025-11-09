import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import AddPhotosModal from "../components/AddPhotosModal";
import "../styles/Gallery.css";

// Import category icons
import jalanIcon from "../assets/jalan.svg";
import vaultIcon from "../assets/vault.svg";
import foodIcon from "../assets/food.svg";
import gameIcon from "../assets/game.svg";
import catIcon from "../assets/cat.svg";
import randomIcon from "../assets/random.svg";
import deleteIcon from "../assets/delete.svg"; // Add this

interface Photo {
  id: string;
  image_url: string;
  category: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  label: string;
}

const categories: Category[] = [
  { id: "jalan", name: "Jalan-Jalan", icon: jalanIcon, label: "Jalan-Jalan" },
  {
    id: "vault",
    name: "Arsip Nasional",
    icon: vaultIcon,
    label: "Arsip Nasional",
  },
  { id: "food", name: "Food", icon: foodIcon, label: "Food" },
  { id: "game", name: "Game", icon: gameIcon, label: "Game" },
  { id: "animals", name: "Animals", icon: catIcon, label: "Animals" },
  { id: "random", name: "Random", icon: randomIcon, label: "Random" },
];

const Gallery = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("jalan");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const photosPerPage = 12;

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    fetchPhotos();
  }, [selectedCategory]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);

      // Fetch photos with uploader info
      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select(
          `
          id,
          image_url,
          category,
          uploaded_by,
          created_at,
          uploader:uploaded_by (
            id,
            name,
            avatar_url
          )
        `
        )
        .eq("category", selectedCategory)
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;

      // Transform data
      const transformedPhotos: Photo[] = (photosData || []).map(
        (photo: any) => ({
          id: photo.id,
          image_url: photo.image_url,
          category: photo.category,
          uploaded_by: photo.uploaded_by,
          uploader_name: photo.uploader?.name || "Unknown",
          uploader_avatar: photo.uploader?.avatar_url || "",
          created_at: photo.created_at,
        })
      );

      setPhotos(transformedPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      alert("Failed to load photos. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleAddPhotos = () => {
    if (!currentUser) {
      alert("Please select a user first from Change User page");
      navigate("/change-user");
      return;
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: {
    category: string;
    files: File[];
  }) => {
    if (!currentUser) {
      alert("Please select a user first");
      return;
    }

    try {
      // Upload each file
      const uploadPromises = data.files.map(async (file) => {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/${data.category}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("gallery-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("gallery-photos")
          .getPublicUrl(filePath);

        // Insert photo record into database
        const { error: dbError } = await supabase.from("photos").insert({
          image_url: urlData.publicUrl,
          category: data.category,
          uploaded_by: currentUser.id,
        });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      alert(
        `Successfully uploaded ${data.files.length} photo${
          data.files.length !== 1 ? "s" : ""
        }!`
      );
      setIsModalOpen(false);

      // Refresh photos if the uploaded category matches selected category
      if (data.category === selectedCategory) {
        fetchPhotos();
      }
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      alert(`Failed to upload photos: ${error.message}`);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    if (!currentUser) {
      alert("Please select a user first");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this photo?"
    );
    if (!confirmDelete) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split("/gallery-photos/");
      if (urlParts.length < 2) throw new Error("Invalid image URL");
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("gallery-photos")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId)
        .eq("uploaded_by", currentUser.id);

      if (dbError) throw dbError;

      alert("Photo deleted successfully!");
      fetchPhotos();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      alert(`Failed to delete photo: ${error.message}`);
    }
  };

  // Filter photos by selected category
  const filteredPhotos = photos.filter(
    (photo) => photo.category === selectedCategory
  );

  // Pagination
  const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const currentPhotos = filteredPhotos.slice(
    startIndex,
    startIndex + photosPerPage
  );

  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="gallery-page">
        {/* Categories Sidebar - Now with back button */}
        <aside className="categories-sidebar">
          <div className="sidebar-header">
            <h2>Categories</h2>
          </div>
          <nav className="categories-nav">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-item ${
                  selectedCategory === category.id ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <img
                  src={category.icon}
                  alt={category.label}
                  className="category-icon"
                />
                <span>{category.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="gallery-content">
          {/* Header */}
          <div className="gallery-header">
            <div className="header-left">
              <h1>{selectedCategoryData?.label || "Gallery"}</h1>
              <p className="photo-count">
                {filteredPhotos.length} photo
                {filteredPhotos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button className="add-photos-btn" onClick={handleAddPhotos}>
              <span className="add-photo-icon">+</span>
              Add Photos
            </button>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="loading-state">
              <p>Loading photos...</p>
            </div>
          ) : currentPhotos.length === 0 ? (
            <div className="empty-state">
              <p>No photos in this category yet.</p>
              <p className="empty-subtitle">
                Be the first to upload some photos!
              </p>
              <button className="empty-add-btn" onClick={handleAddPhotos}>
                Add Photos
              </button>
            </div>
          ) : (
            <>
              <div className="masonry-grid">
                {currentPhotos.map((photo) => {
                  const canDelete =
                    currentUser && currentUser.id === photo.uploaded_by;

                  return (
                    <div key={photo.id} className="photo-card">
                      <img src={photo.image_url} alt="Gallery photo" />
                      <div className="photo-overlay">
                        <div className="uploader-info">
                          <span className="uploaded-by-label">uploaded by</span>
                          <span className="uploader-name">
                            {photo.uploader_name}
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            className="delete-photo-btn"
                            onClick={() =>
                              handleDeletePhoto(photo.id, photo.image_url)
                            }
                            title="Delete photo"
                          >
                            <img
                              src={deleteIcon}
                              alt="Delete"
                              className="delete-icon"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
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
      </div>

      <AddPhotosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        categories={categories}
      />
    </>
  );
};

export default Gallery;
