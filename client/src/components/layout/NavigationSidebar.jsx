import React from 'react';
import { LogOut, MessageCircle, Users } from 'lucide-react';

const NavigationSidebar = ({ user, activeTab, setActiveTab, onLogout }) => (
  <div className="w-16 bg-primary-900 flex flex-col items-end py-4 gap-4 z-20 shrink-0">
    <div className="w-10 h-10 rounded-full bg-primary-500 text-surface flex items-center justify-center font-bold text-xl mb-2 shadow-md mr-3">
      {user.username.charAt(0).toUpperCase()}
    </div>
    
    <div className="w-8 h-px bg-primary-800 mb-2 mr-4"></div>
    <div className="relative flex flex-col items-end gap-4 w-full mt-2">
      {/* Sliding Background Indicator */}
      <div 
        className="absolute right-0 w-14 h-12 nav-tab-active transition-transform duration-300 ease-in-out"
        style={{ transform: activeTab === 'dms' ? 'translateY(0)' : 'translateY(calc(100% + 1rem))' }}
      ></div>

      <button 
        onClick={() => setActiveTab('dms')}
        className={`relative z-40 p-3 w-14 flex items-center justify-center transition-colors ${activeTab === 'dms' ? 'text-primary-600' : 'text-primary-400 hover:bg-primary-800 hover:text-surface rounded-xl mr-1'}`}
        title="Direct Messages"
      >
        <MessageCircle size={24} />
      </button>
      
      <button 
        onClick={() => setActiveTab('groups')}
        className={`relative z-40 p-3 w-14 flex items-center justify-center transition-colors ${activeTab === 'groups' ? 'text-primary-600' : 'text-primary-400 hover:bg-primary-800 hover:text-surface rounded-xl mr-1'}`}
        title="Groups"
      >
        <Users size={24} />
      </button>
    </div>
    
    <div className="mt-auto mr-1">
      <button onClick={onLogout} title="Logout" className="p-3 text-primary-400 hover:text-surface hover:bg-primary-800 rounded-xl transition-colors">
        <LogOut size={24} />
      </button>
    </div>
  </div>
);

export default NavigationSidebar;
