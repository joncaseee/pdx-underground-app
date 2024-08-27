import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dateTime: string;
  imageUrl: string;
  userId: string;
}

const EditEvent: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as Event;
        setEvent(eventData);
        setTitle(eventData.title);
        setOrganizer(eventData.organizer);
        setDescription(eventData.description);
        setDateTime(eventData.dateTime);
        setPreviewUrl(eventData.imageUrl);
      } else {
        console.log("No such event!");
        navigate("/profile");
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !eventId) return;

    try {
      let imageUrl = event?.imageUrl || "";
      if (image) {
        // Delete old image if it exists
        if (event?.imageUrl) {
          const oldImageRef = ref(storage, event.imageUrl);
          await deleteObject(oldImageRef);
        }

        // Upload new image
        const imageRef = ref(storage, `events/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(doc(db, "events", eventId), {
        title,
        organizer,
        description,
        dateTime,
        imageUrl,
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="edit-event p-4 mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Edit Event</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event Title"
        className="w-full p-2 mb-4 border rounded bg-slate-600 text-white"
        required
      />
      <input
        type="text"
        value={organizer}
        onChange={(e) => setOrganizer(e.target.value)}
        placeholder="Event Organizer"
        className="w-full p-2 mb-4 border rounded bg-slate-600 text-white"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Event Description"
        className="w-full p-2 mb-4 border rounded bg-slate-600 text-white"
        required
      />
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        className="w-full p-2 mb-4 border rounded bg-slate-600 text-white"
        required
      />
      {previewUrl && (
        <div className="mb-4">
          <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded border border-gray-300" />
        </div>
      )}
      <div className="flex justify-center items-center space-x-8">
        <button
          type="button"
          onClick={handleFileButtonClick}
          className="custom-file-button mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Choose Image
        </button>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
        />
        <button
          type="submit"
          className="button mb-4 px-4 py-2 bg-purple-500 text-white rounded"
        >
          Update Event
        </button>
      </div>
    </form>
  );
};

export default EditEvent;