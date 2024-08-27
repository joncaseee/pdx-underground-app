import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { ref, deleteObject } from "firebase/storage";

interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  imageUrl: string;
}

const Profile: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", currentUser.uid),
          orderBy("dateTime", "asc")
        );

        const querySnapshot = await getDocs(eventsQuery);
        const userEvents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        setEvents(userEvents);

        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
          const newEvents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Event[];
          setEvents(newEvents);
        });

        return () => unsubscribeEvents();
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string, imageUrl: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "events", eventId));

      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (!user) {
    return (
      <div className="profile p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
        <p>Please sign in to view your profile.</p>
        <Link
          to="/signin"
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="profile p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Profile</h2>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={handleSignOut}
          className="container px-4 py-2 rounded mb-4"
        >
          Sign Out
        </button>
        <h3 className="text-xl font-semibold mb-2">Your Events</h3>
        {events.length === 0 ? (
          <p>You haven't created any events yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="event bg-slate-700 shadow-md rounded-lg p-4 mb-4 relative"
            >
              <button
                onClick={() => handleDeleteEvent(event.id, event.imageUrl)}
                className="absolute bottom-2.5 right-4 p-1 bg-slate-500 bg-opacity-30 text-white shadow-sm hover:bg-slate-800 hover:text-red-500 hover:border-red-500"
                aria-label="Delete event"
              >
                <X size={20} />
              </button>
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt="Event"
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
              )}
              <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
              <p className="text-white mb-2">{event.description}</p>
              <p className="text-white font-semibold">Date & Time: {new Date(event.dateTime).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;