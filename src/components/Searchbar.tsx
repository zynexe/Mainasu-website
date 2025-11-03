import { Search } from "lucide-react";
import "../styles/Waifu.css";

interface WaifuSearchbarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

const WaifuSearchbar: React.FC<WaifuSearchbarProps> = ({
  placeholder = "Search for member or waifu...",
  onSearch,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="waifu-searchbar">
      <Search className="search-icon" size={20} />
      <input
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        className="search-input"
      />
    </div>
  );
};

export default WaifuSearchbar;
