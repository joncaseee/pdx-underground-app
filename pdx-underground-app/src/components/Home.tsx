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
        })) as Event[];

      const upcomingEvents = newEvents
        .filter((event) => event.dateTime >= now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      setEvents(upcomingEvents);
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
      <div className="max-w-8xl mx-auto pb-16 grid grid-cols-1 px-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="event bg-slate-700 shadow-md rounded-lg overflow-hidden cursor-pointer hover:bg-slate-600 hover:shadow-lg transition-colors duration-200 flex flex-col"
            onClick={() => handleEventClick(event)}
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
                <h2 className="text-xl font-bold text-white mb-2">
                  {event.title}
                </h2>
                <p className="text-white text-sm mb-2">{event.organizer}</p>
                <p className="text-white mb-2 line-clamp-3">{truncateDescription(event.description)}</p>
              </div>
              <p className="text-white font-semibold mt-2">
                Date & Time: {new Date(event.dateTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      {selectedEvent && <ViewEvent event={selectedEvent} onClose={handleCloseModal} />}
    </div>
  );
};

export default Home;