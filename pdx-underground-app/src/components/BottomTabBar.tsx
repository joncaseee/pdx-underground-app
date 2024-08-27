import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, User, PlusSquare } from "lucide-react";

const BottomTabBar: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-700 text-white p-4 flex justify-around items-center border-t-2 border-slate-600">
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/20 to-transparent"></div>
      <Link
        to="/"
        className={`text-2xl ${location.pathname === "/" ? "text-purple-400" : ""}`}
      >
        <HomeIcon size={24} />
      </Link>
      <Link
        to="/add-event"
        className={`text-2xl ${location.pathname === "/add-event" ? "text-purple-400" : ""}`}
      >
        <PlusSquare size={24} />
      </Link>
      <Link
        to="/profile"
        className={`text-2xl ${location.pathname === "/profile" ? "text-purple-400" : ""}`}
      >
        <User size={24} />
      </Link>
    </nav>
  );
};

export default BottomTabBar;