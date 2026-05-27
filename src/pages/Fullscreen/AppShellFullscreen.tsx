import React from 'react';
import { AppShell } from '@components/AppShell';

/**
 * AppShell at full viewport — no Radiant chrome around it. Linked from the
 * AppShell doc page via the "View fullscreen ↗" link.
 */
export const AppShellFullscreen: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <AppShell
        headerProps={{
          userName: 'Demo User',
          notificationCount: 2,
          onSearchClick: () => undefined,
          onLogoClick: () => undefined,
        }}
        sidebarProps={{
          tabs: [
            { id: 'insights', label: 'Insights', headerTitle: 'Insights', showAddButton: true },
            { id: 'data', label: 'Data', headerTitle: 'Data workspace' },
            { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
          ],
          activeTab: 'insights',
          onTabChange: () => undefined,
          categories: {
            insights: [
              { title: 'Main', items: [
                { id: 'Home', label: 'Home' },
                { id: 'Spotter', label: 'Spotter' },
                { id: 'Search data', label: 'Search data' },
              ]},
              { title: 'Library', items: [
                { id: 'Liveboards', label: 'Liveboards' },
                { id: 'Answers', label: 'Answers' },
                { id: 'Collections', label: 'Collections' },
              ]},
            ],
            data: [
              { title: 'Main', items: [{ id: 'Data objects', label: 'Data objects' }] },
            ],
            admin: [
              { title: 'Overview', items: [{ id: 'Resource control centre', label: 'Resource control centre' }] },
            ],
          },
          selectedNav: 'Home',
          onNavSelect: () => undefined,
        }}
      >
        <div style={{ padding: 32, height: '100%', overflowY: 'auto' }}>
          <h1 style={{ fontFamily: '"Plain", sans-serif', fontSize: 28, fontWeight: 600, margin: 0 }}>Home</h1>
          <p style={{ marginTop: 8, color: '#777E8B', maxWidth: 700 }}>
            Fullscreen preview of AppShell. The header and sidebar are composed automatically; the content area fills the rest of the viewport.
          </p>
        </div>
      </AppShell>
    </div>
  );
};

export default AppShellFullscreen;
