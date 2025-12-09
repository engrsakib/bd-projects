import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative flex flex-col w-full sm:w-[320px] flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200 animate-pulse">
      <div className="relative w-full h-32 sm:h-48 bg-gray-200"></div>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        
        <div className="flex items-center mb-2 sm:mb-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-8 ml-2"></div>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
        
        <div className="sm:flex hidden gap-2">
          <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;