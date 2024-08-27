import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { ref, deleteObject } from "firebase/storage";

interface Post {
  id: string;
  text: string;
  imageUrl: string;
}

const Profile: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(postsQuery);
        const userPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setPosts(userPosts);

        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          const newPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setPosts(newPosts);
        });

        return () => unsubscribePosts();
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeletePost = async (postId: string, imageUrl: string) => {
    if (!user) return;

    try {
      // Delete the post document from Firestore
      await deleteDoc(doc(db, "posts", postId));

      // If there's an image associated with the post, delete it from Storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // Update the local state to remove the deleted post
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (!user) {
    return (
      <div className="profile p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
        <p>Please sign in to view your profile.</p>
        <Link
          to="/signin"
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="profile p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Profile</h2>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={handleSignOut}
          className="container px-4 py-2 rounded mb-4"
        >
          Sign Out
        </button>
        <h3 className="text-xl font-semibold mb-2">Your Posts</h3>
        {posts.length === 0 ? (
          <p>You haven't made any posts yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="post bg-slate-700 shadow-md rounded-lg p-4 mb-4 relative"
            >
              <button
                onClick={() => handleDeletePost(post.id, post.imageUrl)}
                className="absolute bottom-2.5 right-4 p-1 bg-slate-500 bg-opacity-30 text-white shadow-sm hover:bg-slate-800 hover:text-red-500 hover:border-red-500"
                aria-label="Delete post"
              >
                <X size={20} />
              </button>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
              )}
              <p className="text-white">{post.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;