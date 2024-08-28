import React from 'react';
import { Link } from 'react-router-dom';

const WelcomeScreen: React.FC = () => (
  <div className="welcome-screen p-8 max-w-2xl mx-auto">
    <h1 className="text-4xl font-bold mb-4 text-center pb-1">PDX Underground</h1>
    <p className="mb-4 text-center">
      A Direct Line to Renegades and Underground Events In Portland.
    </p>
    <div className="mb-4">
      <img
        src="/app.png"
        alt="App structure diagram"
        className="rounded-lg shadow-md"
      />
    </div>
    <h2 className="text-2xl font-semibold mb-2">Features:</h2>
    <ul className="list-disc list-inside mb-4">
      <li>Create events with images and descriptions</li>
      <li>View a public feed of all upcoming events</li>
      <li>Personal profile page to edit and delete events</li>
    </ul>
    <div className="flex justify-center space-x-4">
      <Link to="/signup" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300">
        Sign Up
      </Link>
      <Link to="/signin" className="bg-violet-500 text-white px-6 py-2 rounded-lg hover:bg-violet-600 transition duration-300">
        Sign In
      </Link>
    </div>
  </div>
);

export default WelcomeScreen;