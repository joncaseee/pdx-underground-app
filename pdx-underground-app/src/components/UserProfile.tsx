import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import EventCard from './EventCard';
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
          const savedEventsData = await Promise.all(
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
          setSavedEvents(savedEventsData.filter((event): event is Event => event !== null));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile data:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

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
            isLiked={false}
            isSaved={false}
            onLike={() => {}}
            onSave={() => {}}
            onClick={() => {}}
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
            isLiked={false}
            isSaved={true}
            onLike={() => {}}
            onSave={() => {}}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default UserProfile;