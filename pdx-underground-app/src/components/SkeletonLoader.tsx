import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'view';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
  if (type === 'card') {
    return (
      <div className="event p-[1px] bg-gradient-to-br mx-2 my-3 from-gray-700 to-gray-900 rounded-lg overflow-hidden flex flex-col animate-pulse">
        <div className="flex-grow bg-zinc-800 rounded-lg flex flex-col">
          <div className="relative pt-[150%] bg-gray-700 rounded-t-lg"></div>
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
              <div className="h-6 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
            </div>
            <div className="h-5 bg-gray-600 rounded mt-2"></div>
          </div>
          <div className="p-2 flex justify-between items-center">
            <div className="h-6 bg-gray-600 rounded w-10"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-600 rounded w-10"></div>
              <div className="h-6 bg-gray-600 rounded w-10"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-8">
      <div className="bg-zinc-800 bg-opacity-50 backdrop-blur-md p-6 mx-3 rounded-lg shadow-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <div className="h-8 bg-gray-600 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-600 rounded-full"></div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 mx-4 flex-shrink-8 p-[1px] bg-gradient-to-r rounded-md from-gray-700 to-gray-600">
            <div className="relative pt-[125%] bg-gray-700 rounded-lg"></div>
          </div>
          <div className="md:w-1/2 mx-4">
            <div className="h-4 bg-gray-600 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-32 bg-gray-600 rounded w-full mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-600 rounded w-24"></div>
              <div className="h-8 bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;