import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import EventCard from './EventCard';
import { Event } from '../types/Event';

interface UserProfile {
  alias: string;
  role: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postedEvents, setPostedEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      const userProfileRef = doc(db, 'userProfiles', userId);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        setProfile(userProfileSnap.data() as UserProfile);
      }

      // Fetch posted events
      const postedEventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
      const postedEventsSnap = await getDocs(postedEventsQuery);
      const postedEventsData = postedEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setPostedEvents(postedEventsData);

      // Fetch saved events
      const savedEventsRef = doc(db, 'userSavedEvents', userId);
      const savedEventsSnap = await getDoc(savedEventsRef);
      if (savedEventsSnap.exists()) {
        const savedEventIds = savedEventsSnap.data().savedEvents || [];
        const savedEventsData = await Promise.all(
          savedEventIds.map(async (eventId: string) => {
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            return eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } as Event : null;
          })
        );
        setSavedEvents(savedEventsData.filter((event): event is Event => event !== null));
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (!profile) {
    return <div>Loading...</div>;
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