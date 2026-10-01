import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-primary">
      <TopBar />
      <Sidebar />
      <main className="pl-[250px] pt-14 min-h-screen bg-primary">
        <div className="p-6 h-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
