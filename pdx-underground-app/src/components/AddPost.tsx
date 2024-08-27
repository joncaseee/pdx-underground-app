import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

const AddPost: React.FC = () => {
  const [text, setText] = useState("");
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
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        text,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setText("");
      setImage(null);
      setPreviewUrl(null); // Reset after form submission only
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-post p-4 mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Create a New Post</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-2 mb-4 border rounded bg-slate-600 text-white"
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
          className="button mb-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-green-600"
        >
          Post
        </button>
      </div>
    </form>
  );
};

export default AddPost;
