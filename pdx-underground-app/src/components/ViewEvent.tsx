import React from 'react';
import { X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
}

interface ViewEventProps {
  event: Event | null;
  onClose: () => void;
}

const ViewEvent: React.FC<ViewEventProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full object-contain max-h-[50vh]"
          />
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
          <p className="text-white text-sm mb-4">Organized by: {event.organizer}</p>
          <p className="text-white mb-4 whitespace-pre-wrap">{event.description}</p>
          <p className="text-white font-semibold">
            Date & Time: {new Date(event.dateTime).toLocaleString([], { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewEvent;