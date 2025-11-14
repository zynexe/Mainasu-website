import { useState, useEffect, useRef } from "react";
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
import deleteIcon from "../assets/delete.svg";

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
  const [inspectPhoto, setInspectPhoto] = useState<Photo | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const photosPerPage = 12;

  // CDN Configuration
  const CDN_URL = "https://cdn.mainasu.my.id";
  const USE_CDN = true; // Set to false to disable CDN

  // Helper function to convert Supabase URL to CDN URL
  const getCDNImageUrl = (
    supabaseUrl: string,
    size: "thumbnail" | "medium" | "full" = "thumbnail"
  ): string => {
    if (!USE_CDN || !supabaseUrl) return supabaseUrl;

    // Size configurations
    const sizes = {
      thumbnail: 600, // For gallery grid
      medium: 1280, // For inspect modal
      full: 1920, // For download (if needed)
    };

    try {
      // Parse Supabase URL to extract bucket and path
      const url = new URL(supabaseUrl);
      const pathParts = url.pathname.split("/");

      // Find 'public' in path to locate bucket name
      // Example: /storage/v1/object/public/gallery-photos/user-id/category/image.jpg
      const publicIndex = pathParts.indexOf("public");

      if (publicIndex === -1 || publicIndex >= pathParts.length - 2) {
        console.warn("Invalid Supabase URL format:", supabaseUrl);
        return supabaseUrl; // Return original if format is wrong
      }

      // Extract bucket name (comes right after 'public')
      const bucketName = pathParts[publicIndex + 1];

      // Extract image path (everything after bucket name)
      const imagePath = pathParts.slice(publicIndex + 2).join("/");

      if (!bucketName || !imagePath) {
        console.warn("Missing bucket or path:", { bucketName, imagePath });
        return supabaseUrl;
      }

      // Return CDN URL with bucket name included
      return `${CDN_URL}/${bucketName}/${imagePath}?width=${sizes[size]}&quality=80`;
    } catch (error) {
      console.error("Error parsing Supabase URL:", error);
      return supabaseUrl; // Return original on error
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    fetchPhotos();
  }, [selectedCategory]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);

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
      const uploadPromises = data.files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/${data.category}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery-photos")
          .upload(filePath, file, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("gallery-photos")
          .getPublicUrl(filePath);

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
      const urlParts = imageUrl.split("/gallery-photos/");
      if (urlParts.length < 2) throw new Error("Invalid image URL");
      const filePath = urlParts[1];

      const { error: storageError } = await supabase.storage
        .from("gallery-photos")
        .remove([filePath]);

      if (storageError) throw storageError;

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

  const handleInspectPhoto = (photo: Photo) => {
    setInspectPhoto(photo);
    setIsZoomed(false);
    setZoomPosition({ x: 50, y: 50 });
  };

  const handleCloseInspect = () => {
    setInspectPhoto(null);
    setIsZoomed(false);
    setZoomPosition({ x: 50, y: 50 });
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isZoomed) {
      // Only allow zoom IN on click
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
      setIsZoomed(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed && imageRef.current) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Calculate new position (inverted for natural movement)
      const newX = Math.max(0, Math.min(100, zoomPosition.x - deltaX / 10));
      const newY = Math.max(0, Math.min(100, zoomPosition.y - deltaY / 10));

      setZoomPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isZoomed) {
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && isZoomed && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      const newX = Math.max(0, Math.min(100, zoomPosition.x - deltaX / 8));
      const newY = Math.max(0, Math.min(100, zoomPosition.y - deltaY / 8));

      setZoomPosition({ x: newX, y: newY });
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Double tap to zoom on mobile
  let lastTap = 0;
  const handleDoubleTap = (e: React.TouchEvent<HTMLImageElement>) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (!isZoomed) {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
        setIsZoomed(true);
      } else {
        setIsZoomed(false);
        setZoomPosition({ x: 50, y: 50 });
      }
    }
    lastTap = currentTime;
  };

  const filteredPhotos = photos.filter(
    (photo) => photo.category === selectedCategory
  );

  const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const currentPhotos = filteredPhotos.slice(
    startIndex,
    startIndex + photosPerPage
  );

  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  const LazyImage = ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: any;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (!imgRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: "50px" }
      );

      observer.observe(imgRef.current);

      return () => observer.disconnect();
    }, []);

    return (
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s",
          backgroundColor: "#1a1a1a",
        }}
        {...props}
      />
    );
  };

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="gallery-page">
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

        <main className="gallery-content">
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

          <div className="mobile-category-tabs">
            <div className="tabs-container">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`tab-item ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <img
                    src={category.icon}
                    alt={category.label}
                    className="tab-icon"
                  />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

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
                      <div
                        className="photo-image-wrapper"
                        onClick={() => handleInspectPhoto(photo)} // ✅ Click handler here
                      >
                        <LazyImage
                          src={getCDNImageUrl(photo.image_url, "thumbnail")}
                          alt="Gallery photo"
                        />
                      </div>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id, photo.image_url);
                            }}
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

      {/* Inspect Photo Modal */}
      {inspectPhoto && (
        <div
          className="inspect-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseInspect();
            }
          }}
        >
          <div
            className="inspect-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="inspect-close-btn" onClick={handleCloseInspect}>
              ✕
            </button>

            {/* Zoom indicator */}
            {!isZoomed && (
              <div className="zoom-hint">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" />
                  <path d="M11 8v6M8 11h6" strokeWidth="2" />
                </svg>
                <span>Click to zoom</span>
              </div>
            )}

            <div
              className={`inspect-image-container ${isZoomed ? "zoomed" : ""} ${
                isDragging ? "dragging" : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                ref={imageRef}
                src={getCDNImageUrl(inspectPhoto.image_url, "medium")}
                alt="Inspected photo"
                className="inspect-image"
                onClick={handleImageClick}
                onTouchEnd={handleDoubleTap}
                style={
                  isZoomed
                    ? {
                        cursor: isDragging ? "grabbing" : "grab",
                        transform: `scale(2.5)`,
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : {
                        cursor: "zoom-in",
                      }
                }
                draggable={false}
              />
            </div>

            <div className="inspect-info">
              <span className="inspect-uploader">
                Uploaded by {inspectPhoto.uploader_name}
              </span>
              <span className="inspect-date">
                {new Date(inspectPhoto.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Zoom controls for mobile */}
            {isZoomed && (
              <div className="zoom-controls">
                <button
                  className="zoom-out-btn"
                  onClick={() => {
                    setIsZoomed(false);
                    setZoomPosition({ x: 50, y: 50 });
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" strokeWidth="2" />
                    <path d="M8 11h6" strokeWidth="2" />
                  </svg>
                  Zoom Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
