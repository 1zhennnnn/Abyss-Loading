import type {
  PuzzleNode,
  CodeInputConfig,
  SequenceConfig,
  SymbolMatchConfig,
} from '../types/game.types';

/**
 * 純函式，不依賴任何 Store，方便單元測試。
 * 根據謎題類型驗證玩家答案是否正確。
 */
export function validatePuzzle(puzzle: PuzzleNode, answer: unknown): boolean {
  switch (puzzle.puzzle_type) {
    case 'CODE_INPUT': {
      const cfg = puzzle.config as CodeInputConfig;
      const input = String(answer).trim();
      return cfg.case_sensitive
        ? input === cfg.answer
        : input.toLowerCase() === cfg.answer.toLowerCase();
    }

    case 'SEQUENCE': {
      const cfg = puzzle.config as SequenceConfig;
      const submitted = answer as string[];
      if (!Array.isArray(submitted)) return false;
      if (submitted.length !== cfg.correct_order.length) return false;
      return submitted.every((id, i) => id === cfg.correct_order[i]);
    }

    case 'SYMBOL_MATCH': {
      const cfg = puzzle.config as SymbolMatchConfig;
      // answer 格式：Record<pair_id, [symbol_a_label, symbol_b_label]>
      const submitted = answer as Record<string, [string, string]>;
      if (!submitted || typeof submitted !== 'object') return false;
      return cfg.pairs.every((pair) => {
        const entry = submitted[pair.pair_id];
        if (!entry || !Array.isArray(entry)) return false;
        return (
          entry[0] === pair.symbol_a.label &&
          entry[1] === pair.symbol_b.label
        );
      });
    }

    default:
      return false;
  }
}
