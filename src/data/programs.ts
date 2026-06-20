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
import msCsData from './ms-cs.json';
import msItData from './ms-it.json';
import msCybersecurityData from './ms-cybersecurity.json';
import msSeData from './ms-se.json';
import msDsData from './ms-ds.json';
import phdCsData from './phd-cs.json';

// CAS additional major partners
import mathBsData from './math-bs.json';
import physicsBsData from './physics-bs.json';
import philosophyBaData from './philosophy-ba.json';
import psychologyBsData from './psychology-bs.json';
import economicsBaData from './economics-ba.json';
import biologyBsData from './biology-bs.json';
import englishBaData from './english-ba.json';
import politicalScienceBaData from './political-science-ba.json';
import historyBaData from './history-ba.json';
import sociologyBaData from './sociology-ba.json';
import criminalJusticeBsData from './criminal-justice-bs.json';
import africanStudiesBaData from './african-studies-ba.json';
import anthropologyBaData from './anthropology-ba.json';
import anthropologyBsData from './anthropology-bs.json';
import biochemistryBaData from './biochemistry-ba.json';
import biochemistryBsData from './biochemistry-bs.json';
import chemistryBaData from './chemistry-ba.json';
import chemistryBsData from './chemistry-bs.json';
import classicalCivilizationBaData from './classical-civilization-ba.json';
import latinBaData from './latin-ba.json';
import artHistoryBaData from './art-history-ba.json';
import danceBaData from './dance-ba.json';
import musicBaData from './music-ba.json';
import theatreBaData from './theatre-ba.json';
import photographyVideoArtBaData from './photography-video-art-ba.json';
import sculptureCeramicsBaData from './sculpture-ceramics-ba.json';
import studioArtsBaData from './studio-arts-ba.json';
import visualCommunicationBaData from './visual-communication-ba.json';
import forensicScienceBsData from './forensic-science-bs.json';
import globalStudiesBaData from './global-studies-ba.json';
import humanServicesBsData from './human-services-bs.json';
import appliedMathematicsBsData from './applied-mathematics-bs.json';
import statisticsBsData from './statistics-bs.json';
import mathCsBsData from './math-cs-bs.json';
import frenchBaData from './french-ba.json';
import spanishBaData from './spanish-ba.json';
import italianStudiesBaData from './italian-studies-ba.json';
import cognitiveBehavioralNeuroscienceBsData from './cognitive-behavioral-neuroscience-bs.json';
import molecularCellularNeuroscienceBsData from './molecular-cellular-neuroscience-bs.json';
import biophysicsBsData from './biophysics-bs.json';
import theoreticalPhysicsAppliedMathBsData from './theoretical-physics-applied-math-bs.json';
import theologyBaData from './theology-ba.json';
import religiousStudiesBaData from './religious-studies-ba.json';
import womensStudiesGenderStudiesBaData from './womens-studies-gender-studies-ba.json';
import sociologyAnthropologyBaData from './sociology-anthropology-ba.json';
import engineeringBiomedicalBsData from './engineering-biomedical-bs.json';
import engineeringComputerBsData from './engineering-computer-bs.json';
import engineeringEnvironmentalBsData from './engineering-environmental-bs.json';

// School of Communication
import advertisingPublicRelationsBaData from './advertising-public-relations-ba.json';
import advertisingCreativeBaData from './advertising-creative-ba.json';
import communicationStudiesBaData from './communication-studies-ba.json';
import filmMediaProductionBaData from './film-media-production-ba.json';
import multimediaJournalismBaData from './multimedia-journalism-ba.json';
import publicCommunicationAdvocacyBaData from './public-communication-advocacy-ba.json';
import sportsMediaBaData from './sports-media-ba.json';

// Quinlan School of Business
import accountingBbaData from './accounting-bba.json';
import accountingAnalyticsBbaData from './accounting-analytics-bba.json';
import economicsBbaData from './economics-bba.json';
import entrepreneurshipBbaData from './entrepreneurship-bba.json';
import financeBbaData from './finance-bba.json';
import humanResourceManagementBbaData from './human-resource-management-bba.json';
import informationSystemsAnalyticsBbaData from './information-systems-analytics-bba.json';
import internationalBusinessBbaData from './international-business-bba.json';
import managementBbaData from './management-bba.json';
import marketingBbaData from './marketing-bba.json';
import sportManagementBbaData from './sport-management-bba.json';
import supplyChainManagementBbaData from './supply-chain-management-bba.json';

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
  msCsData,
  msItData,
  msCybersecurityData,
  msSeData,
  msDsData,
  phdCsData,
  // CAS additional major partners
  mathBsData,
  physicsBsData,
  philosophyBaData,
  psychologyBsData,
  economicsBaData,
  biologyBsData,
  englishBaData,
  politicalScienceBaData,
  historyBaData,
  sociologyBaData,
  criminalJusticeBsData,
  africanStudiesBaData,
  anthropologyBaData,
  anthropologyBsData,
  biochemistryBaData,
  biochemistryBsData,
  chemistryBaData,
  chemistryBsData,
  classicalCivilizationBaData,
  latinBaData,
  artHistoryBaData,
  danceBaData,
  musicBaData,
  theatreBaData,
  photographyVideoArtBaData,
  sculptureCeramicsBaData,
  studioArtsBaData,
  visualCommunicationBaData,
  forensicScienceBsData,
  globalStudiesBaData,
  humanServicesBsData,
  appliedMathematicsBsData,
  statisticsBsData,
  mathCsBsData,
  frenchBaData,
  spanishBaData,
  italianStudiesBaData,
  cognitiveBehavioralNeuroscienceBsData,
  molecularCellularNeuroscienceBsData,
  biophysicsBsData,
  theoreticalPhysicsAppliedMathBsData,
  theologyBaData,
  religiousStudiesBaData,
  womensStudiesGenderStudiesBaData,
  sociologyAnthropologyBaData,
  engineeringBiomedicalBsData,
  engineeringComputerBsData,
  engineeringEnvironmentalBsData,
  // School of Communication
  advertisingPublicRelationsBaData,
  advertisingCreativeBaData,
  communicationStudiesBaData,
  filmMediaProductionBaData,
  multimediaJournalismBaData,
  publicCommunicationAdvocacyBaData,
  sportsMediaBaData,
  // Quinlan School of Business
  accountingBbaData,
  accountingAnalyticsBbaData,
  economicsBbaData,
  entrepreneurshipBbaData,
  financeBbaData,
  humanResourceManagementBbaData,
  informationSystemsAnalyticsBbaData,
  internationalBusinessBbaData,
  managementBbaData,
  marketingBbaData,
  sportManagementBbaData,
  supplyChainManagementBbaData,
];
