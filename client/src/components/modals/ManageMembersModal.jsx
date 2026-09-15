import React from 'react';
import { UserPlus, UserMinus } from 'lucide-react';

const ManageMembersModal = ({
  onClose,
  activeGroup,
  isAdmin,
  newMemberUsername,
  setNewMemberUsername,
  onAddMember,
  onRemoveMember,
  user
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center text-primary-900">
          <span className="font-bold text-lg">Members ({activeGroup.members?.length})</span>
          <button onClick={onClose} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md text-xl leading-none">&times;</button>
        </div>

        {isAdmin && (
          <form onSubmit={onAddMember} className="px-4 pb-4 border-b border-primary-200 bg-surface flex gap-2">
            <input
              type="text"
              placeholder="Username to invite..."
              value={newMemberUsername}
              onChange={(e) => setNewMemberUsername(e.target.value)}
              className="flex-1 px-4 py-2 border border-primary-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 bg-surface text-primary-900 outline-none text-sm"
            />
            <button type="submit" disabled={!newMemberUsername.trim()} className="px-4 py-2 font-medium bg-primary-100 hover:bg-primary-200 text-primary-900 border border-primary-200 rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors">
              <UserPlus size={16} /> Invite
            </button>
          </form>
        )}

        <div className="p-2 flex-1 overflow-y-auto bg-background/50">
          {activeGroup.members?.map(member => (
            <div key={member._id} className="flex justify-between items-center p-3 mb-1 bg-surface hover:bg-primary-100 rounded-lg shadow-sm border border-transparent hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-bold text-sm">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary-900 flex items-center gap-2">
                    {member.username} 
                    {activeGroup.admin._id === member._id && <span className="text-[10px] bg-primary-500 text-surface px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>}
                  </div>
                </div>
              </div>
              
              {isAdmin && member._id !== user._id && (
                <button 
                  onClick={() => onRemoveMember(member._id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <UserMinus size={16} /> <span className="hidden sm:inline">Kick</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageMembersModal;
