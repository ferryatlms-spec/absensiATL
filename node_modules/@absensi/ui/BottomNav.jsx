import React from 'react';

export const BottomNav = ({ activeTab, setActiveTab, userRole }) => {
  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'absen', icon: 'fingerprint', label: 'Absen' },
    { id: 'rekap', icon: 'assignment', label: 'Rekap' },
    { id: 'agenda', icon: 'event_note', label: 'Agenda' },
    { id: 'profil', icon: 'person', label: 'Profil' },
  ];

  if (userRole === 'PIC') {
    navItems.splice(3, 0, { id: 'team', icon: 'groups', label: 'MyTim' });
  }

  return (
    <nav 
  // px-10 memberikan jarak 40px dari tepi
  className="fixed bottom-6 w-[92%] max-w-md z-[100] flex justify-center items-center px-6 py-3 bg-white backdrop-blur-xl border border-white/30 shadow-2xl rounded-full"
  style={{ left: '50%', transform: 'translateX(-50%)' }}
>
  {navItems.map((item) => {
    const isActive = activeTab.toLowerCase() === item.id.toLowerCase();

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        // flex-1 memastikan setiap 'slot' tombol memiliki lebar yang sama persis
        className="flex-1 flex flex-col items-center justify-center relative outline-none"
      >
        <div
          className={`
            flex flex-col items-center justify-center transition-all duration-500 ease-out
            ${isActive 
              ? "bg-gradient-to-br from-[#390008] to-[#600014] text-white w-14 h-14 rounded-full -translate-y-2 shadow-lg scale-110" 
              : "text-stone-500 w-10 h-10 translate-y-0 scale-100"
            }
          `}
        >
          <span className="material-symbols-outlined text-[24px]">
            {item.icon}
          </span>
          {isActive && (
            <span className="font-inter text-[8px] font-bold uppercase mt-0.5">
              {item.label}
            </span>
          )}
        </div>

        {!isActive && (
          <span className="font-inter text-[8px] font-bold uppercase text-stone-600 mt-1">
            {item.label}
          </span>
        )}
      </button>
    );
  })}
</nav>
  );
};