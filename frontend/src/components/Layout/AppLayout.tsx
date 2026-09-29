import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-primary">
      <TopBar />
      <Sidebar />
      <main className="pl-[250px] pt-14 min-h-screen">
        <div className="p-6 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
