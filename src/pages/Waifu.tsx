import { useState } from "react";
import Navbar from "../components/Navbar";
import WaifuSearchbar from "../components/Searchbar";
import AddWaifuModal from "../components/WaifuModal";
import zynexeProfile from "../assets/zynexe-profile-pic.jpg";
import addIcon from "../assets/add-icon.webp";
import "../styles/Waifu.css";

interface WaifuItem {
  id: string;
  name: string;
  role: string;
  image: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  waifus: WaifuItem[];
  maxWaifus: number;
}

const Waifu = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [editingWaifu, setEditingWaifu] = useState<{
    memberId: string;
    waifuId: string;
  } | null>(null);

  const membersPerPage = 5;

  // Mock data - replace with backend data later
  const [members] = useState<Member[]>([
    {
      id: "1",
      name: "Zynexe",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
      waifus: [
        { id: "1", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "2", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "3", name: "Karina", role: "aespa", image: zynexeProfile },
      ],
      maxWaifus: 4,
    },
    {
      id: "2",
      name: "Other",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
      waifus: [
        { id: "1", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "2", name: "Karina", role: "aespa", image: zynexeProfile },
      ],
      maxWaifus: 4,
    },
    {
      id: "3",
      name: "Other",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
      waifus: [
        { id: "1", name: "Karina", role: "aespa", image: zynexeProfile },
      ],
      maxWaifus: 4,
    },
    {
      id: "4",
      name: "Other",
      role: "Web Designer/Developer",
      avatar: zynexeProfile,
      waifus: [
        { id: "1", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "2", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "3", name: "Karina", role: "aespa", image: zynexeProfile },
        { id: "4", name: "Karina", role: "aespa", image: zynexeProfile },
      ],
      maxWaifus: 4,
    },
  ]);

  const totalPages = Math.ceil(members.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const currentMembers = members.slice(startIndex, startIndex + membersPerPage);

  const handleAddWaifu = (memberId: string) => {
    setSelectedMember(memberId);
    setEditingWaifu(null);
    setIsModalOpen(true);
  };

  const handleEditWaifu = (memberId: string, waifuId: string) => {
    setSelectedMember(memberId);
    setEditingWaifu({ memberId, waifuId });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: {
    name: string;
    role: string;
    image: File;
  }) => {
    console.log("Submitted:", data);
    // Handle submission logic here
  };

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
              following the Islamic teaching
            </p>
          </div>
          <div className="header-right">
            <WaifuSearchbar placeholder="Search for member or waifu..." />
          </div>
        </header>

        <main className="waifu-content">
          {currentMembers.map((member) => (
            <div key={member.id} className="member-section">
              <div className="member-info">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="member-avatar"
                />
                <div className="member-details">
                  <h3>{member.name}</h3>
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
                    onClick={() => handleEditWaifu(member.id, waifu.id)}
                  >
                    <img src={waifu.image} alt={waifu.name} />
                    <div className="waifu-info">
                      <h4>{waifu.name}</h4>
                      <p>{waifu.role}</p>
                    </div>
                    <div className="edit-overlay">
                      <span>Click to edit</span>
                    </div>
                  </div>
                ))}

                {member.waifus.length < member.maxWaifus && (
                  <div
                    className="add-waifu-card"
                    onClick={() => handleAddWaifu(member.id)}
                  >
                    <img src={addIcon} alt="Add" className="add-icon" />
                    <div className="add-text">
                      <h4>Add Mybini</h4>
                      <p>
                        Max 500kb(png/jpg)
                        <br />
                        {member.maxWaifus - member.waifus.length} slots left
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

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

        <AddWaifuModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          editMode={!!editingWaifu}
        />
      </div>
    </>
  );
};

export default Waifu;
