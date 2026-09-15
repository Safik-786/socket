import React from 'react';

const DirectoryModal = ({ onClose, allUsers, onStartDirectChat }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-primary-200 font-bold text-lg flex justify-between items-center text-primary-900 bg-surface">
          Start a Conversation
          <button onClick={onClose} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md">&times;</button>
        </div>
        <div className="p-2 flex-1 overflow-y-auto bg-background/50">
          {allUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-primary-600">No other users found.</div>
          ) : (
            allUsers.map(u => (
              <button
                key={u._id}
                onClick={() => onStartDirectChat(u._id)}
                className="w-full text-left px-4 py-3 mb-1 hover:bg-primary-100 bg-surface rounded-lg flex items-center gap-3 transition-colors shadow-sm border border-transparent hover:border-primary-200"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-bold">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-surface rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-primary-400'}`}></div>
                </div>
                <div>
                  <div className="font-semibold text-primary-900">{u.username}</div>
                  <div className={`text-xs font-medium ${u.isOnline ? 'text-green-600' : 'text-primary-500'}`}>
                    {u.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryModal;
