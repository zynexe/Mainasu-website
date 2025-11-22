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
  const [zoomLevel, setZoomLevel] = useState(1); // Changed from isZoomed
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch zoom state for mobile
  const [lastDistance, setLastDistance] = useState(0);

  const photosPerPage = 12;

  // CDN Configuration
  const CDN_URL = "https://cdn.mainasu.my.id";
  const USE_CDN = true;

  // Helper function to convert Supabase URL to CDN URL
  const getCDNImageUrl = (
    supabaseUrl: string,
    size: "thumbnail" | "medium" | "full" = "thumbnail"
  ): string => {
    if (!USE_CDN || !supabaseUrl) return supabaseUrl;

    // Size configurations
    const sizes = {
      thumbnail: 600,
      medium: 1280,
      full: 1920,
    };

    try {
      // Parse Supabase URL to extract bucket and path
      const url = new URL(supabaseUrl);
      const pathParts = url.pathname.split("/");

      // Find 'public' in path to locate bucket name
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
    setZoomLevel(1);
    setZoomPosition({ x: 50, y: 50 });
  };

  const handleCloseInspect = () => {
    setInspectPhoto(null);
    setZoomLevel(1);
    setZoomPosition({ x: 50, y: 50 });
    setIsDragging(false);
  };

  // Add download handler
  const handleDownloadImage = async () => {
    if (!inspectPhoto) return;

    try {
      // Get the full resolution image URL
      const imageUrl = getCDNImageUrl(inspectPhoto.image_url, "full");

      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename from original URL or use timestamp
      const originalFilename =
        inspectPhoto.image_url.split("/").pop() || "image.jpg";
      const filename = `mainasu-${inspectPhoto.category}-${originalFilename}`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image. Please try again.");
    }
  };

  // Scroll to zoom (Desktop)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(1, zoomLevel + delta), 4); // Min 1x, Max 4x

    // Calculate zoom position based on mouse position
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
    }

    setZoomLevel(newZoom);
  };

  // Mouse drag handlers (when zoomed) - UPDATED
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1 && imageRef.current) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Much slower sensitivity - inversely proportional to zoom level
      const sensitivity = 0.3 / zoomLevel; // Reduced from 10 to 0.3
      const newX = Math.max(
        0,
        Math.min(100, zoomPosition.x - deltaX * sensitivity)
      );
      const newY = Math.max(
        0,
        Math.min(100, zoomPosition.y - deltaY * sensitivity)
      );

      setZoomPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Pinch to zoom (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      setLastDistance(distance);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      // One finger - drag when zoomed
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setIsDragging(true);
    }
  };

  // Touch move handler (when zoomed) - UPDATED
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);

      if (lastDistance > 0) {
        const delta = (distance - lastDistance) * 0.01;
        const newZoom = Math.min(Math.max(1, zoomLevel + delta), 4);

        // Calculate zoom center between two fingers
        if (imageRef.current) {
          const rect = imageRef.current.getBoundingClientRect();
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const x = ((centerX - rect.left) / rect.width) * 100;
          const y = ((centerY - rect.top) / rect.height) * 100;
          setZoomPosition({ x, y });
        }

        setZoomLevel(newZoom);
      }

      setLastDistance(distance);
    } else if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
      // Drag when zoomed - UPDATED SENSITIVITY
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      // Slower sensitivity for touch - inversely proportional to zoom
      const sensitivity = 0.25 / zoomLevel; // Reduced from 8 to 0.25
      const newX = Math.max(
        0,
        Math.min(100, zoomPosition.x - deltaX * sensitivity)
      );
      const newY = Math.max(
        0,
        Math.min(100, zoomPosition.y - deltaY * sensitivity)
      );

      setZoomPosition({ x: newX, y: newY });
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setLastDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
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
        defaultCategory={selectedCategory} // ✅ Pass current category
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

            <div
              ref={containerRef}
              className={`inspect-image-container ${
                zoomLevel > 1 ? "zoomed" : ""
              } ${isDragging ? "dragging" : ""}`}
              onWheel={handleWheel}
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
                style={{
                  cursor:
                    zoomLevel > 1
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                draggable={false}
              />
            </div>

            {/* Download Button */}
            <button
              className="inspect-download-btn"
              onClick={handleDownloadImage}
              title="Download image"
            >
              <svg
                className="download-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3V16M12 16L16 12M12 16L8 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 16V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download
            </button>

            <div className="inspect-info">
              <span className="inspect-uploader">
                Uploaded by {inspectPhoto.uploader_name}
              </span>
              <span className="inspect-date">
                {new Date(inspectPhoto.created_at).toLocaleDateString()}
              </span>
              {/* Show zoom level indicator */}
              {zoomLevel > 1 && (
                <span className="zoom-indicator">
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
