import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import ViewEvent from "./ViewEvent";
import EventCard from "./EventCard";
import { Event } from "../types/Event";
import { ClipLoader } from "react-spinners"; // Importing the spinner

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [userSaves, setUserSaves] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true); // State to manage loading status

  const fetchUserSavedEvents = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      const userSavedEventsRef = doc(db, "userSavedEvents", currentUserId);
      const docSnap = await getDoc(userSavedEventsRef);
      if (docSnap.exists()) {
        const savedEvents = docSnap.data().savedEvents || [];
        const newUserSaves = events.reduce((acc, event) => {
          acc[event.id] = savedEvents.includes(event.id);
          return acc;
        }, {} as { [key: string]: boolean });
        setUserSaves(newUserSaves);
      }
    }
  };

  useEffect(() => {
    const now = new Date().toISOString();
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("dateTime", "asc")
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const newEvents = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || 0,
          likedBy: doc.data().likedBy || [],
        })) as Event[];

      const upcomingEvents = newEvents
        .filter((event) => event.dateTime >= now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      setEvents(upcomingEvents);

      // Update userLikes and userSaves state
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        const newUserLikes = upcomingEvents.reduce((acc, event) => {
          acc[event.id] = event.likedBy.includes(currentUserId);
          return acc;
        }, {} as { [key: string]: boolean });
        setUserLikes(newUserLikes);

        // Fetch user's saved events
        const userSavedEventsRef = doc(db, "userSavedEvents", currentUserId);
        getDoc(userSavedEventsRef).then((docSnap) => {
          if (docSnap.exists()) {
            const savedEvents = docSnap.data().savedEvents || [];
            const newUserSaves = upcomingEvents.reduce((acc, event) => {
              acc[event.id] = savedEvents.includes(event.id);
              return acc;
            }, {} as { [key: string]: boolean });
            setUserSaves(newUserSaves);
          }
        });
      }

      setLoading(false); // Set loading to false after data is fetched
    });

    return () => unsubscribe();
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    fetchUserSavedEvents();
  };

  const handleLike = async (eventId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const eventRef = doc(db, "events", eventId);
    const isLiked = userLikes[eventId];

    if (isLiked) {
      // Unlike the event
      await updateDoc(eventRef, {
        likes: increment(-1),
        likedBy: arrayRemove(currentUser.uid)
      });
      setUserLikes(prev => ({ ...prev, [eventId]: false }));
    } else {
      // Like the event
      await updateDoc(eventRef, {
        likes: increment(1),
        likedBy: arrayUnion(currentUser.uid)
      });
      setUserLikes(prev => ({ ...prev, [eventId]: true }));
    }
  };

  const handleSave = async (eventId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }
  
    const userSavedEventsRef = doc(db, "userSavedEvents", currentUser.uid);
    const isSaved = userSaves[eventId];
  
    try {
      if (isSaved) {
        // Unsave the event
        await updateDoc(userSavedEventsRef, {
          savedEvents: arrayRemove(eventId)
        });
        console.log("Event unsaved successfully");
      } else {
        // Save the event
        await setDoc(userSavedEventsRef, {
          savedEvents: arrayUnion(eventId)
        }, { merge: true });
        console.log("Event saved successfully");
      }
      setUserSaves(prev => ({ ...prev, [eventId]: !isSaved }));
    } catch (error) {
      console.error("Error updating save:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={50} color={"#8b5cf6"} loading={loading} />
      </div>
    );
  }

  return (
    <div className="home p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        PDX Underground Events
      </h1>
      <h3 className="text-l font-bold mb-4 text-center">
        Your Feed for Underground Events
      </h3>
      <div className="max-w-8xl mx-auto pb-16 grid grid-cols-1 px-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isOwner={false}
            isLiked={userLikes[event.id]}
            isSaved={userSaves[event.id]}
            onLike={handleLike}
            onSave={handleSave}
            onClick={handleEventClick}
          />
        ))}
      </div>
      {selectedEvent && <ViewEvent event={selectedEvent} onClose={handleCloseModal} />}
    </div>
  );
};

export default Home;