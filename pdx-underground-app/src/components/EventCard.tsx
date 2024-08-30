import React from 'react';
import { Heart, Bookmark, Settings, Trash2 } from 'lucide-react';
import { Event } from '../types/Event';

interface EventCardProps {
  event: Event;
  isOwner: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string, imageUrl: string) => void;
  onClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isOwner,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onEdit,
  onDelete,
  onClick,
}) => {
  const truncateDescription = (description: string) => {
    const lines = description.split('\n').slice(0, 3);
    const truncated = lines.join('\n');
    return truncated.length < description.length ? `${truncated}...` : truncated;
  };

  return (
    <div
      className="event p-[1px] bg-gradient-to-br mx-2 my-3 from-teal-600 to-violet-400 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg 
                 transition-colors duration-200 flex flex-col"
      onClick={() => onClick(event)}
    >
      <div className="flex-grow bg-zinc-800 rounded-lg flex flex-col">
        {event.imageUrl && (
          <div className="relative pt-[150%]">
            <img
              src={event.imageUrl}
              alt="Event"
              className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
            />
          </div>
        )}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
            <div className="flex items-center mb-2">
              {event.organizerProfilePicture ? (
                <img
                  src={event.organizerProfilePicture}
                  alt="Organizer"
                  className="w-6 h-6 rounded-full mr-2 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">{event.organizer[0]?.toUpperCase()}</span>
                </div>
              )}
              <p className="text-white text-sm">{event.organizer}</p>
            </div>
            <p className="text-white mb-2 line-clamp-3">{truncateDescription(event.description)}</p>
          </div>
          <p className="text-white font-semibold mt-2">
            Date & Time: {new Date(event.dateTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <div className="p-2 flex justify-between items-center">
          <div className="flex space-x-2">
            {isOwner && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(event.id);
                  }}
                  className="p-1 bg-zinc-500 bg-opacity-30 text-white shadow-sm hover:bg-zinc-800 hover:text-indigo-500 hover:border-indigo-600 rounded"
                  aria-label="Edit event"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(event.id, event.imageUrl);
                  }}
                  className="p-1 bg-zinc-500 bg-opacity-30 text-white shadow-sm hover:bg-zinc-800 hover:text-red-500 hover:border-red-500 rounded"
                  aria-label="Delete event"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
          <div className="flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(event.id);
              }}
              className={`flex items-center space-x-1 bg-transparent hover:bg-zinc-700 font-bold py-1 px-2 rounded ${
                isSaved ? 'text-yellow-500' : 'text-white'
              }`}
            >
              <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(event.id);
              }}
              className={`flex items-center space-x-1 bg-transparent hover:bg-zinc-700 hover:text-indigo-500 font-bold py-1 px-2 rounded ${
                isLiked ? 'text-rose-500' : 'text-white'
              }`}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{event.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;