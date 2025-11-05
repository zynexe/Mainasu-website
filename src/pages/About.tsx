import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import "../styles/About.css";
import logo from "../assets/logo.png";
import zynexe from "../assets/zynexe-profile-pic.jpg";
import founder from "../assets/founder.webp";
import personIcon from "../assets/Founder2.webp";
import reactIcon from "../assets/react.svg";
import viteIcon from "../assets/vite-icon.webp";
import supabaseIcon from "../assets/supabase-icon.webp";
import cssIcon from "../assets/css3-icon.webp";
import vercelIcon from "../assets/vercel-icon.webp";
import caffeineIcon from "../assets/caffeine-icon.webp";
import { supabase } from "../lib/supabase";
import type { User } from "../lib/supabase";

interface WaifuItem {
  id: string;
  name: string;
  role: string;
  image_url: string;
  user_id: string;
}

interface MemberWithWaifus extends User {
  waifus: WaifuItem[];
}

const About = () => {
  const [members, setMembers] = useState<MemberWithWaifus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembersAndWaifus();
  }, []);

  const fetchMembersAndWaifus = async () => {
    try {
      setLoading(true);

      // Fetch all users - oldest to newest
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

      if (usersError) throw usersError;

      // Fetch all waifus
      const { data: waifusData, error: waifusError } = await supabase
        .from("waifus")
        .select("*")
        .order("created_at", { ascending: true });

      if (waifusError) throw waifusError;

      // Combine users with their waifus
      const membersWithWaifus: MemberWithWaifus[] = (usersData || []).map(
        (user) => ({
          ...user,
          waifus: (waifusData || []).filter(
            (waifu) => waifu.user_id === user.id
          ),
        })
      );

      setMembers(membersWithWaifus);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="about-page">
        <Navbar />
        <main className="about-content">
          <div style={{ textAlign: "center", padding: "4rem", color: "#fff" }}>
            <p>Loading members...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="about-page">
      <Navbar />
      <MobileNavbar />

      <main className="about-content">
        <div className="about-grid">
          {/* Mainasu Info Box */}
          <div className="about-box mainasu-box">
            <div className="box-header">
              <img src={logo} alt="Mainasu" className="mainasu-logo" />
              <div className="mainasu-info">
                <h2 className="mainasu-title">Mainasu</h2>
                <p className="mainasu-subtitle">Founded in 2020</p>
              </div>
            </div>
            <p className="mainasu-description">
              The name "Mainasu" came from the word "main" and "asu" which means
              "come play bitches". The name is chosen so that friends that are
              close enough to get called "asu" could play together, we belive in
              hating our own friends for a long lasting friendship and the study
              show that!
            </p>
          </div>

          {/* Members Box */}
          <div className="about-box members-box">
            <h3 className="box-title">Members</h3>
            {members.length === 0 ? (
              <p
                style={{ color: "#888", textAlign: "center", padding: "2rem" }}
              >
                No members yet. Add members in Change User page.
              </p>
            ) : (
              <div className="members-grid">
                {members.map((member) => (
                  <div key={member.id} className="about-member-item">
                    <img
                      src={member.avatar_url || logo}
                      alt={member.name}
                      className="about-member-avatar"
                    />
                    <div className="about-member-info">
                      <div className="about-member-name">{member.name}</div>
                      <div className="about-member-role">{member.role}</div>
                    </div>

                    {/* Waifu Circles */}
                    {member.waifus.length > 0 && (
                      <div className="waifu-circles">
                        {member.waifus.slice(0, 4).map((waifu, index) => (
                          <div
                            key={waifu.id}
                            className="waifu-circle"
                            style={{
                              backgroundImage: `url(${waifu.image_url})`,
                              zIndex: 4 - index,
                              right: `${index * 20}px`,
                            }}
                            title={waifu.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credit & Tech Stack Box */}
          <div className="about-box credit-box">
            <div className="credit-section">
              <h3 className="box-title">Credit</h3>

              {/* Founder 1 - Tendensius */}
              <div className="credit-item">
                <img src={founder} alt="Tendensius" className="credit-avatar" />
                <div className="credit-info">
                  <p className="credit-name">Tendensius</p>
                  <p className="credit-role">Founder/Content Creator</p>
                </div>
              </div>

              {/* Founder 2 - R.R. */}
              <div className="credit-item">
                <img src={personIcon} alt="R.R." className="credit-avatar" />
                <div className="credit-info">
                  <p className="credit-name">R.R.</p>
                  <p className="credit-role">Founder/Game Developer</p>
                </div>
              </div>

              {/* Web Designer/Developer - Zynexe */}
              <div className="credit-item">
                <img src={zynexe} alt="Zynexe" className="credit-avatar" />
                <div className="credit-info">
                  <p className="credit-name">Zynexe</p>
                  <p className="credit-role">Web Designer/Developer</p>
                </div>
              </div>
            </div>

            <div className="techstack-section">
              <h3 className="box-title">Tech Stack</h3>
              <div className="techstack-grid">
                <img src={reactIcon} alt="React" className="tech-icon" />
                <img src={viteIcon} alt="Vite" className="tech-icon" />
                <img src={supabaseIcon} alt="Supabase" className="tech-icon" />
                <img src={cssIcon} alt="CSS" className="tech-icon" />
                <img src={vercelIcon} alt="Vercel" className="tech-icon" />
                <img src={caffeineIcon} alt="Caffeine" className="tech-icon" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
