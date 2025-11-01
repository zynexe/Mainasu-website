import Navbar from '../components/Navbar';
import '../styles/About.css';
import logo from '../assets/logo.png';
import zynexe from '../assets/zynexe-profile-pic.jpg';
import reactIcon from '../assets/react.svg';
import viteIcon from '../assets/vite-icon.webp';
import supabaseIcon from '../assets/supabase-icon.webp';
import cssIcon from '../assets/css3-icon.webp';
import vercelIcon from '../assets/vercel-icon.webp';
import caffeineIcon from '../assets/caffeine-icon.webp';

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      
      <main className="about-content">
        <div className="about-grid">
          {/* Mainasu Info Box */}
          <div className="about-box mainasu-box">
            <div className="box-header">
              <img src={logo} alt="Mainasu" className="mainasu-logo" />
              <div className="mainasu-info">
                <h2 className="mainasu-title">Mainasu</h2>
                <p className="mainasu-subtitle">Founded in 20xx</p>
              </div>
            </div>
            <p className="mainasu-description">
              The name "Mainasu" came from the word "main" and "asu" which means 
              "come play shitheads". The name is chosen so that friends that are close 
              enough to get called "asu" could play together, we belive in hating our own 
              friends for a long lasting friendship and the study show that!
            </p>
          </div>

          {/* Members Box */}
          <div className="about-box members-box">
            <h3 className="box-title">Members</h3>
            <div className="members-grid">
              <div className="member-item featured">
                <img src={zynexe} alt="Zynexe" className="member-avatar" />
                <div className="member-info">
                  <p className="member-name">Zynexe</p>
                  <p className="member-role">Web Designer/Developer</p>
                </div>
              </div>
              
              {[...Array(9)].map((_, i) => (
                <div key={i} className="member-item">
                  <img src={logo} alt="Other" className="member-avatar default" />
                  <div className="member-info">
                    <p className="member-name">Other</p>
                    <p className="member-role">Web Designer/Developer</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit & Tech Stack Box */}
          <div className="about-box credit-box">
            <div className="credit-section">
              <h3 className="box-title">Credit</h3>
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