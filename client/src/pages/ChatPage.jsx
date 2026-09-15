import React, { useState } from 'react';
import { SocketProvider } from '../contexts/SocketContext';
import { loginUser, createGroup, addMember, removeMember, getAllUsers, createOrGetDirectChat, updateGroup, deleteGroup } from '../services/api';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import NavigationSidebar from '../components/layout/NavigationSidebar';
import SidebarHeader from '../components/layout/SidebarHeader';
import { useSidebarQuery } from '../hooks/useSidebarQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Users, UserMinus, UserPlus, MessageCircle, MessageSquare, Edit2, Trash2, AlertTriangle, Settings } from 'lucide-react';

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

      {/* SECONDARY SIDEBAR (List) */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {activeGroup ? (
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

      {/* Global User Directory Modal */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-primary-200 font-bold text-lg flex justify-between items-center text-primary-900 bg-surface">
              Start a Conversation
              <button onClick={() => setShowDirectoryModal(false)} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md">&times;</button>
            </div>
            <div className="p-2 flex-1 overflow-y-auto bg-background/50">
              {allUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-primary-600">No other users found.</div>
              ) : (
                allUsers.map(u => (
                  <button
                    key={u._id}
                    onClick={() => handleStartDirectChat(u._id)}
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
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-primary-200 font-bold text-lg text-primary-900">Create New Group</div>
            <form onSubmit={handleCreateGroup} className="p-6 bg-background/50">
              <input
                autoFocus
                type="text"
                placeholder="Enter group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-surface text-primary-900 outline-none mb-6 shadow-sm"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-medium text-primary-800 hover:bg-primary-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={!newGroupName.trim()} className="px-6 py-2 font-medium bg-primary-600 hover:bg-primary-700 text-surface rounded-lg disabled:opacity-50 transition-colors shadow-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Settings Modal (Admin Only) */}
      {showSettingsModal && activeGroup && !activeGroup.isDirectMessage && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center text-primary-900">
              <span className="font-bold text-lg">Group Settings</span>
              <button onClick={() => setShowSettingsModal(false)} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md text-xl leading-none">&times;</button>
            </div>
            
            <div className="p-4 bg-background/30 flex flex-col gap-4">
              <form onSubmit={handleUpdateGroupName} className="flex gap-2">
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
                    <button onClick={handleDeleteGroup} className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">Yes, Delete</button>
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
      )}

      {/* Manage Members Modal */}
      {showManageModal && activeGroup && !activeGroup.isDirectMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center text-primary-900">
              <span className="font-bold text-lg">Members ({activeGroup.members?.length})</span>
              <button onClick={() => setShowManageModal(false)} className="text-primary-600 hover:text-primary-800 bg-primary-50 p-1 rounded-md text-xl leading-none">&times;</button>
            </div>

            {isAdmin && (
              <form onSubmit={handleAddMember} className="px-4 pb-4 border-b border-primary-200 bg-surface flex gap-2">
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
                      onClick={() => handleRemoveMember(member._id)}
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
      )}
    </div>
  );
};

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);
    try {
      const userData = await loginUser(username);
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <SocketProvider userId={user._id}>
        <GroupDashboard user={user} onLogout={() => setUser(null)} />
      </SocketProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md border border-primary-200">
        <h1 className="text-3xl font-bold text-center text-primary-900 mb-8">Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background border border-primary-300 text-primary-900 focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              placeholder="Enter your username"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-surface font-semibold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-70"
          >
            {isLoading ? 'Connecting...' : 'Login & Chat'}
          </button>
        </form>
      </div>
    </div>
  );
}
