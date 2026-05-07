import React from 'react';
import { AnimatePresence } from 'motion/react';
import { usePOS } from './context/POSContext';
import { Sidebar, BottomNav } from './components/Navigation';
import { Header } from './components/Header';
import { MenuArea } from './components/MenuArea';
import { CartArea } from './components/CartArea';
import { HistoryTab } from './components/HistoryTab';
import { KitchenTab } from './components/KitchenTab';
import { AdminTab } from './components/AdminTab';
import { MenuTab } from './components/MenuTab';
import { Modals } from './components/Modals';

const App = () => {
  const { activeTab } = usePOS();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-600 overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative pb-16 sm:pb-0">
        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'order' && (
              <div key="order" className="flex-1 flex overflow-hidden">
                <MenuArea />
                <CartArea />
              </div>
            )}

            {activeTab === 'history' && <HistoryTab key="history" />}
            {activeTab === 'kitchen' && <KitchenTab key="kitchen" />}
            {activeTab === 'admin' && <AdminTab key="admin" />}
            {activeTab === 'menu' && <MenuTab key="menu" />}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav />
      </main>

      {/* Global Modals & Overlays */}
      <Modals />
    </div>
  );
};

export default App;
