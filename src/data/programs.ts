import type { Program } from '../types';

import csData from './cs.json';
import seData from './se.json';
import itData from './it.json';
import cybersecurityData from './cybersecurity.json';
import datascienceData from './datascience.json';
import bioinformaticsData from './bioinformatics.json';
import aiMinorData from './ai-minor.json';
import aiHumanFlourishingMinorData from './ai-human-flourishing-minor.json';
import businessAiMinorData from './business-ai-minor.json';
import csMinorData from './cs-minor.json';
import itMinorData from './it-minor.json';
import computerCrimeForensicsMinorData from './computer-crime-forensics-minor.json';

export const PROGRAMS: Program[] = [
  csData,
  seData,
  itData,
  cybersecurityData,
  datascienceData,
  bioinformaticsData,
  csMinorData,
  itMinorData,
  computerCrimeForensicsMinorData,
  aiMinorData,
  aiHumanFlourishingMinorData,
  businessAiMinorData,
];
