import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserGroups } from '../services/api';
import { useSocket } from './useSocket';

export const useSidebarQuery = (userId) => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: groups = [], isLoading, isError } = useQuery({
    queryKey: ['userGroups', userId],
    queryFn: () => fetchUserGroups(userId),
    enabled: !!userId,
    staleTime: Infinity, // Rely on socket events for real-time invalidation
  });

  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewGroupAdded = ({ group }) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [group];
        if (oldGroups.find(g => g._id === group._id)) return oldGroups;
        return [...oldGroups, group];
      });
      socket.emit('join_room', group._id);
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.filter(g => g._id !== groupId);
      });
      socket.emit('leave_room', groupId);
    };

    const handleMemberAdded = ({ groupId, user: newUser }) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.map(g => {
          if (g._id === groupId) {
            return { ...g, members: [...g.members, newUser] };
          }
          return g;
        });
      });
    };

    const handleMemberRemoved = ({ groupId, userId: removedUserId }) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.map(g => {
          if (g._id === groupId) {
            return { ...g, members: g.members.filter(m => m._id !== removedUserId) };
          }
          return g;
        });
      });
    };

    const handleGroupUpdated = (updatedGroup) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.map(g => g._id === updatedGroup._id ? updatedGroup : g);
      });
    };

    const handleGroupDeleted = ({ groupId }) => {
      queryClient.setQueryData(['userGroups', userId], (oldGroups) => {
        if (!oldGroups) return [];
        return oldGroups.filter(g => g._id !== groupId);
      });
      // Optionally leave room if not already disconnected
      socket.emit('leave_room', groupId);
    };

    socket.on('new_group_added', handleNewGroupAdded);
    socket.on('removed_from_group', handleRemovedFromGroup);
    socket.on('member_added', handleMemberAdded);
    socket.on('member_removed', handleMemberRemoved);
    socket.on('group_updated', handleGroupUpdated);
    socket.on('group_deleted', handleGroupDeleted);

    return () => {
      socket.off('new_group_added', handleNewGroupAdded);
      socket.off('removed_from_group', handleRemovedFromGroup);
      socket.off('member_added', handleMemberAdded);
      socket.off('member_removed', handleMemberRemoved);
      socket.off('group_updated', handleGroupUpdated);
      socket.off('group_deleted', handleGroupDeleted);
    };
  }, [socket, userId, queryClient]);

  // Derived arrays for easy access in UI
  const directMessages = groups.filter(g => g.isDirectMessage);
  const standardGroups = groups.filter(g => !g.isDirectMessage);

  return {
    groups,
    directMessages,
    standardGroups,
    isLoading,
    isError
  };
};
