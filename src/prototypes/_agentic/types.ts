import type { ToolcallData } from './ToolcallCard';
import type { ReasoningStep, ReasoningData } from './ReasoningBlock';
import type { SuggType, TableSuggestion, JoinSuggestion, ColumnGroup, FormulaSuggestion } from './SuggestionCard';
import type { ChipItem } from './NextActionChips';

export type { ToolcallData, ReasoningStep, ReasoningData, SuggType, TableSuggestion, JoinSuggestion, ColumnGroup, FormulaSuggestion, ChipItem };

export interface VersionCardData {
  versionNum: number;
  label: string;
  isLatest: boolean;
  isDisabled?: boolean;
}

export interface ResponseData {
  text: string;
  isVisible: boolean;
  suggType?: SuggType | 'clarify' | 'confirmation' | 'enrich' | 'spotter_enable' | 'formula_req';
  tables?: TableSuggestion[];
  joins?: JoinSuggestion[];
  columnGroups?: ColumnGroup[];
  formulas?: FormulaSuggestion[];
  chips?: ChipItem[];
  clarifyQuestions?: string[];
  versionCard?: VersionCardData;
}

export type MessageItem =
  | { kind: 'user';   id: string; text: string }
  | { kind: 'typing'; id: string; label: string }
  | { kind: 'agent';  id: string; reasoning: ReasoningData; response: ResponseData | null };
