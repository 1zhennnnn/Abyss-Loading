import React from 'react';
import useGameStore from './store/useGameStore';
import HubScene from './hub/HubScene';
import { GameEngine } from './components/GameEngine';

const App: React.FC = () => {
  const gamePhase = useGameStore((s) => s.gamePhase);

  // HUB 階段顯示主神空間，其他階段一律交給 GameEngine 處理
  if (gamePhase === 'HUB') {
    return <HubScene />;
  }

  return <GameEngine />;
};

export default App;
