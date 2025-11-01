import { useState } from 'react';
import Loader from './components/Loader';
import Home from './pages/Home';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="app">
      {isLoading && <Loader onComplete={handleLoadComplete} />}
      {!isLoading && <Home />}
    </div>
  );
}

export default App;
