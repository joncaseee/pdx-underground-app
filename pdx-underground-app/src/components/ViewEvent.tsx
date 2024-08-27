import React from "react";
import { X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
}

interface ViewEventProps {
  event: Event;
  onClose: () => void;
}

const ViewEvent: React.FC<ViewEventProps> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-8">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-100 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 flex-shrink-8">
            {event.imageUrl && (
              <div className="relative pt-[125%] mb-4">
                <img
                  src={event.imageUrl}
                  alt="Event"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="md:w-1/2">
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Organizer:</span> {event.organizer}
            </p>
            <p className="text-gray-300 mb-4">
              <span className="font-semibold">Date & Time:</span>{" "}
              {new Date(event.dateTime).toLocaleString([], {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p className="text-gray-300 font-semibold mb-2">
              Description:
            </p>
            <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEvent;