import type { Program } from '../types';

import csData from './cs.json';
import seData from './se.json';
import itData from './it.json';
import cybersecurityData from './cybersecurity.json';
import datascienceData from './datascience.json';
import aiMinorData from './ai-minor.json';
import aiHumanFlourishingMinorData from './ai-human-flourishing-minor.json';
import businessAiMinorData from './business-ai-minor.json';

export const PROGRAMS: Program[] = [
  csData,
  seData,
  itData,
  cybersecurityData,
  datascienceData,
  aiMinorData,
  aiHumanFlourishingMinorData,
  businessAiMinorData,
];
