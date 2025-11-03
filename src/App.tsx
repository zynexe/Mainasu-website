import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Loader from "./components/Loader";
import Home from "./pages/Home";
import About from "./pages/About";
import Waifu from "./pages/Waifu";
import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="app">
      {isLoading ? (
        <Loader onComplete={handleLoadComplete} />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/tierlist"
              element={<div>Tierlist Page (Coming Soon)</div>}
            />
            <Route path="/waifu" element={<Waifu />} />
            <Route
              path="/rating"
              element={<div>Rating Page (Coming Soon)</div>}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
