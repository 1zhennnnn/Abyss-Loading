import scenes        from './scenes.json';
import dialogues     from './dialogues.json';
import itemsData     from './items.json';
import puzzles       from './puzzles.json';
import fortuneRitual from './fortune_ritual.json';
import type { InstanceManifest } from '../../types/game.types';

const manifest: InstanceManifest = {
  id: 'song_wang',
  name: '燒王船',
  entry_scene: 'day1_arrival',
  fortune_ritual: fortuneRitual as InstanceManifest['fortune_ritual'],
  scenes:        scenes        as InstanceManifest['scenes'],
  dialogues:     dialogues     as InstanceManifest['dialogues'],
  items:         itemsData     as unknown as InstanceManifest['items'],
  puzzles:       puzzles       as InstanceManifest['puzzles'],
};

export default manifest;
