import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Waifu from "./pages/Waifu";
import ChangeUser from "./components/ChangeUser";
import Loader from "./components/Loader";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      const { data, error } = await supabase.from("users").select("*");
      console.log("Supabase Test:", { data, error });
    };
    testConnection();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/waifu" element={<Waifu />} />
        <Route path="/change-user" element={<ChangeUser />} />
        <Route
          path="/tierlist"
          element={<div>Tierlist Page (Coming Soon)</div>}
        />
        <Route path="/rating" element={<div>Rating Page (Coming Soon)</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
