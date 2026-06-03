import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import CourseList from './CourseList';
import Roadmap from './Roadmap';
import Checklist from './Checklist';

const TABS = ['Courses', 'Roadmap', 'Checklist'];

/**
 * ProgramScreen — the detail view for one degree program.
 * Contains three horizontally-swipeable panels:
 *   0. Required Courses
 *   1. Four-Year Roadmap
 *   2. Transfer / AP Checklist
 *
 * The tab bar at the top is clickable and stays in sync with the active
 * Swiper slide — tapping a tab jumps to that panel instantly.
 *
 * Props:
 *   program     — full program data object
 *   completed   — Set of completed IDs
 *   toggle      — function(id) to mark/unmark
 *   hasConsent  — localStorage consent flag
 *   grantConsent, exportJSON, importJSON — from useProgress
 *   onBack      — callback to return to HomeScreen
 */
export default function ProgramScreen({
  program, completed, toggle,
  hasConsent, grantConsent, exportJSON, importJSON,
  onBack,
}) {
  // Track the active slide index so the tab bar highlights correctly
  const [activeIndex, setActiveIndex] = useState(0);

  // Hold a reference to the Swiper instance so tabs can call slideTo()
  const swiperRef = useRef(null);

  const GRADUATION_CREDITS = 120;

  // Sum credits for every checked-off course and core requirement
  const doneCredits =
    program.courses.filter(c => completed.has(c.id)).reduce((s, c) => s + c.credits, 0) +
    program.coreRequirements.filter(r => completed.has(r.id)).reduce((s, r) => s + r.credits, 0);

  const pct = Math.min(100, Math.round((doneCredits / GRADUATION_CREDITS) * 100));

  function goToTab(index) {
    swiperRef.current?.slideTo(index);
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
          <p className="text-xs text-gray-400">{program.degree} · {program.totalCredits} credits</p>
        </div>
        <div className="flex-shrink-0 bg-maroon-50 text-maroon-600 text-xs font-semibold px-2 py-1 rounded-full text-center leading-tight">
          <div>{doneCredits} / {GRADUATION_CREDITS} cr</div>
          <div className="text-maroon-400 font-normal">{pct}%</div>
        </div>
      </div>

      {/* Clickable tab bar — highlights the active panel */}
      <div className="flex bg-white border-b border-gray-200">
        {TABS.map((label, i) => (
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
            <CourseList program={program} completed={completed} toggle={toggle} />
          </SwiperSlide>

          <SwiperSlide style={{ overflowY: 'auto' }}>
            <Roadmap program={program} completed={completed} toggle={toggle} />
          </SwiperSlide>

          <SwiperSlide style={{ overflowY: 'auto' }}>
            <Checklist
              program={program}
              completed={completed}
              toggle={toggle}
              hasConsent={hasConsent}
              grantConsent={grantConsent}
              exportJSON={exportJSON}
              importJSON={importJSON}
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
