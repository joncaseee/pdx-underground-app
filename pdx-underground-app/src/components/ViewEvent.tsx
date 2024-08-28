import React, { useState, useEffect } from "react";
import { X, Heart, Bookmark } from "lucide-react";
import { auth, db } from "../firebase";
import { doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, setDoc } from "firebase/firestore";
import SkeletonLoader from "./SkeletonLoader";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
  likes: number;
  likedBy: string[];
}

interface ViewEventProps {
  event: Event;
  onClose: () => void;
}

const ViewEvent: React.FC<ViewEventProps> = ({ event, onClose }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(event.likes);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Fetch the latest event data
        const eventDoc = await getDoc(doc(db, "events", event.id));
        if (eventDoc.exists()) {
          const latestEventData = eventDoc.data() as Event;
          setEventData(latestEventData);
          setLikesCount(latestEventData.likes || 0);
          setIsLiked(latestEventData.likedBy?.includes(currentUser.uid) || false);
        }

        // Check if the event is saved
        const userSavedEventsDoc = await getDoc(doc(db, "userSavedEvents", currentUser.uid));
        if (userSavedEventsDoc.exists()) {
          const savedEvents = userSavedEventsDoc.data().savedEvents || [];
          setIsSaved(savedEvents.includes(event.id));
        }
      }
      setLoading(false);
    };

    fetchEventData();
  }, [event.id]);

  const handleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const eventRef = doc(db, "events", event.id);

    if (isLiked) {
      // Unlike the event
      await updateDoc(eventRef, {
        likes: increment(-1),
        likedBy: arrayRemove(currentUser.uid)
      });
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      // Like the event
      await updateDoc(eventRef, {
        likes: increment(1),
        likedBy: arrayUnion(currentUser.uid)
      });
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userSavedEventsRef = doc(db, "userSavedEvents", currentUser.uid);

    if (isSaved) {
      // Unsave the event
      await updateDoc(userSavedEventsRef, {
        savedEvents: arrayRemove(event.id)
      });
      setIsSaved(false);
    } else {
      // Save the event
      await setDoc(userSavedEventsRef, {
        savedEvents: arrayUnion(event.id)
      }, { merge: true });
      setIsSaved(true);
    }
  };

  if (loading) {
    return <SkeletonLoader type="view" />;
  }

  const displayedEvent = eventData || event;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-8">
      <div className="bg-zinc-800 bg-opacity-50 backdrop-blur-md p-6 mx-3 rounded-lg shadow-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl mx-4 font-bold text-white">{displayedEvent.title}</h2>
          <button
            onClick={onClose}
            className="mx-4 text-gray-100 bg-zinc-700 bg-opacity-30 hover:bg-zinc-700 hover:bg-opacity-60 hover:text-indigo-500"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 mx-4 flex-shrink-8 p-[1px] bg-gradient-to-r rounded-md from-teal-600 to-violet-600">
            {displayedEvent.imageUrl && (
              <div className="relative pt-[125%]">
                <img
                  src={displayedEvent.imageUrl}
                  alt="Event"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="md:w-1/2 mx-4">
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Organizer:</span> {displayedEvent.organizer}
            </p>
            <p className="text-gray-300 mb-4">
              <span className="font-semibold">Date & Time:</span>{" "}
              {new Date(displayedEvent.dateTime).toLocaleString([], {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-gray-300 font-semibold mb-2">Description:</p>
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{displayedEvent.description}</p>
            <div className="flex justify-between items-center">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 bg-transparent hover:bg-zinc-700 font-bold py-2 px-4 rounded ${
                  isLiked ? 'text-rose-500' : 'text-white'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likesCount} likes</span>
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center space-x-1 bg-transparent hover:bg-zinc-700 font-bold py-2 px-4 rounded ${
                  isSaved ? 'text-yellow-500' : 'text-white'
                }`}
              >
                <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEvent;