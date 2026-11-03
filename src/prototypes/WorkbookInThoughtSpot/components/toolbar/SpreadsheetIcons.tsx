/**
 * Spreadsheet toolbar icons.
 *
 * Exported from the ThoughtSpot "Spreadsheet — Search Data Improvements" Figma
 * (file 5LFnxv5fom9nu64N48aJzl, node 1863-164897 "Spreadsheets icon list"),
 * which is the source of truth for this toolbar.
 *
 * These are the icons Radiant does not carry yet — it has no cell-formatting
 * set, since nothing in the product needed one before. Everything else in the
 * toolbar uses the shared Radiant `Icon` component: undo, redo, funnel,
 * number-format, conditional-format, formula, expand, upload, cross.
 *
 * Kept prototype-local deliberately. They are real ThoughtSpot icons headed for
 * Radiant eventually, but adding to the shared design system is a change to
 * make deliberately, not mid-demo-build. Promote by moving this file into
 * src/components/icons and deleting it here.
 *
 * Each glyph keeps its exported geometry, centred inside a 14x14 box so the set
 * optically aligns; fills are currentColor so they inherit like Radiant icons.
 *
 * GENERATED — re-export from Figma rather than hand-editing the paths.
 *
 * ⚠️ AlignRightIcon is currently wrong. The `Alignment - right` node exports
 * with its bars starting at x=0, identical to `Alignment - left` bar the third
 * bar's y differing by 0.2px — so it renders left-aligned. Looks like the
 * instance on that row is set to the wrong component variant in the Figma.
 * Not corrected here: mirroring it would be a guess dressed up as an export.
 * Fix the Figma and re-export, or mirror deliberately with a note.
 */
import React from 'react';

export interface SpreadsheetIconProps {
  size?: number;
  color?: string;
  className?: string;
}

type Glyph = React.FC<SpreadsheetIconProps>;

const make = (body: string): Glyph => ({ size = 14, color = 'currentColor', className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    style={{ color, flexShrink: 0, display: 'block' }}
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: body }}
  />
);

