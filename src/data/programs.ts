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

// CAS / Business / Communication minors
import accountingInformationSystemsMinorData from './accounting-information-systems-minor.json';
import businessAdministrationMinorData from './business-administration-minor.json';
import economicsMinorData from './economics-minor.json';
import entrepreneurshipMinorData from './entrepreneurship-minor.json';
import financeMinorData from './finance-minor.json';
import humanResourceEmploymentRelationsMinorData from './human-resource-employment-relations-minor.json';
import informationSystemsMinorData from './information-systems-minor.json';
import internationalBusinessMinorData from './international-business-minor.json';
import managementMinorData from './management-minor.json';
import marketingMinorData from './marketing-minor.json';
import nonprofitManagementMinorData from './nonprofit-management-minor.json';
import sportManagementMinorData from './sport-management-minor.json';
import supplyChainManagementMinorData from './supply-chain-management-minor.json';
import sustainabilityManagementMinorData from './sustainability-management-minor.json';
import advertisingMinorData from './advertising-minor.json';
import advocacySocialChangeMinorData from './advocacy-social-change-minor.json';
import communicationStudiesMinorData from './communication-studies-minor.json';
import digitalMediaMinorData from './digital-media-minor.json';
import environmentalCommunicationMinorData from './environmental-communication-minor.json';
import filmDigitalMediaMinorData from './film-digital-media-minor.json';
import multimediaJournalismMinorData from './multimedia-journalism-minor.json';
import professionalCommunicationMinorData from './professional-communication-minor.json';
import publicRelationsMinorData from './public-relations-minor.json';
import artHistoryMinorData from './art-history-minor.json';
import danceMinorData from './dance-minor.json';
import drawingPaintingPrintmakingMinorData from './drawing-painting-printmaking-minor.json';
import musicMinorData from './music-minor.json';
import musicalTheatreMinorData from './musical-theatre-minor.json';
import photographyVideoArtMinorData from './photography-video-art-minor.json';
import sculptureCeramicsMinorData from './sculpture-ceramics-minor.json';
import shakespeareStudiesMinorData from './shakespeare-studies-minor.json';
import studioArtMinorData from './studio-art-minor.json';
import teachingArtistMinorData from './teaching-artist-minor.json';
import theatreMinorData from './theatre-minor.json';
import visualCommunicationMinorData from './visual-communication-minor.json';
import ancientGreekMinorData from './ancient-greek-minor.json';
import classicalCivilizationMinorData from './classical-civilization-minor.json';
import latinMinorData from './latin-minor.json';
import arabicLanguageCultureMinorData from './arabic-language-culture-minor.json';
import chineseLanguageCultureMinorData from './chinese-language-culture-minor.json';
import frenchLanguageLiteratureMinorData from './french-language-literature-minor.json';
import frenchLanguageMinorData from './french-language-minor.json';
import germanStudiesMinorData from './german-studies-minor.json';
import italianLanguageLiteratureMinorData from './italian-language-literature-minor.json';
import italianLanguageMinorData from './italian-language-minor.json';
import japaneseLanguageCultureMinorData from './japanese-language-culture-minor.json';
import literatureTranslationMinorData from './literature-translation-minor.json';
import spanishLanguageLiteratureMinorData from './spanish-language-literature-minor.json';
import spanishLanguageMinorData from './spanish-language-minor.json';
import actuarialScienceMinorData from './actuarial-science-minor.json';
import biostatisticsMinorData from './biostatistics-minor.json';
import mathematicsMinorData from './mathematics-minor.json';
import statisticsMinorData from './statistics-minor.json';
import biologyMinorData from './biology-minor.json';
import chemistryMinorData from './chemistry-minor.json';
import physicsMinorData from './physics-minor.json';
import neuroscienceMinorData from './neuroscience-minor.json';
import bioethicsMinorData from './bioethics-minor.json';
import englishMinorData from './english-minor.json';
import historyMinorData from './history-minor.json';
import philosophyMinorData from './philosophy-minor.json';
import ethicsMoralPhilosophyMinorData from './ethics-moral-philosophy-minor.json';
import theologyMinorData from './theology-minor.json';
import religiousStudiesMinorData from './religious-studies-minor.json';
import pastoralLeadershipMinorData from './pastoral-leadership-minor.json';
import catholicStudiesMinorData from './catholic-studies-minor.json';
import politicalScienceMinorData from './political-science-minor.json';
import lawPoliticsMinorData from './law-politics-minor.json';
import psychologyMinorData from './psychology-minor.json';
import psychologyCrimeJusticeMinorData from './psychology-crime-justice-minor.json';
import sociologyMinorData from './sociology-minor.json';
import sociolegalStudiesMinorData from './sociolegal-studies-minor.json';
import criminalJusticeCriminologyMinorData from './criminal-justice-criminology-minor.json';
import anthropologyMinorData from './anthropology-minor.json';
import globalStudiesMinorData from './global-studies-minor.json';
import womensStudiesGenderStudiesMinorData from './womens-studies-gender-studies-minor.json';
import asianStudiesMinorData from './asian-studies-minor.json';
import europeanStudiesMinorData from './european-studies-minor.json';
import medievalStudiesMinorData from './medieval-studies-minor.json';
import middleEastIslamicStudiesMinorData from './middle-east-islamic-studies-minor.json';
import latinAmericanLatinoStudiesMinorData from './latin-american-latino-studies-minor.json';
import peaceJusticeConflictStudiesMinorData from './peace-justice-conflict-studies-minor.json';
import raceEthnicityMinorData from './race-ethnicity-minor.json';
import urbanStudiesMinorData from './urban-studies-minor.json';
import urbanStudiesSustainabilityMinorData from './urban-studies-sustainability-minor.json';
import polishStudiesMinorData from './polish-studies-minor.json';

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
  // CAS / Business / Communication minors
  accountingInformationSystemsMinorData,
  businessAdministrationMinorData,
  economicsMinorData,
  entrepreneurshipMinorData,
  financeMinorData,
  humanResourceEmploymentRelationsMinorData,
  informationSystemsMinorData,
  internationalBusinessMinorData,
  managementMinorData,
  marketingMinorData,
  nonprofitManagementMinorData,
  sportManagementMinorData,
  supplyChainManagementMinorData,
  sustainabilityManagementMinorData,
  advertisingMinorData,
  advocacySocialChangeMinorData,
  communicationStudiesMinorData,
  digitalMediaMinorData,
  environmentalCommunicationMinorData,
  filmDigitalMediaMinorData,
  multimediaJournalismMinorData,
  professionalCommunicationMinorData,
  publicRelationsMinorData,
  artHistoryMinorData,
  danceMinorData,
  drawingPaintingPrintmakingMinorData,
  musicMinorData,
  musicalTheatreMinorData,
  photographyVideoArtMinorData,
  sculptureCeramicsMinorData,
  shakespeareStudiesMinorData,
  studioArtMinorData,
  teachingArtistMinorData,
  theatreMinorData,
  visualCommunicationMinorData,
  ancientGreekMinorData,
  classicalCivilizationMinorData,
  latinMinorData,
  arabicLanguageCultureMinorData,
  chineseLanguageCultureMinorData,
  frenchLanguageLiteratureMinorData,
  frenchLanguageMinorData,
  germanStudiesMinorData,
  italianLanguageLiteratureMinorData,
  italianLanguageMinorData,
  japaneseLanguageCultureMinorData,
  literatureTranslationMinorData,
  spanishLanguageLiteratureMinorData,
  spanishLanguageMinorData,
  actuarialScienceMinorData,
  biostatisticsMinorData,
  mathematicsMinorData,
  statisticsMinorData,
  biologyMinorData,
  chemistryMinorData,
  physicsMinorData,
  neuroscienceMinorData,
  bioethicsMinorData,
  englishMinorData,
  historyMinorData,
  philosophyMinorData,
  ethicsMoralPhilosophyMinorData,
  theologyMinorData,
  religiousStudiesMinorData,
  pastoralLeadershipMinorData,
  catholicStudiesMinorData,
  politicalScienceMinorData,
  lawPoliticsMinorData,
  psychologyMinorData,
  psychologyCrimeJusticeMinorData,
  sociologyMinorData,
  sociolegalStudiesMinorData,
  criminalJusticeCriminologyMinorData,
  anthropologyMinorData,
  globalStudiesMinorData,
  womensStudiesGenderStudiesMinorData,
  asianStudiesMinorData,
  europeanStudiesMinorData,
  medievalStudiesMinorData,
  middleEastIslamicStudiesMinorData,
  latinAmericanLatinoStudiesMinorData,
  peaceJusticeConflictStudiesMinorData,
  raceEthnicityMinorData,
  urbanStudiesMinorData,
  urbanStudiesSustainabilityMinorData,
  polishStudiesMinorData,
];
