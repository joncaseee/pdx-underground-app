import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { auth } from "./firebase";
import Profile from "./components/Profile";
import UserProfile from "./components/UserProfile";
import Home from "./components/Home";
import AddEvent from "./components/AddEvent";
import EditEvent from "./components/EditEvent";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import { User as FirebaseUser } from "firebase/auth";
import WelcomeScreen from "./components/WelcomeScreen";
import BottomTabBar from "./components/BottomTabBar";

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app flex flex-col min-h-screen">
        <main className="flex-grow pb-16">
          {user ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/add-event" element={<AddEvent />} />
              <Route path="/edit-event/:eventId" element={<EditEvent />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/user/:userId" element={<UserProfile />} />
            </Routes>
          )}
        </main>
        {user && <BottomTabBar />}
      </div>
    </Router>
  );
};

export default App;