import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Waifu from "./pages/Waifu";
import ChangeUser from "./components/ChangeUser";
import Loader from "./components/Loader";
import "./App.css";
import Rating from "./pages/Rating";
import Gallery from "./pages/Gallery";

function App() {
  const [loading, setLoading] = useState(true);

  const handleLoaderComplete = () => {
    setLoading(false);
  };

  if (loading) {
    return <Loader onComplete={handleLoaderComplete} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/waifu" element={<Waifu />} />
        <Route path="/change-user" element={<ChangeUser />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/Rating" element={<Rating />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
