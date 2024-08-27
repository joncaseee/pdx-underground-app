import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import ViewEvent from "./ViewEvent";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
  userId: string;
}

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("dateTime", "asc")
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const newEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, []);

  const truncateDescription = (description: string) => {
    const lines = description.split('\n').slice(0, 3);
    const truncated = lines.join('\n');
    return truncated.length < description.length ? `${truncated}...` : truncated;
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="home p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        PDX Underground Events
      </h1>
      <h3 className="text-l font-bold mb-4 text-center">
        Your Feed for Underground Events
      </h3>
      <div className="max-w-8xl mx-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <div
            key={event.id}
            className="event bg-slate-700 shadow-md rounded-lg p-4 cursor-pointer hover:bg-slate-600 transition-colors duration-200"
            onClick={() => handleEventClick(event)}
          >
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt="Event"
                className="w-full h-64 object-cover rounded-lg mb-2"
              />
            )}
            <h2 className="text-xl font-bold text-white mb-2">
              {event.title}
            </h2>
            <p className="text-white text-sm mb-2">{event.organizer}</p>
            <p className="text-white mb-2 line-clamp-3">{truncateDescription(event.description)}</p>
            <p className="text-white font-semibold">
              Date & Time: {new Date(event.dateTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        ))}
      </div>
      {selectedEvent && <ViewEvent event={selectedEvent} onClose={handleCloseModal} />}
    </div>
  );
};

export default Home;