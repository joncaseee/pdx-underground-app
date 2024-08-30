import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, QueryDocumentSnapshot, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import EventCard from './EventCard';
import ViewEvent from './ViewEvent';
import { Event } from '../types/Event';
import { ClipLoader } from "react-spinners";

interface UserProfile {
  alias: string;
  role: string;
  profilePictureUrl?: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postedEvents, setPostedEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [userSaves, setUserSaves] = useState<{ [key: string]: boolean }>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        const userProfileRef = doc(db, 'userProfiles', userId);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
          setProfile(userProfileSnap.data() as UserProfile);
        }

        // Fetch posted events
        const postedEventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
        const postedEventsSnap = await getDocs(postedEventsQuery);
        const postedEventsData = await Promise.all(postedEventsSnap.docs.map(async (docSnapshot: QueryDocumentSnapshot) => {
          const eventData = docSnapshot.data();
          const organizerProfileRef = doc(db, 'userProfiles', eventData.userId);
          const organizerProfileSnap = await getDoc(organizerProfileRef);
          const organizerProfileData = organizerProfileSnap.exists() ? organizerProfileSnap.data() as UserProfile : null;

          return {
            id: docSnapshot.id,
            ...eventData,
            likes: eventData.likes || 0,
            likedBy: eventData.likedBy || [],
            organizerProfilePicture: organizerProfileData?.profilePictureUrl || '',
          } as Event;
        }));
        setPostedEvents(postedEventsData);

        // Fetch saved events
        const savedEventsRef = doc(db, 'userSavedEvents', userId);
        const savedEventsSnap = await getDoc(savedEventsRef);
        if (savedEventsSnap.exists()) {
          const savedEventIds = savedEventsSnap.data().savedEvents || [];
          const fetchedSavedEvents = await Promise.all(
            savedEventIds.map(async (eventId: string) => {
              const eventDoc = await getDoc(doc(db, 'events', eventId));
              if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                const organizerProfileRef = doc(db, 'userProfiles', eventData.userId);
                const organizerProfileSnap = await getDoc(organizerProfileRef);
                const organizerProfileData = organizerProfileSnap.exists() ? organizerProfileSnap.data() as UserProfile : null;

                return {
                  id: eventDoc.id,
                  ...eventData,
                  likes: eventData.likes || 0,
                  likedBy: eventData.likedBy || [],
                  organizerProfilePicture: organizerProfileData?.profilePictureUrl || '',
                } as Event;
              }
              return null;
            })
          );
          setSavedEvents(fetchedSavedEvents.filter((event): event is Event => event !== null));
        }

        // Set user likes and saves
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userSavedEventsRef = doc(db, "userSavedEvents", currentUser.uid);
          const userSavedEventsSnap = await getDoc(userSavedEventsRef);
          const savedEventIds = userSavedEventsSnap.exists() ? userSavedEventsSnap.data().savedEvents || [] : [];

          const newUserLikes = [...postedEventsData, ...savedEvents].reduce((acc, event) => {
            acc[event.id] = event.likedBy.includes(currentUser.uid);
            return acc;
          }, {} as { [key: string]: boolean });

          const newUserSaves = [...postedEventsData, ...savedEvents].reduce((acc, event) => {
            acc[event.id] = savedEventIds.includes(event.id);
            return acc;
          }, {} as { [key: string]: boolean });

          setUserLikes(newUserLikes);
          setUserSaves(newUserSaves);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile data:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleLike = async (eventId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const eventRef = doc(db, "events", eventId);
    const isLiked = userLikes[eventId];

    try {
      if (isLiked) {
        await updateDoc(eventRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUser.uid)
        });
        setUserLikes(prev => ({ ...prev, [eventId]: false }));
      } else {
        await updateDoc(eventRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUser.uid)
        });
        setUserLikes(prev => ({ ...prev, [eventId]: true }));
      }

      // Update the event in both postedEvents and savedEvents
      const updateEventLikes = (events: Event[]) =>
        events.map(event =>
          event.id === eventId
            ? {
                ...event,
                likes: isLiked ? event.likes - 1 : event.likes + 1,
                likedBy: isLiked
                  ? event.likedBy.filter(uid => uid !== currentUser.uid)
                  : [...event.likedBy, currentUser.uid]
              }
            : event
        );

      setPostedEvents(updateEventLikes);
      setSavedEvents(updateEventLikes);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleSave = async (eventId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userSavedEventsRef = doc(db, "userSavedEvents", currentUser.uid);
    const isSaved = userSaves[eventId];

    try {
      if (isSaved) {
        await updateDoc(userSavedEventsRef, {
          savedEvents: arrayRemove(eventId)
        });
        setUserSaves(prev => ({ ...prev, [eventId]: false }));
        setSavedEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        await updateDoc(userSavedEventsRef, {
          savedEvents: arrayUnion(eventId)
        });
        setUserSaves(prev => ({ ...prev, [eventId]: true }));
        const eventToAdd = postedEvents.find(event => event.id === eventId);
        if (eventToAdd) {
          setSavedEvents(prev => [...prev, eventToAdd]);
        }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={50} color={"#8b5cf6"} loading={loading} />
      </div>
    );
  }

  if (!profile) {
    return <div>User profile not found.</div>;
  }

  return (
    <div className="user-profile p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{profile.alias}'s Profile</h1>
      <p className="mb-4">Role: {profile.role}</p>

      <h2 className="text-2xl font-semibold mb-2">Posted Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {postedEvents.map(event => (
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

      <h2 className="text-2xl font-semibold mb-2">Saved Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {savedEvents.map(event => (
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

export default UserProfile;