import React from 'react';
import { PuffLoader } from 'react-spinners';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <PuffLoader color="#6366f1" size={60} />
    </div>
  );
};

export default LoadingSpinner;