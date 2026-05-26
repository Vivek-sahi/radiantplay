/**
 * Icon Registry
 * 
 * Maps icon names to their component implementations.
 * This enables dynamic icon rendering via the Icon component.
 */

import { IconComponent } from './Icon.types';

// Import all icon components
import {
  PlusIcon,
  MinusIcon,
  CrossIcon,
  CheckmarkIcon,
  CopyIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  SaveIcon,
  PencilIcon,
  TrashCanIcon,
  RefreshIcon,
  MagnifyingGlassIcon,
  CogIcon,
  FilterIcon,
  FunnelIcon,
  SortIcon,
  ExpandIcon,
  FullscreenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationIcon,
  InfoCircleIcon,
  CheckmarkCircleIcon,
  CrossCircleIcon,
  ExclamationPointCircleIcon,
  QuestionMarkIcon,
  EyeIcon,
  EyeUndoIcon,
  LockIcon,
  PinIcon,
  StarIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  ProfileIcon,
  MoreIcon,
  HamburgerIcon,
  PlayIcon,
  PauseIcon,
  AnswerIcon,
  LiveboardIcon,
  NavigateIcon,
  PaperPlaneIcon,
  CollectionIcon,
  SaveWorksheetIcon,
  SpotterIcon,
  DatabaseIcon,
} from './icons';

/**
 * Icon registry mapping kebab-case names to components
 */
export const iconRegistry: Record<string, IconComponent> = {
  // Action Icons
  'plus': PlusIcon,
  'minus': MinusIcon,
  'cross': CrossIcon,
  'checkmark': CheckmarkIcon,
  'copy': CopyIcon,
  'share': ShareIcon,
  'download': DownloadIcon,
  'upload': UploadIcon,
  'save': SaveIcon,
  'pencil': PencilIcon,
  'trash-can': TrashCanIcon,
  'refresh': RefreshIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'search': MagnifyingGlassIcon, // Alias
  'cog': CogIcon,
  'settings': CogIcon, // Alias
  'filter': FilterIcon,
  'funnel': FunnelIcon,
  'sort': SortIcon,
  'expand': ExpandIcon,
  'fullscreen': FullscreenIcon,
  
  // Navigation Icons
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'arrow-down': ArrowDownIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  
  // Status Icons
  'information': InformationIcon,
  'info-circle': InfoCircleIcon,
  'checkmark-circle': CheckmarkCircleIcon,
  'cross-circle': CrossCircleIcon,
  'exclamation-point-circle': ExclamationPointCircleIcon,
  'question-mark': QuestionMarkIcon,
  
  // UI Icons
  'eye': EyeIcon,
  'eye-undo': EyeUndoIcon,
  'lock': LockIcon,
  'pin': PinIcon,
  'star': StarIcon,
  'tag': TagIcon,
  'folder': FolderIcon,
  'clock': ClockIcon,
  'profile': ProfileIcon,
  'more': MoreIcon,
  'hamburger': HamburgerIcon,
  'play': PlayIcon,
  'pause': PauseIcon,
  
  // ThoughtSpot Product Icons
  'answer': AnswerIcon,
  'liveboard': LiveboardIcon,
  'navigate': NavigateIcon,
  'paper-plane': PaperPlaneIcon,
  'collection': CollectionIcon,
  'save-worksheet': SaveWorksheetIcon,
  'spotter': SpotterIcon,
  'database': DatabaseIcon,
} as const;

/**
 * Get list of all registered icon names
 */
export const getRegisteredIconNames = (): string[] => {
  return Object.keys(iconRegistry);
};

/**
 * Check if an icon name is registered
 */
export const isIconRegistered = (name: string): boolean => {
  return name in iconRegistry;
};

export default iconRegistry;
