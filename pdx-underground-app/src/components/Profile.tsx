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
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { ref, deleteObject } from "firebase/storage";
import ViewEvent from "./ViewEvent";
import EventCard from "./EventCard";
import { Event } from "../types/Event";

const Profile: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'your-events' | 'saved-events'>('your-events');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [userSaves, setUserSaves] = useState<{ [key: string]: boolean }>({});
  const [alias, setAlias] = useState("");
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          setAlias(userProfileSnap.data().alias);
        }

        const eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", currentUser.uid),
          orderBy("dateTime", "asc")
        );

        const unsubscribeEvents = onSnapshot(
          eventsQuery,
          (snapshot) => {
            const newEvents = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              likes: doc.data().likes || 0,
              likedBy: doc.data().likedBy || [],
            })) as Event[];

            const sortedEvents = newEvents.sort((a, b) => 
              new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            );

            setEvents(sortedEvents);
            setError(null);

            const newUserLikes = sortedEvents.reduce((acc, event) => {
              acc[event.id] = event.likedBy.includes(currentUser.uid);
              return acc;
            }, {} as { [key: string]: boolean });
            setUserLikes(newUserLikes);
          },
          (err) => {
            console.error("Firestore query error:", err);
            setError(`Error fetching events: ${err.message}`);
          }
        );

        const userSavedEventsRef = doc(db, "userSavedEvents", currentUser.uid);
        const unsubscribeSavedEvents = onSnapshot(userSavedEventsRef, async (docSnap) => {
          if (docSnap.exists()) {
            const savedEventIds = docSnap.data().savedEvents || [];
            const savedEventsData = await Promise.all(
              savedEventIds.map(async (eventId: string) => {
                const eventDoc = await getDoc(doc(db, "events", eventId));
                if (eventDoc.exists()) {
                  return { 
                    id: eventDoc.id, 
                    ...eventDoc.data(), 
                    likes: eventDoc.data().likes || 0,
                    likedBy: eventDoc.data().likedBy || [] 
                  } as Event;
                }
                return null;
              })
            );

            const filteredAndSortedSavedEvents = savedEventsData
              .filter((event): event is Event => event !== null)
              .sort((a, b) => 
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
              );

            setSavedEvents(filteredAndSortedSavedEvents);

            const newUserSaves = filteredAndSortedSavedEvents.reduce((acc, event) => {
              acc[event.id] = true;
              return acc;
            }, {} as { [key: string]: boolean });
            setUserSaves(newUserSaves);

            const newUserLikes = filteredAndSortedSavedEvents.reduce((acc, event) => {
              acc[event.id] = event.likedBy.includes(currentUser.uid);
              return acc;
            }, {} as { [key: string]: boolean });
            setUserLikes(prev => ({ ...prev, ...newUserLikes }));
          } else {
            setSavedEvents([]);
            setUserSaves({});
          }
        });

        return () => {
          unsubscribeEvents();
          unsubscribeSavedEvents();
        };
      } else {
        setEvents([]);
        setSavedEvents([]);
        setUserLikes({});
        setUserSaves({});
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

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventId)
      );
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/edit-event/${eventId}`);
  };

  const handleLike = async (eventId: string) => {
    if (!user) return;

    const eventRef = doc(db, "events", eventId);
    const isLiked = userLikes[eventId];

    try {
      if (isLiked) {
        await updateDoc(eventRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        setUserLikes(prev => ({ ...prev, [eventId]: false }));
      } else {
        await updateDoc(eventRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        setUserLikes(prev => ({ ...prev, [eventId]: true }));
      }

      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: isLiked ? event.likes - 1 : event.likes + 1 }
            : event
        )
      );
      setSavedEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, likes: isLiked ? event.likes - 1 : event.likes + 1 }
            : event
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleSave = async (eventId: string) => {
    if (!user) return;

    const userSavedEventsRef = doc(db, "userSavedEvents", user.uid);
    const isSaved = userSaves[eventId];

    try {
      if (isSaved) {
        await updateDoc(userSavedEventsRef, {
          savedEvents: arrayRemove(eventId)
        });
        setUserSaves(prev => ({ ...prev, [eventId]: false }));
      } else {
        await updateDoc(userSavedEventsRef, {
          savedEvents: arrayUnion(eventId)
        });
        setUserSaves(prev => ({ ...prev, [eventId]: true }));
      }
    } catch (error) {
      console.error("Error updating save:", error);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleEditAlias = () => {
    setIsEditingAlias(true);
  };

  const handleSaveAlias = async () => {
    if (!user) return;

    try {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      await updateDoc(userProfileRef, { alias: alias });
      setIsEditingAlias(false);
    } catch (error) {
      console.error("Error updating alias:", error);
    }
  };

  const handleViewPublicProfile = () => {
    if (user) {
      navigate(`/user/${user.uid}`);
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
      <div className="mx-6">
        <button
          onClick={handleSignOut}
          className="text-white font-thin bg-transparent absolute right-4 top-4 px-4 py-2 rounded mb-4"
        >
          Sign Out
        </button>

        <div className="mb-4">
          {isEditingAlias ? (
            <div className="flex items-center">
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="mr-2 p-2 border rounded"
              />
              <button
                onClick={handleSaveAlias}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h3 className="text-xl font-semibold mr-2">Alias: {alias}</h3>
              <button
                onClick={handleEditAlias}
                className="text-blue-500 underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleViewPublicProfile}
          className="bg-green-500 text-white px-4 py-2 rounded mb-4"
        >
          View Public Profile
        </button>

        <div className="flex justify-center mb-6">
          <button
            className={`px-4 py-2 mx-2 rounded-t-lg ${
              activeTab === 'your-events'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('your-events')}
          >
            Your Events
          </button>
          <button
            className={`px-4 py-2 mx-2 rounded-t-lg ${
              activeTab === 'saved-events'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('saved-events')}
          >
            Saved Events
          </button>
        </div>

        {activeTab === 'your-events' && (
          <>
            <h3 className="text-xl font-semibold mb-4">Your Events</h3>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : events.length === 0 ? (
              <p>You haven't created any events yet.</p>
            ) : (
              <div className="max-w-8xl mx-auto pb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOwner={true}
                    isLiked={userLikes[event.id]}
                    isSaved={userSaves[event.id]}
                    onLike={handleLike}
                    onSave={handleSave}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'saved-events' && (
          <>
            <h3 className="text-xl font-semibold mb-4">Saved Events</h3>
            {savedEvents.length === 0 ? (
              <p>You haven't saved any events yet.</p>
            ) : (
              <div className="max-w-8xl mx-auto pb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {savedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOwner={false}
                    isLiked={userLikes[event.id]}
                    isSaved={true}
                    onLike={handleLike}
                    onSave={handleSave}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {selectedEvent && <ViewEvent event={selectedEvent} onClose={handleCloseModal} />}
    </div>
  );
};

export default Profile;