export const AdvancedSortingIcon: Glyph = make(`<g transform="translate(0.0 1.867)"><g><path d="M4.29882 0.000199318H3.01559V7.8051L0.907378 5.69689L0 6.60427L3.01559 9.61986V9.6244H3.02013L3.66176 10.266L7.32351 6.60427L6.41613 5.69689L4.29882 7.8142V0.000199318Z" fill="currentColor"/><path d="M10.9753 10.2658H9.6921V2.46092L7.58389 4.56914L6.67651 3.66176L9.6921 0.646165V0.641622H9.69665L10.3383 0L14 3.66176L13.0926 4.56914L10.9753 2.45182V10.2658Z" fill="currentColor"/></g></g>`);
export const AlignCenterIcon: Glyph = make(`<g transform="translate(0.782 2.061)"><path d="M0 0H12.4352V1.5335H0V0ZM2.17036 4.09302H10.2258V5.60696H2.17036V4.09302ZM4.20638 8.33168H8.242V9.87769H4.20638V8.33168Z" fill="currentColor"/></g>`);
export const AlignLeftIcon: Glyph = make(`<g transform="translate(0.782 2.061)"><path d="M5.58794e-09 0H12.4352V1.5335H5.58794e-09V0ZM0 4.09302H8.24575V5.60696H0V4.09302ZM4.14997e-06 8.14375H10.2208V9.87769H4.14997e-06V8.14375Z" fill="currentColor"/></g>`);
export const AlignRightIcon: Glyph = make(`<g transform="translate(0.782 2.061)"><path d="M5.58794e-09 0H12.4352V1.5335H5.58794e-09V0ZM0 4.09302H8.24575V5.60696H0V4.09302ZM4.14997e-06 8.36027H10.2208V9.87769H4.14997e-06V8.36027Z" fill="currentColor"/></g>`);
export const ColumnSizeIcon: Glyph = make(`<g transform="translate(0.776 0.778)"><g><path d="M1.5 12.4443H0V0.0136719H1.5V12.4443Z" fill="currentColor"/><path d="M12.4482 12.4307H10.9482V0H12.4482V12.4307Z" fill="currentColor"/><path d="M4.48438 6.97852H2.20703V5.47852H4.48438V6.97852Z" fill="currentColor"/><path d="M7.36914 6.97852H5.09082V5.47852H7.36914V6.97852Z" fill="currentColor"/><path d="M10.2529 6.97852H7.97461V5.47852H10.2529V6.97852Z" fill="currentColor"/></g></g>`);
export const CurrencyIcon: Glyph = make(`<g transform="translate(2.25 -0.007)"><g><path d="M5.5 14.0137H4V0H5.5V14.0137Z" fill="currentColor"/><path d="M8.83301 3.75684H3.08301C2.62915 3.75691 2.21299 3.91267 1.92188 4.16211C1.63426 4.40864 1.5 4.7159 1.5 5.00684C1.5 5.29777 1.63426 5.60503 1.92188 5.85156C2.21299 6.101 2.62915 6.25676 3.08301 6.25684H6.41699C7.20048 6.25691 7.97079 6.52296 8.55469 7.02344C9.14216 7.52705 9.5 8.23696 9.5 9.00684C9.5 9.77671 9.14216 10.4866 8.55469 10.9902C7.97079 11.4907 7.20048 11.7568 6.41699 11.7568H0V10.2568H6.41699C6.87085 10.2568 7.28701 10.101 7.57812 9.85156C7.86574 9.60503 8 9.29777 8 9.00684C8 8.7159 7.86574 8.40864 7.57812 8.16211C7.28701 7.91267 6.87085 7.75691 6.41699 7.75684H3.08301C2.29952 7.75676 1.52921 7.49072 0.945312 6.99023C0.357841 6.48663 0 5.77671 0 5.00684C0 4.23696 0.357841 3.52705 0.945312 3.02344C1.52921 2.52295 2.29952 2.25691 3.08301 2.25684H8.83301V3.75684Z" fill="currentColor"/></g></g>`);
export const IncreaseDecimalIcon: Glyph = make(`<g transform="translate(0.134 -0.02)"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M12.958 9.94141H12.9619L13.0352 10.0146L13.7314 10.7158L13.5547 10.8916L10.4082 14.0391L9.31836 12.9492L10.7861 11.4814L4.80176 11.4805V9.94043L10.7783 9.94141L9.31836 8.48145L10.4082 7.3916L12.958 9.94141ZM9.67188 8.48145L11.3809 10.1904L9.67285 8.48047L9.67188 8.48145Z" fill="currentColor"/><path d="M0.756836 5.37207C1.17075 5.37243 1.50684 5.70808 1.50684 6.12207C1.50684 6.53606 1.17075 6.87172 0.756836 6.87207H0.75C0.335899 6.87194 0 6.5362 0 6.12207C0 5.70794 0.335899 5.3722 0.75 5.37207H0.756836Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4.54492 0.0390625C5.87946 0.0392384 6.96094 1.12147 6.96094 2.45605V4.45605C6.96076 5.79048 5.87935 6.87189 4.54492 6.87207C3.21057 6.87181 2.12811 5.79043 2.12793 4.45605V2.45605C2.12793 1.12153 3.21046 0.0393264 4.54492 0.0390625ZM4.54492 1.53906C4.03889 1.53933 3.62793 1.94996 3.62793 2.45605V4.45605C3.62811 4.962 4.03899 5.37181 4.54492 5.37207C5.05092 5.37189 5.46076 4.96206 5.46094 4.45605V2.45605C5.46094 1.9499 5.05103 1.53924 4.54492 1.53906Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.5449 0C11.8793 0.000175845 12.9607 1.08262 12.9609 2.41699V4.41699C12.9608 5.75142 11.8794 6.83283 10.5449 6.83301C9.21057 6.83274 8.12811 5.75137 8.12793 4.41699V2.41699C8.12817 1.08267 9.21061 0.000263929 10.5449 0ZM10.5449 1.5C10.039 1.50026 9.62817 1.9111 9.62793 2.41699V4.41699C9.62811 4.92294 10.039 5.33274 10.5449 5.33301C11.0509 5.33283 11.4608 4.923 11.4609 4.41699V2.41699C11.4607 1.91105 11.0509 1.50018 10.5449 1.5Z" fill="currentColor"/></g></g>`);
export const PercentIcon: Glyph = make(`<g transform="translate(1.519 1.519)"><g><path d="M10.9629 1.06055L1.06055 10.9629L0 9.90234L9.90234 0L10.9629 1.06055Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.10645 6.06445C9.23224 6.0645 10.1484 6.98064 10.1484 8.10645C10.1483 9.2321 9.23213 10.1474 8.10645 10.1475C6.98072 10.1475 6.06463 9.23213 6.06445 8.10645C6.06445 6.98061 6.98061 6.06445 8.10645 6.06445ZM8.10645 7.03223C7.512 7.03223 7.03223 7.512 7.03223 8.10645C7.0324 8.70074 7.51211 9.18066 8.10645 9.18066C8.70075 9.18062 9.18049 8.70071 9.18066 8.10645C9.18066 7.51203 8.70085 7.03227 8.10645 7.03223Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.85645 0.814453C3.98224 0.814497 4.89844 1.73064 4.89844 2.85645C4.89826 3.9821 3.98213 4.89742 2.85645 4.89746C1.73072 4.89746 0.81463 3.98213 0.814453 2.85645C0.814453 1.73061 1.73061 0.814453 2.85645 0.814453ZM2.85645 1.82617C2.28668 1.82617 1.82715 2.28668 1.82715 2.85645C1.82732 3.42606 2.28678 3.88574 2.85645 3.88574C3.42607 3.8857 3.88557 3.42604 3.88574 2.85645C3.88574 2.2867 3.42618 1.82622 2.85645 1.82617Z" fill="currentColor"/></g></g>`);
export const ReduceDecimalIcon: Glyph = make(`<g transform="translate(1.416 0.0)"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M4.41309 8.44238L2.95312 9.90234L8.92969 9.90137V11.4414L2.94531 11.4424L4.41309 12.9102L3.32324 14L0.176758 10.8525L0 10.6768L0.696289 9.97559L0.769531 9.90234H0.773438L3.32324 7.35254L4.41309 8.44238Z" fill="currentColor"/><path d="M4.96387 5.33301C5.378 5.3331 5.71387 5.66885 5.71387 6.08301C5.71387 6.49716 5.378 6.83292 4.96387 6.83301H4.95703C4.54314 6.83263 4.20703 6.49699 4.20703 6.08301C4.20703 5.66902 4.54314 5.33338 4.95703 5.33301H4.96387Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.75293 0C10.0875 0.000175865 11.1689 1.08241 11.1689 2.41699V4.41699C11.1688 5.75142 10.0874 6.83283 8.75293 6.83301C7.41856 6.83277 6.33611 5.75138 6.33594 4.41699V2.41699C6.33594 1.08245 7.41845 0.000241894 8.75293 0ZM8.75293 1.5C8.24687 1.50024 7.83594 1.91088 7.83594 2.41699V4.41699C7.83611 4.92295 8.24698 5.33277 8.75293 5.33301C9.25893 5.33283 9.66877 4.923 9.66895 4.41699V2.41699C9.66895 1.91084 9.25904 1.50018 8.75293 1.5Z" fill="currentColor"/></g></g>`);
export const StyleIcon: Glyph = make(`<g transform="translate(2.333 0.0)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.933334 4.13195H8.4L8.06 6.26549C8.04194 6.35022 8.002 6.43036 7.94315 6.49998C7.88429 6.56961 7.80803 6.62694 7.72 6.66773L5.93334 7.50094C5.82068 7.55243 5.72751 7.63067 5.66489 7.72641C5.60226 7.82215 5.5728 7.93136 5.58 8.04109L5.96 13.3909C5.96546 13.4692 5.95226 13.5477 5.92121 13.6214C5.89016 13.6951 5.84192 13.7626 5.77947 13.8197C5.71701 13.8768 5.64165 13.9222 5.55805 13.9532C5.47444 13.9842 5.38435 14.0001 5.29334 14H4.03334C3.94291 14.0001 3.85341 13.9843 3.77027 13.9537C3.68714 13.923 3.6121 13.8781 3.54974 13.8217C3.48738 13.7652 3.43899 13.6984 3.40752 13.6254C3.37605 13.5523 3.36215 13.4745 3.36667 13.3966L3.7 8.03535C3.70717 7.92775 3.67909 7.82059 3.61897 7.72609C3.55885 7.63159 3.46911 7.55358 3.36 7.50094L1.62 6.67922C1.53164 6.63661 1.45569 6.5772 1.39794 6.50552C1.34018 6.43383 1.30213 6.35174 1.28667 6.26549L0.933334 4.13195ZM0 0H1.68667L2.8 0.826389L3.73334 0H9.33334L8.4 3.30556H0.933334L0 0Z" fill="currentColor"/></g>`);
export const TextFormatIcon: Glyph = make(`<g transform="translate(0.78 0.8)"><path d="M5.40973 1.78979H0V0H12.4408V1.78979H7.12628V12.4004H5.40973V1.78979Z" fill="currentColor"/></g>`);
export const TextWrapIcon: Glyph = make(`<g transform="translate(0.799 0.799)"><path d="M8.26855 9.64665H9.30212C10.2535 9.64665 11.0247 8.8754 11.0247 7.92403C11.0247 6.97267 10.2535 6.20142 9.30212 6.20142H0V4.82332H9.30212C11.0146 4.82332 12.4028 6.21154 12.4028 7.92403C12.4028 9.63652 11.0146 11.0247 9.30212 11.0247H8.26855V12.4028L5.51237 10.3357L8.26855 8.26855V9.64665ZM0 0H12.4028V1.37809H0V0ZM4.13428 9.64665V11.0247H0V9.64665H4.13428Z" fill="currentColor"/></g>`);

/** Lookup by the action name used in the Figma icon list. */
export const spreadsheetIcons = {
  'advanced-sorting': AdvancedSortingIcon,
  'align-center': AlignCenterIcon,
  'align-left': AlignLeftIcon,
  'align-right': AlignRightIcon,
  'column-size': ColumnSizeIcon,
  'currency': CurrencyIcon,
  'increase-decimal': IncreaseDecimalIcon,
  'percent': PercentIcon,
  'reduce-decimal': ReduceDecimalIcon,
  'style': StyleIcon,
  'text-format': TextFormatIcon,
  'text-wrap': TextWrapIcon,
} as const;

export type SpreadsheetIconName = keyof typeof spreadsheetIcons;
