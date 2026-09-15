import React from 'react';

const CreateGroupModal = ({ onClose, onCreateGroup, newGroupName, setNewGroupName }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-200 font-bold text-lg text-primary-900">Create New Group</div>
        <form onSubmit={onCreateGroup} className="p-6 bg-background/50">
          <input
            autoFocus
            type="text"
            placeholder="Enter group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-surface text-primary-900 outline-none mb-6 shadow-sm"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-primary-800 hover:bg-primary-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={!newGroupName.trim()} className="px-6 py-2 font-medium bg-primary-600 hover:bg-primary-700 text-surface rounded-lg disabled:opacity-50 transition-colors shadow-md">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
