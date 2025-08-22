import React from 'react';

const ConnectionBadge = ({ connected }) => {
  return (
    <div className="inline-flex items-center space-x-2 px-2 py-1 rounded-full bg-gray-100">
      <span
        className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-xs text-gray-600">{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};

export default ConnectionBadge;


