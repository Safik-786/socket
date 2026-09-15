import React from 'react';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';

const GroupSettingsModal = ({ 
  onClose, 
  activeGroup, 
  editGroupName, 
  setEditGroupName, 
  onUpdateGroup, 
  showDeleteConfirm, 
  setShowDeleteConfirm, 
  onDeleteGroup 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center text-primary-900">
          <span className="font-bold text-lg">Group Settings</span>
          <button onClick={onClose} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md text-xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 bg-background/30 flex flex-col gap-4">
          <form onSubmit={onUpdateGroup} className="flex gap-2">
            <input
              type="text"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="flex-1 px-4 py-2 border border-primary-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 bg-surface text-primary-900 outline-none font-medium"
            />
            <button type="submit" disabled={!editGroupName.trim() || editGroupName === activeGroup.name} className="px-4 py-2 font-medium bg-primary-600 hover:bg-primary-700 text-surface rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-md transition-colors">
              <Edit2 size={16} /> Save
            </button>
          </form>
          
          {showDeleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Are you sure? This cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 rounded-md transition-colors">Cancel</button>
                <button onClick={onDeleteGroup} className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">Yes, Delete</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">
              <Trash2 size={16} /> Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
