import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, setDoc, DocumentData } from "firebase/firestore";
import { db, auth } from "../firebase";
import ViewEvent from "./ViewEvent";
import EventCard from "./EventCard";
import { Event } from "../types/Event";
import { ClipLoader } from "react-spinners";

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [userSaves, setUserSaves] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSavedEvents = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      try {
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
      } catch (err) {
        console.error("Error fetching saved events:", err);
        setError("Failed to load saved events. Please try again later.");
      }
    }
  };

  useEffect(() => {
    const now = new Date().toISOString();
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("dateTime", "asc")
    );

    const unsubscribe = onSnapshot(eventsQuery, 
      async (snapshot) => {
        try {
          const newEvents = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const eventData = docSnapshot.data() as DocumentData;
            const userProfileRef = doc(db, 'userProfiles', eventData.userId as string);
            const userProfileSnap = await getDoc(userProfileRef);
            const userProfileData = userProfileSnap.exists() ? userProfileSnap.data() : null;
            
            return {
              id: docSnapshot.id,
              ...eventData,
              likes: eventData.likes || 0,
              likedBy: eventData.likedBy || [],
              organizerProfilePicture: userProfileData?.profilePictureUrl || '',
            } as Event;
          }));

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

          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing events:", err);
          setError("Failed to load events. Please try again later.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Firestore query error:", err);
        setError("Failed to connect to the database. Please check your internet connection and try again.");
        setLoading(false);
      }
    );

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

    try {
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
    } catch (err) {
      console.error("Error updating like:", err);
      setError("Failed to update like. Please try again.");
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
    } catch (err) {
      console.error("Error updating save:", err);
      setError("Failed to update saved event. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={50} color={"#8b5cf6"} loading={loading} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
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