import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Trash2 } from "lucide-react";
import { ref, deleteObject } from "firebase/storage";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
}

const Profile: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", currentUser.uid),
          orderBy("dateTime", "desc")
        );

        const unsubscribeEvents = onSnapshot(eventsQuery, 
          (snapshot) => {
            const newEvents = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Event[];
            setEvents(newEvents);
            setError(null);
          },
          (err) => {
            console.error("Firestore query error:", err);
            setError(`Error fetching events: ${err.message}`);
          }
        );

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

  const handleEditEvent = (eventId: string) => {
    navigate(`/edit-event/${eventId}`);
  };

  const truncateDescription = (description: string) => {
    const lines = description.split('\n').slice(0, 3);
    const truncated = lines.join('\n');
    return truncated.length < description.length ? `${truncated}...` : truncated;
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
      <div className="mx-auto">
        <button
          onClick={handleSignOut}
          className="text-white font-thin bg-transparent absolute right-4 top-4 px-4 py-2 rounded mb-4"
        >
          Sign Out
        </button>
        <h3 className="text-xl font-semibold mb-4">Your Events</h3>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : events.length === 0 ? (
          <p>You haven't created any events yet.</p>
        ) : (
          <div className="max-w-8xl mx-auto pb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="event bg-slate-700 shadow-md rounded-lg overflow-hidden relative flex flex-col"
              >
                {event.imageUrl && (
                  <div className="relative pt-[150%]">
                    <img
                      src={event.imageUrl}
                      alt="Event"
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                    <p className="text-white mb-2 line-clamp-2">{truncateDescription(event.description)}</p>
                  </div>
                  <p className="text-white text-sm font-semibold mb-2">
                    Date & Time: {new Date(event.dateTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleEditEvent(event.id)}
                    className="p-1 bg-slate-500 bg-opacity-30 text-white shadow-sm hover:bg-slate-800 hover:text-purple-500 hover:border-purple-500 rounded"
                    aria-label="Edit event"
                  >
                    <Settings size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id, event.imageUrl)}
                    className="p-1 bg-slate-500 bg-opacity-30 text-white shadow-sm hover:bg-slate-800 hover:text-red-500 hover:border-red-500 rounded"
                    aria-label="Delete event"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;