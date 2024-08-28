import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

const AddEvent: React.FC = () => {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user) return;
  
    try {
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `events/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
  
      await addDoc(collection(db, "events"), {
        userId: user.uid,
        title,
        organizer,
        description,
        dateTime,
        imageUrl,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setOrganizer("");
      setDescription("");
      setDateTime("");
      setImage(null);
      setPreviewUrl(null);
      navigate("/");
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-event p-4 mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Create a New Event</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event Title"
        className="w-full p-2 mb-4 rounded bg-slate-600 text-white"
        required
      />
      <input
        type="text"
        value={organizer}
        onChange={(e) => setOrganizer(e.target.value)}
        placeholder="Event Organizer"
        className="w-full p-2 mb-4 rounded bg-slate-600 text-white"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Event Description"
        className="w-full p-2 mb-4 rounded bg-slate-600 text-white"
        required
      />
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-600 text-white"
        required
      />
      {previewUrl && (
        <div className="mb-4">
          <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded border border-gray-300" />
        </div>
      )}
      <div className="flex justify-center items-center space-x-8 ">
        <button
          type="button"
          onClick={handleFileButtonClick}
          className="custom-file-button mb-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-900"
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
          className="button mb-4 px-[1] py-2 text-white rounded bg-gradient-to-r from-teal-600 to-violet-500 border-spacing-2 border-l-teal-600 border-r-violet-600
                       hover:bg-zinc-800"
        >
          Create Event
        </button>
      </div>
    </form>
  );
};

export default AddEvent;