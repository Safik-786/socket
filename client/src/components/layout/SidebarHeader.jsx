import React from 'react';
import { Plus } from 'lucide-react';

const SidebarHeader = ({ activeTab, openDirectory, setShowCreateModal }) => (
  <div className="h-16 px-4 border-b border-primary-200 flex justify-between items-center bg-surface shrink-0">
    <div className="font-bold text-lg text-primary-900">
      {activeTab === 'dms' ? 'Direct Messages' : 'Groups'}
    </div>
    {activeTab === 'dms' ? (
      <button onClick={openDirectory} className="text-primary-600 hover:bg-primary-100 hover:text-primary-800 p-1.5 rounded-md transition-colors">
        <Plus size={18} />
      </button>
    ) : (
      <button onClick={() => setShowCreateModal(true)} className="text-primary-600 hover:bg-primary-100 hover:text-primary-800 p-1.5 rounded-md transition-colors">
        <Plus size={18} />
      </button>
    )}
  </div>
);

export default SidebarHeader;
