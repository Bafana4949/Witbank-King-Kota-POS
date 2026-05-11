import React from 'react';
import { ShoppingBag, History, ChefHat, LayoutDashboard, Settings } from 'lucide-react';
import { usePOS, Tab } from '../context/POSContext';
import logo from '../../pictures/fastfood_logo.png';

export const Sidebar = () => {
  const { activeTab, setActiveTab, currentUser } = usePOS();

  return (
    <aside className="hidden sm:flex w-20 glass-dark bg-slate-900/90 flex-col items-center py-4 space-y-6 text-white shrink-0 z-[100]">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg overflow-hidden border border-slate-800">
        <img src={logo} alt="Witbank Express Logo" className="w-full h-full object-cover" />
      </div>

      <nav className="flex flex-col space-y-6 w-full items-center">
        <NavItem 
          active={activeTab === 'order'} 
          onClick={() => setActiveTab('order')} 
          icon={<ShoppingBag size={20} />} 
          label="Order" 
        />

        {currentUser?.role === 'customer' && (
          <NavItem 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History size={20} />} 
            label="History" 
          />
        )}

        {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
          <>
            <NavItem 
              active={activeTab === 'kitchen'} 
              onClick={() => setActiveTab('kitchen')} 
              icon={<ChefHat size={20} />} 
              label="Kitchen" 
            />
            <NavItem 
              active={activeTab === 'menu'} 
              onClick={() => setActiveTab('menu')} 
              icon={<Settings size={20} />} 
              label="Menu" 
            />
          </>
        )}

        {currentUser?.role === 'admin' && (
          <NavItem 
            active={activeTab === 'admin'} 
            onClick={() => setActiveTab('admin')} 
            icon={<LayoutDashboard size={20} />} 
            label="Admin" 
          />
        )}
      </nav>

      <div className="mt-auto flex flex-col items-center space-y-6 pb-4">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'menu' ? 'bg-slate-800 border-2 border-orange-500 text-orange-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all group ${active ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
  </button>
);

export const BottomNav = () => {
  const { activeTab, setActiveTab, currentUser } = usePOS();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-20 pb-safe bg-slate-900 flex items-center justify-around text-white z-[100] px-2 border-t border-slate-800 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.3)]">
      <MobileNavItem active={activeTab === 'order'} onClick={() => setActiveTab('order')} icon={<ShoppingBag size={20} />} label="Order" />
      {currentUser?.role === 'customer' && (
        <MobileNavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label="History" />
      )}
      {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
        <>
          <MobileNavItem active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} icon={<ChefHat size={20} />} label="Kitchen" />
          <MobileNavItem active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} icon={<Settings size={20} />} label="Menu" />
        </>
      )}
      {currentUser?.role === 'admin' && (
        <MobileNavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<LayoutDashboard size={20} />} label="Admin" />
      )}
    </nav>
  );
};

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-orange-500' : 'opacity-40'}`}>
    {icon}
    <span className="text-[9px] uppercase font-bold tracking-tighter">{label}</span>
  </button>
);
