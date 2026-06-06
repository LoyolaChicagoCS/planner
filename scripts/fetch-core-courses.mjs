import { writeFile } from 'node:fs/promises';

const BASE_URL = 'https://catalog.luc.edu/undergraduate/university-requirements/university-core/core-area-and-courses/';

const AREAS = [
  {
    id: 'artistic',
    requirementIds: ['CORE_ART'],
    name: 'Artistic Knowledge and Inquiry',
    slug: 'artistic-knowledge-experience',
    requiredCourses: 1,
    requiredCredits: 3,
  },
  {
    id: 'writing',
    requirementIds: ['CORE_WRITING'],
    name: 'College Writing Seminar',
    slug: 'college-writing-seminar',
    requiredCourses: 1,
    requiredCredits: 3,
  },
  {
    id: 'ethics',
    requirementIds: ['CORE_ETHICS'],
    name: 'Ethical Knowledge and Inquiry',
    slug: 'ethical-knowledge-inquiry',
    requiredCourses: 1,
    requiredCredits: 3,
  },
  {
    id: 'quantitative',
    requirementIds: ['CORE_QUANT'],
    name: 'Quantitative Knowledge and Inquiry',
    slug: 'quantitative-knowledge-inquiry',
    requiredCourses: 1,
    requiredCredits: 3,
  },
  {
    id: 'historical',
    requirementIds: ['CORE_HIST1', 'CORE_HIST2'],
    name: 'Historical Knowledge and Inquiry',
    slug: 'historical-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
  {
    id: 'literary',
    requirementIds: ['CORE_LIT1', 'CORE_LIT2'],
    name: 'Literary Knowledge and Inquiry',
    slug: 'literary-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
  {
    id: 'philosophical',
    requirementIds: ['CORE_PHIL1', 'CORE_PHIL2'],
    name: 'Philosophical Knowledge and Inquiry',
    slug: 'philosophical-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
  {
    id: 'scientific',
    requirementIds: ['CORE_SCI1', 'CORE_SCI2'],
    name: 'Scientific Knowledge and Inquiry',
    slug: 'scientific-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
  {
    id: 'societal',
    requirementIds: ['CORE_SOC1', 'CORE_SOC2'],
    name: 'Societal and Cultural Knowledge and Inquiry',
    slug: 'societal-cultural-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
  {
    id: 'theological',
    requirementIds: ['CORE_THEO1', 'CORE_THEO2'],
    name: 'Theological and Religious Knowledge and Inquiry',
    slug: 'theological-religious-knowledge-inquiry',
    requiredCourses: 2,
    requiredCredits: 6,
  },
];

function cleanText(value) {
  return value
    .replace(/<sup[^>]*>.*?<\/sup>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function idFromCode(code) {
  return `CORE_${code.replace(/\s+/g, '')}`;
}

function extractCurriculum(html) {
  const start = html.indexOf('<div id="curriculumtextcontainer"');
  const end = html.indexOf('<div id="learningoutcomestextcontainer"');
  return html.slice(start, end > start ? end : undefined);
}

function extractRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => match[1]);
}

function extractCells(rowHtml) {
  return [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => match[1]);
}

function extractCourses(tableHtml) {
  const courses = [];

  for (const row of extractRows(tableHtml)) {
    const cells = extractCells(row);
    const comment = row.match(/<span class="courselistcomment">([\s\S]*?)<\/span>/i);
    if (comment) {
      continue;
    }

    const codeMatch = row.match(/class="bubblelink code"[^>]*>([\s\S]*?)<\/a>/i);
    if (!codeMatch || cells.length < 2) continue;

    const code = cleanText(codeMatch[1]);
    const title = cleanText(cells[1]);
    const rowHours = cleanText(cells[2] ?? '');
    const credits = /^\d+$/.test(rowHours) ? Number(rowHours) : 3;
    const diversity = /<sup[^>]*>\s*D\s*<\/sup>/i.test(cells[1]);

    courses.push({
      id: idFromCode(code),
      code,
      title,
      credits,
      ...(diversity ? { diversity: true } : {}),
    });
  }

  return courses;
}

function extractGroups(curriculumHtml) {
  const groups = [];
  const sectionPattern = /<h3[^>]*>([\s\S]*?)<\/h3>|<table class="sc_courselist">([\s\S]*?)<\/table>/gi;
  let currentGroup = 'Courses';

  for (const match of curriculumHtml.matchAll(sectionPattern)) {
    if (match[1]) {
      currentGroup = cleanText(match[1]);
      continue;
    }

    const tableHtml = match[0];
    const courses = extractCourses(tableHtml);
    if (courses.length === 0) continue;

    groups.push({
      label: currentGroup,
      courses,
    });
  }

  return groups;
}

async function fetchWithRetry(url, tries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}

const areas = [];

for (const area of AREAS) {
  const url = `${BASE_URL}${area.slug}/`;
  const html = await fetchWithRetry(url);
  const groups = extractGroups(extractCurriculum(html));

  areas.push({
    id: area.id,
    name: area.name,
    requirementIds: area.requirementIds,
    requiredCourses: area.requiredCourses,
    requiredCredits: area.requiredCredits,
    sourceUrl: url,
    groups,
  });
}

const inventory = {
  catalog: '2026-2027',
  sourceUrl: BASE_URL,
  areas,
};

await writeFile('src/data/coreCourses.json', `${JSON.stringify(inventory, null, 2)}\n`);

const totalCourses = areas.reduce(
  (sum, area) => sum + area.groups.reduce((groupSum, group) => groupSum + group.courses.length, 0),
  0,
);
console.log(`Wrote ${areas.length} core areas and ${totalCourses} courses to src/data/coreCourses.json`);
