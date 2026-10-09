import React, { useState } from 'react';
import { createGroup, addMember, removeMember, getAllUsers, createOrGetDirectChat, updateGroup, deleteGroup } from '../../services/api';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import NavigationSidebar from '../layout/NavigationSidebar';
import SidebarHeader from '../layout/SidebarHeader';
import { useSidebarQuery } from '../../hooks/useSidebarQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Users, MessageCircle, MessageSquare, Settings } from 'lucide-react';
import TreasureHuntGame from '../game/TreasureHuntGame';

// Modals
import DirectoryModal from '../modals/DirectoryModal';
import CreateGroupModal from '../modals/CreateGroupModal';
import GroupSettingsModal from '../modals/GroupSettingsModal';
import ManageMembersModal from '../modals/ManageMembersModal';

const GroupDashboard = ({ user, onLogout }) => {
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('dms'); 
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [editGroupName, setEditGroupName] = useState('');

  // Use TanStack Query to manage the sidebar data
  const { groups, directMessages, standardGroups, isLoading } = useSidebarQuery(user._id);
  const queryClient = useQueryClient();

  // Derived state: perfectly synced automatically
  const activeGroup = groups.find(g => g._id === activeGroupId) || null;

  const loadAllUsers = async () => {
    try {
      const data = await getAllUsers(user._id);
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const openDirectory = () => {
    loadAllUsers();
    setShowDirectoryModal(true);
  };

  const handleStartDirectChat = async (targetUserId) => {
    try {
      const dm = await createOrGetDirectChat(user._id, targetUserId);
      
      // Instantly update cache so it appears immediately before the socket event arrives
      queryClient.setQueryData(['userGroups', user._id], (oldGroups) => {
        if (!oldGroups) return [dm];
        if (oldGroups.find(g => g._id === dm._id)) return oldGroups;
        return [...oldGroups, dm];
      });

      setActiveGroupId(dm._id);
      setShowDirectoryModal(false);
    } catch (err) {
      alert("Failed to start direct chat");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const group = await createGroup(newGroupName, user._id);
      
      queryClient.setQueryData(['userGroups', user._id], (oldGroups) => {
        if (!oldGroups) return [group];
        if (oldGroups.find(g => g._id === group._id)) return oldGroups;
        return [...oldGroups, group];
      });

      setActiveGroupId(group._id);
      setShowCreateModal(false);
      setNewGroupName('');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const handleUpdateGroupName = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim() || editGroupName === activeGroup.name) return;
    try {
      await updateGroup(activeGroup._id, editGroupName, user._id);
      // Optimistic update
      queryClient.setQueryData(['userGroups', user._id], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.map(g => g._id === activeGroup._id ? { ...g, name: editGroupName } : g);
      });
      alert('Group name updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update group name");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(activeGroup._id, user._id);
      setActiveGroupId(null);
      setShowManageModal(false);
      setShowSettingsModal(false);
      // Remove from cache optimistically
      queryClient.setQueryData(['userGroups', user._id], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.filter(g => g._id !== activeGroup._id);
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete group");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberUsername.trim() || !activeGroup) return;
    try {
      await addMember(activeGroup._id, newMemberUsername, user._id);
      setNewMemberUsername('');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeGroup) return;
    try {
      await removeMember(activeGroup._id, memberId, user._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  const isAdmin = activeGroup && activeGroup.admin._id === user._id;

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background text-primary-600">Loading your chats...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      
      {/* THIN LEFT SIDEBAR (Navigation) */}
      <NavigationSidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />

      {/* SECONDARY SIDEBAR (List) — hidden when game tab is active */}
      {activeTab !== 'game' && (
        <div className="w-64 bg-surface border-r border-primary-200 flex flex-col h-full overflow-hidden shrink-0 z-10 shadow-sm">
          <SidebarHeader 
            activeTab={activeTab} 
            openDirectory={openDirectory} 
            setShowCreateModal={setShowCreateModal} 
          />
          
          <div className="flex-1 overflow-y-auto text-primary-900 py-2">
            {activeTab === 'dms' && (
              <div>
                {directMessages.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-primary-600">No direct messages yet.</div>
                ) : (
                  directMessages.map(dm => {
                    const otherUser = dm.members.find(m => m._id !== user._id) || user;
                    return (
                      <button
                        key={dm._id}
                        onClick={() => setActiveGroupId(dm._id)}
                        className={`w-full text-left px-3 py-1.5 border-b border-transparent hover:bg-primary-100 transition-colors flex items-center gap-2.5 ${activeGroupId === dm._id ? 'bg-primary-100 shadow-sm relative z-10 font-medium' : ''}`}
                      >
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-bold text-xs">
                            {otherUser.username.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-[1.5px] border-surface rounded-full ${otherUser.isOnline ? 'bg-green-500' : 'bg-primary-300'}`}></div>
                        </div>
                        <div className="text-[13px] truncate text-primary-900">{otherUser.username}</div>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'groups' && (
              <div>
                {standardGroups.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-primary-600">No groups yet.</div>
                ) : (
                  standardGroups.map(group => (
                    <button
                      key={group._id}
                      onClick={() => setActiveGroupId(group._id)}
                      className={`w-full text-left px-3 py-1.5 border-b border-transparent hover:bg-primary-100 transition-colors flex items-center gap-2.5 ${activeGroupId === group._id ? 'bg-primary-100 shadow-sm relative z-10 font-medium' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary-200 text-primary-700 flex items-center justify-center">
                        <MessageSquare size={14} />
                      </div>
                      <div className="text-[13px] truncate text-primary-900">{group.name}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Treasure Hunt Game — takes full width */}
        {activeTab === 'game' ? (
          <TreasureHuntGame user={user} />
        ) : activeGroup ? (
          <>
            <div className="h-16 bg-surface px-6 border-b border-primary-200 flex justify-between items-center shadow-sm z-10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                  {activeGroup.isDirectMessage ? (
                    <>
                      {activeGroup.members.find(m => m._id !== user._id)?.username || 'Myself'}
                    </>
                  ) : (
                    activeGroup.name
                  )}
                </h2>
                {!activeGroup.isDirectMessage && (
                  <p className="text-xs text-primary-800">Admin: {activeGroup.admin.username === user.username ? 'You' : activeGroup.admin.username}</p>
                )}
              </div>
              {!activeGroup.isDirectMessage && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowManageModal(true)}
                    className="flex items-center gap-2 text-sm bg-primary-100 hover:bg-primary-200 text-primary-900 px-3 py-1.5 rounded-md transition-colors font-medium"
                  >
                    <Users size={16} /> Members ({activeGroup.members?.length || 0})
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setEditGroupName(activeGroup.name);
                        setShowDeleteConfirm(false);
                        setShowSettingsModal(true);
                      }}
                      className="flex items-center gap-2 text-sm bg-primary-100 hover:bg-primary-200 text-primary-900 px-3 py-1.5 rounded-md transition-colors font-medium"
                      title="Group Settings"
                    >
                      <Settings size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <MessageList room={activeGroup._id} currentUserId={user._id} />
            <ChatInput room={activeGroup._id} currentUserId={user._id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-primary-600 flex-col">
            <MessageCircle size={64} className="mb-4 opacity-10" />
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {showDirectoryModal && (
        <DirectoryModal 
          onClose={() => setShowDirectoryModal(false)} 
          allUsers={allUsers} 
          onStartDirectChat={handleStartDirectChat} 
        />
      )}

      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateGroup}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
        />
      )}

      {showSettingsModal && activeGroup && !activeGroup.isDirectMessage && isAdmin && (
        <GroupSettingsModal 
          onClose={() => setShowSettingsModal(false)}
          activeGroup={activeGroup}
          editGroupName={editGroupName}
          setEditGroupName={setEditGroupName}
          onUpdateGroup={handleUpdateGroupName}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {showManageModal && activeGroup && !activeGroup.isDirectMessage && (
        <ManageMembersModal 
          onClose={() => setShowManageModal(false)}
          activeGroup={activeGroup}
          isAdmin={isAdmin}
          newMemberUsername={newMemberUsername}
          setNewMemberUsername={setNewMemberUsername}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          user={user}
        />
      )}
    </div>
  );
};

export default GroupDashboard;
