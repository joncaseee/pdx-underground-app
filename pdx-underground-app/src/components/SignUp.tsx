import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';

type UserRole = 'artist' | 'promoter';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select whether you are an artist or a promoter.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user);
      navigate('/profile');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!role) {
      setError('Please select whether you are an artist or a promoter before signing up with Google.');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await createUserProfile(userCredential.user);
      navigate('/profile');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const createUserProfile = async (user: User) => {
    await setDoc(doc(db, 'userProfiles', user.uid), {
      alias: alias,
      role: role,
      email: user.email,
    });
  };

  return (
    <div className="sign-up p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Alias/Profile Name"
          required
          className="w-full p-2 border rounded"
        />
        <div className="flex flex-col space-y-2">
          <label className="font-semibold">I am a:</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="artist"
                checked={role === 'artist'}
                onChange={() => setRole('artist')}
                className="mr-2 bg-violet-500"
              />
              Artist
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="promoter"
                checked={role === 'promoter'}
                onChange={() => setRole('promoter')}
                className="mr-2"
              />
              Promoter
            </label>
          </div>
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-700 transition duration-300">
          Sign Up
        </button>
      </form>
      <div className="mt-4">
        <button onClick={handleGoogleSignUp} className="w-full bg-white text-gray-700 p-2 rounded border border-gray-300 hover:bg-gray-100 transition duration-300 flex items-center justify-center">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2" />
          Sign Up with Google
        </button>
      </div>
    </div>
  );
};

export default SignUp;