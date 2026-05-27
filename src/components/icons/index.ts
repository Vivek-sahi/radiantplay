/**
 * Icon System
 * 
 * A comprehensive icon library with size variants and easy swapping support.
 * 
 * Usage:
 * ```tsx
 * // Using the Icon component (recommended for dynamic icons)
 * import { Icon } from './components/icons';
 * <Icon name="plus" size="m" />
 * 
 * // Using individual icon components (for static icons)
 * import { PlusIcon, ChevronDownIcon } from './components/icons';
 * <PlusIcon size="l" color="#333" />
 * ```
 */

// Main Icon component
export { Icon, isValidIconName, getIconNames } from './Icon';
export type { default as IconDefault } from './Icon';

// Pre-computed icon names array for convenience
import { getIconNames as _getIconNames } from './Icon';
export const iconNames = _getIconNames();

// Types
export type {
  IconProps,
  BaseIconProps,
  IconComponent,
  IconName,
  IconSize,
} from './Icon.types';

// Registry
export { iconRegistry, getRegisteredIconNames, isIconRegistered } from './registry';

// Individual icon components for direct import
export * from './icons';

// Re-export all individual icons with their names
export {
  // Action Icons
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
  // Navigation Icons
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  // Status Icons
  InformationIcon,
  InfoCircleIcon,
  CheckmarkCircleIcon,
  CrossCircleIcon,
  ExclamationPointCircleIcon,
  QuestionMarkIcon,
  // UI Icons
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
  // Data Icons
  DatabaseIcon,

  // ThoughtSpot Product Icons
  AnswerIcon,
  LiveboardIcon,
  NavigateIcon,
  PaperPlaneIcon,
  CollectionIcon,
  SaveWorksheetIcon,
  SpotterIcon,
} from './icons';

// Legacy exports - keeping backward compatibility with existing icons
// These map to the new icon system
import { InformationIcon } from './icons/Information';
import { CheckmarkCircleIcon } from './icons/CheckmarkCircle';
import { ExclamationPointCircleIcon } from './icons/ExclamationPointCircle';
import { CrossCircleIcon } from './icons/CrossCircle';

// Legacy aliases for existing components
export const InfoIcon = InformationIcon;
export const SuccessIcon = CheckmarkCircleIcon;
export const WarningIcon = ExclamationPointCircleIcon;
export const ErrorIcon = CrossCircleIcon;
export const CloseIcon = CrossIcon;
export const CloseIconSimple = CrossIcon;
export const SearchIcon = MagnifyingGlassIcon;
export const SettingsIcon = CogIcon;
export const TrashIcon = TrashCanIcon;
export const EditIcon = PencilIcon;

// Import for legacy re-export
import { CrossIcon } from './icons/Cross';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlass';
import { CogIcon } from './icons/Cog';
import { TrashCanIcon } from './icons/TrashCan';
import { PencilIcon } from './icons/Pencil';
