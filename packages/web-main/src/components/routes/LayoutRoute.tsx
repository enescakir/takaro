import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalFrame } from '../../frames/GlobalFrame';
import { StudioFrame } from '../../frames/StudioFrame';
import { SettingsFrame } from 'frames/SettingsFrame';
import GameServerDashboardFrame from 'frames/GameServerDashboardFrame';
import { PlayerProfileFrame } from 'frames/PlayerProfileFrame';

interface LayoutRouteProps {
  frame: 'global' | 'studio' | 'settings' | 'gameServerDashboard' | 'playerProfile';
}

export const FrameLayoutRoute: FC<LayoutRouteProps> = ({ frame }) => {
  function handleFrame() {
    switch (frame) {
      case 'global':
        return <GlobalFrame />;
      case 'studio':
        return <StudioFrame />;
      case 'settings':
        return <SettingsFrame />;
      case 'gameServerDashboard':
        return <GameServerDashboardFrame />;
      case 'playerProfile':
        return <PlayerProfileFrame />;
      default:
        return <Outlet />;
    }
  }

  return handleFrame();
};
