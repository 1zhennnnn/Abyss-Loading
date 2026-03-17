import React from 'react';
import type { FortuneRitualDef, FortuneCard, RitualStyle } from '../../types/game.types';
import { StarChartRitual } from './StarChartRitual';
import { OmikujiRitual } from './OmikujiRitual';
import { TarotRitual } from './TarotRitual';
import { CoinDivinationRitual } from './CoinDivinationRitual';
import { PunchClockRitual } from './PunchClockRitual';

export interface RitualProps {
  ritualDef: FortuneRitualDef;
  onComplete: (card: FortuneCard, isReversed?: boolean) => void;
}

// Engine 透過 ritualMap 分派，無任何 if/switch 判斷 ritual_style
const ritualMap: Record<RitualStyle, React.FC<RitualProps>> = {
  STAR_CHART:      StarChartRitual,
  OMIKUJI:         OmikujiRitual,
  TAROT:           TarotRitual,
  COIN_DIVINATION: CoinDivinationRitual,
  PUNCH_CLOCK:     PunchClockRitual,
};

export const FortuneRitual: React.FC<RitualProps> = ({ ritualDef, onComplete }) => {
  const RitualComponent = ritualMap[ritualDef.ritual_style];

  return (
    <div className="ritual-overlay">
      <div className="ritual-title">{ritualDef.ritual_title}</div>
      {ritualDef.ritual_subtitle && (
        <div className="ritual-subtitle">{ritualDef.ritual_subtitle}</div>
      )}
      <RitualComponent ritualDef={ritualDef} onComplete={onComplete} />
    </div>
  );
};
