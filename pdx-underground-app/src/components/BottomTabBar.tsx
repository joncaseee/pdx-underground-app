import { Link, useLocation } from "react-router-dom";

const BottomTabBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed h-20 bottom-0 left-0 right-0 bg-zinc-800 text-white p-4 flex justify-around items-center border-t-2 border-slate-600">
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/20 to-transparent"></div>
      <Link
        to="/"
        className={`text-2xl ${location.pathname === "/" ? "text-indigo-600" : ""}`}
      >
        <img
          src={location.pathname === "/" ? "/gradHomeFeedIcon_1.svg" : "/HomeFeedIcon_1.svg"}
          alt="Home Feed"
          className="w-8 h-8"
        />
      </Link>
      <Link
        to="/add-event"
        className={`text-8xl ${location.pathname === "/add-event" ? "text-indigo-600" : ""}`}
      >
        <img
          src={location.pathname === "/add-event" ? "/gradNewEventIcon_1.svg" : "/NewEventIcon_1.svg"}
          alt="Add Event"
          className="w-8 h-8"
        />
      </Link>
      <Link
        to="/profile"
        className={`text-2xl ${location.pathname === "/profile" ? "text-indigo-600" : ""}`}
      >
        <img
          src={location.pathname === "/profile" ? "/gradProfileIcon_1.svg" : "/ProfileIcon_1.svg"}
          alt="Profile"
          className="w-8 h-8"
        />
      </Link>
    </nav>
  );
};

export default BottomTabBar;