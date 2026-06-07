export type ProgramKind = string;

export type CourseCategory = 'major' | 'elective' | 'core' | string;

export interface ApCredit {
  exam: string;
  minScore: number;
}

export interface ProgressItem {
  id: string;
  code?: string;
  title?: string;
  label?: string;
  credits?: number;
  category?: CourseCategory;
  note?: string;
  requirementGroup?: string;
  choiceNote?: string;
  alternateNote?: string;
  uniqueProgress?: boolean;
  apCredit?: ApCredit;
  grants?: string;
  courseRef?: string;
  alsoCourseRef?: string;
}

export interface Course extends ProgressItem {
  code: string;
  title: string;
  credits: number;
}

export interface CoreRequirement extends ProgressItem {
  label: string;
  credits: number;
}

export interface ElectiveGroup {
  creditsRequired: number;
  label: string;
  note?: string;
  courses?: Course[];
}

export type ElectiveOptions = Record<string, ElectiveGroup>;

export interface RoadmapItem {
  id?: string;
  ref?: string;
  label?: string;
  credits?: number;
  isElective?: boolean;
}

export interface RoadmapSemester {
  year: number;
  semester: string;
  credits: number;
  items?: RoadmapItem[];
}

export interface ChecklistItem extends ProgressItem {
  label: string;
}

export interface Program {
  id: string;
  name: string;
  degree: string;
  school: string;
  kind?: ProgramKind;
  totalCredits: number;
  majorCredits?: number;
  minorCredits?: number;
  hasCompletionEstimate?: boolean;
  catalogUrl?: string;
  courses?: Course[];
  electiveOptions?: ElectiveOptions;
  coreRequirements?: CoreRequirement[];
  roadmap?: RoadmapSemester[];
  checklist?: ChecklistItem[];
}

export interface CoreCatalogCourse extends Course {
  coreAreaId?: string;
  coreAreaName?: string;
  coreRequirementId?: string;
  requirementGroup?: string;
  diversity?: boolean;
}

export interface CoreCatalogGroup {
  label: string;
  requirementId: string;
  requirementGroup: string;
  courses: CoreCatalogCourse[];
}

export interface CoreCatalogArea {
  id: string;
  name: string;
  requirementIds: string[];
  requiredCourses: number;
  requiredCredits: number;
  sourceUrl: string;
  groups: CoreCatalogGroup[];
}

export interface CoreCatalogData {
  catalog: string;
  sourceUrl: string;
  areas: CoreCatalogArea[];
}

export type CompletedSet = ReadonlySet<string>;
