/**
 * Paper size options
 */
export type PaperSize = 'A4' | 'letter';

/**
 * Paper dimensions in millimeters
 */
export interface PaperDimensions {
  width: number;
  height: number;
}

/**
 * Resume styling options
 */
export interface ResumeStyles {
  paper: PaperSize;
  fontSize: number;
  themeColor: string;
  marginV: number;
  marginH: number;
  lineHeight: number;
  paragraphSpace: number;
  fontFamily: string;
}

/**
 * Header item in the resume front matter
 */
export interface HeaderItem {
  text: string;
  link?: string;
  newLine?: boolean;
}

/**
 * Front matter parsed from the markdown file
 */
export interface FrontMatter {
  name?: string;
  header?: HeaderItem[];
  styles?: Partial<ResumeStyles>;
}

/**
 * Paper sizes in millimeters
 */
export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 }
};

/**
 * Default resume styles
 */
export const DEFAULT_STYLES: ResumeStyles = {
  paper: 'A4',
  fontSize: 15,
  themeColor: '#377bb5',
  marginV: 50,
  marginH: 45,
  lineHeight: 1.3,
  paragraphSpace: 5,
  fontFamily: 'Georgia, "Times New Roman", serif'
};

/**
 * Merge user styles with defaults
 */
export function mergeStyles(userStyles?: Partial<ResumeStyles>): ResumeStyles {
  return { ...DEFAULT_STYLES, ...userStyles };
}
