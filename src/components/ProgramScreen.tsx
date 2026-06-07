import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';

import CourseList from './CourseList';
import CorePlanner from './CorePlanner';
import Roadmap from './Roadmap';
import Checklist from './Checklist';
import Audit from './Audit';
import Footer from './Footer';
import { calcDistinctDoneCredits, createProgressHelpers } from '../utils/progress';
import { encodeCompletedIds, getValidProgressIds } from '../utils/shareLink';
import type { CompletedSet, Program } from '../types';

interface CoreFocusTarget {
  requirementId: string;
  requestId: number;
}

interface ProgramScreenProps {
  program: Program;
  completed: CompletedSet;
  toggle: (id: string) => void;
  clear: (idsToClear: Iterable<string>) => void;
  onBack: () => void;
}

/**
 * ProgramScreen — four horizontally-swipeable panels for one degree program.
 *
 * Props:
 *   program   — full program data object
 *   completed — Set of completed IDs
 *   toggle    — function(id) to mark/unmark
 *   clear     — function(ids) to remove completed IDs
 *   onBack    — callback to return to HomeScreen
 */
export default function ProgramScreen({ program, completed, toggle, clear, onBack }: ProgramScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied]           = useState(false);
  const [coreFocusTarget, setCoreFocusTarget] = useState<CoreFocusTarget | null>(null);
  const swiperRef                     = useRef<SwiperInstance | null>(null);

  const hasCoreTab = (program.coreRequirements ?? []).length > 0;
  const tabs = hasCoreTab ? ['Courses', 'Core', 'Roadmap', 'Checklist', 'Audit'] : ['Courses', 'Roadmap', 'Checklist', 'Audit'];
  const coreTabIndex = hasCoreTab ? 1 : -1;
  const creditGoal = program.kind === 'minor' ? program.totalCredits : 120;
  const requirementCreditLabel = program.kind === 'minor'
    ? `${program.minorCredits ?? program.totalCredits} minor credits`
    : `${program.totalCredits} roadmap credits`;
  const { isCompleted, isRequirementSatisfied, getRequirementStatus, toggleItem } =
    createProgressHelpers(program, completed, toggle);
  const doneCredits = calcDistinctDoneCredits(program, completed);
  const pct = Math.min(100, Math.round((doneCredits / creditGoal) * 100));

  function goToTab(index: number): void {
    swiperRef.current?.slideTo(index);
  }

  function openCoreRequirement(requirementId: string): void {
    setCoreFocusTarget(previous => ({
      requirementId,
      requestId: (previous?.requestId ?? 0) + 1,
    }));
    if (coreTabIndex >= 0) goToTab(coreTabIndex);
  }

  function getShareUrl(): string {
    const params = new URLSearchParams();
    const validIds = getValidProgressIds([program], program.id);
    const shareIds = new Set<string>([...completed].filter(id => validIds.has(id)));

    params.set('p', program.id);
    if (shareIds.size > 0) params.set('d', encodeCompletedIds(shareIds));

    return `${window.location.origin}${window.location.pathname}?${params}`;
  }

  // Copy a URL that restores the current program and selected checklist state.
  function copyLink(): void {
    navigator.clipboard.writeText(getShareUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function emailProgress(): void {
    const subject = `Loyola CS advising checklist: ${program.name}`;
    const body = [
      'Hello,',
      '',
      `I am sharing my ${program.name} advising checklist progress:`,
      getShareUrl(),
      '',
      'This link contains only my checklist selections encoded in the URL.',
    ].join('\n');

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function clearProgramProgress(): void {
    if (doneCredits === 0) return;
    const ok = window.confirm(`Clear all selected courses for ${program.name}?`);
    if (!ok) return;
    clear(getValidProgressIds([program], program.id));
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-gray-500 active:bg-gray-100"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{program.name}</h1>
          <p className="text-xs text-gray-400">
            {program.degree} · {requirementCreditLabel}
            {program.majorCredits && <span> · {program.majorCredits} major credits</span>}
          </p>
        </div>

        {/* Share link button */}
        <button
          onClick={copyLink}
          className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full transition-colors
            ${copied ? 'bg-maroon-500 text-white' : 'bg-maroon-50 text-maroon-600 active:bg-maroon-100'}`}
          title="Copy shareable link"
        >
          {copied ? 'Copied!' : '🔗 Share'}
        </button>

        <button
          onClick={emailProgress}
          className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-gold-50 text-gold-800 active:bg-gold-100 transition-colors"
          title="Email checklist progress"
        >
          ✉ Email
        </button>

        <button
          onClick={clearProgramProgress}
          disabled={doneCredits === 0}
          className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full transition-colors
            ${doneCredits === 0
              ? 'bg-gray-100 text-gray-300'
              : 'bg-gray-100 text-gray-500 active:bg-gray-200'}`}
          title="Clear selected courses"
        >
          Clear
        </button>

        {/* Credit progress pill */}
        <div className="flex-shrink-0 bg-maroon-50 text-maroon-600 text-xs font-semibold px-2 py-1 rounded-full text-center leading-tight">
          <div>{doneCredits} / {creditGoal} cr</div>
          <div className="text-maroon-400 font-normal">{pct}%</div>
        </div>
      </div>

      {/* Clickable tab bar */}
      <div className="flex bg-white border-b border-gray-200">
        {tabs.map((label, i) => (
          <button
            key={i}
            onClick={() => goToTab(i)}
            className={`
              flex-1 py-2.5 text-xs font-semibold transition-colors
              ${activeIndex === i
                ? 'text-maroon-600 border-b-2 border-maroon-600'
                : 'text-gray-400 border-b-2 border-transparent'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Swipeable panels */}
      <div className="flex-1 overflow-hidden">
        <Swiper
          modules={[Pagination, Keyboard]}
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          style={{ height: '100%' }}
          onSwiper={swiper => { swiperRef.current = swiper; }}
          onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
        >
          <SwiperSlide style={{ overflowY: 'auto' }}>
            <CourseList
              program={program}
              completed={completed}
              isCompleted={isCompleted}
              getRequirementStatus={getRequirementStatus}
              toggleItem={toggleItem}
              onOpenCoreRequirement={openCoreRequirement}
            />
            <Footer />
          </SwiperSlide>

          {hasCoreTab && (
            <SwiperSlide style={{ overflowY: 'auto' }}>
              <CorePlanner
                program={program}
                completed={completed}
                toggle={toggle}
                getRequirementStatus={getRequirementStatus}
                focusTarget={coreFocusTarget}
              />
              <Footer />
            </SwiperSlide>
          )}

          <SwiperSlide style={{ overflowY: 'auto' }}>
            <Roadmap
              program={program}
              completed={completed}
              getRequirementStatus={getRequirementStatus}
              toggleItem={toggleItem}
              onOpenCoreRequirement={openCoreRequirement}
            />
            <Footer />
          </SwiperSlide>

          <SwiperSlide style={{ overflowY: 'auto' }}>
            <Checklist
              program={program}
              completed={completed}
              toggle={toggle}
              isCompleted={isCompleted}
              isRequirementSatisfied={isRequirementSatisfied}
              toggleItem={toggleItem}
            />
            <Footer />
          </SwiperSlide>

          <SwiperSlide style={{ overflowY: 'auto' }}>
            <Audit
              program={program}
              completed={completed}
              toggle={toggle}
              isCompleted={isCompleted}
              isRequirementSatisfied={isRequirementSatisfied}
              getRequirementStatus={getRequirementStatus}
              toggleItem={toggleItem}
            />
            <Footer />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
