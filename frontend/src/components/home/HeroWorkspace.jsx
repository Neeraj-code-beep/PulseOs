import { ArrowRight, Play, Check, Flame, Sparkles, Clock, Target } from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { Button } from '../ui/Button';
import { FloatingInsight } from '../ui/FloatingInsight';

export const HeroWorkspace = ({ openCount = 0, completedCount = 0, onPlanClick, onFocusClick }) => {
  const shouldReduceMotion = useReducedMotion();
  const totalCount = openCount + completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="relative py-8 sm:py-14 overflow-hidden border-b border-[var(--border-soft)]">
      {/* Background Architectural Texture & Subtle Glow */}
      <div className="absolute inset-0 bg-dotted-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-96 h-96 bg-[var(--primary-soft)]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--focus-soft)]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        {/* Left Editorial Column */}
        <Motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="lg:col-span-7 flex flex-col gap-6"
        >
          {/* Eyebrow */}
          <SectionEyebrow dotColor="var(--primary)">
            Productivity Operating System
          </SectionEyebrow>

          {/* Editorial Headline */}
          <EditorialHeading size="hero">
            Make today <br />
            <span className="text-[var(--primary)] font-serif italic font-normal">count.</span>
          </EditorialHeading>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed font-sans">
            Plan your daily workload, protect your focus blocks, and build realistic study routines designed for high performance.
          </p>

          {/* Metric Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-3 px-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] font-mono text-xs text-[var(--text-muted)] max-w-lg shadow-xs">
            <div>
              <span className="text-base font-bold text-[var(--text-primary)]">{openCount}</span> open tasks
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div>
              <span className="text-base font-bold text-[var(--focus)]">{completedCount}</span> completed
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div>
              <span className="text-base font-bold text-[var(--accent)]">25m</span> focus block
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={onPlanClick}
              icon={ArrowRight}
              className="px-6 py-3 text-sm font-semibold shadow-md"
            >
              Plan my day
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={onFocusClick}
              className="px-6 py-3 text-sm font-semibold border-[var(--border)] shadow-xs"
            >
              <Play size={15} className="text-[var(--focus)]" fill="currentColor" />
              <span>Start focus session</span>
            </Button>
          </div>
        </Motion.div>

        {/* Right Productivity UI Composition with Floating Objects */}
        <Motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="lg:col-span-5 relative flex justify-center py-4"
        >
          {/* Main Simulated Product Object Surface */}
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-xl flex flex-col justify-between overflow-hidden">
            {/* Top Bar: Focus Mode Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--focus)] animate-pulse" />
                Focus Workspace
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--focus-soft)] text-[var(--focus)]">
                25:00
              </span>
            </div>

            {/* Middle: Real-time Task Preview Stack */}
            <div className="flex flex-col gap-3 my-5">
              <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] shadow-xs flex items-center justify-between transition-transform hover:translate-x-0.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4.5 h-4.5 rounded-full border border-[var(--focus)] bg-[var(--focus)] text-white flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium line-through text-[var(--text-muted)] truncate">
                    Database schema review & migration
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--focus)] font-bold shrink-0">Done</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--primary)]/50 rounded-[var(--radius-md)] shadow-sm flex items-center justify-between transition-transform hover:translate-x-0.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-[var(--primary)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    Operating Systems assignment
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--primary)] font-bold shrink-0">45m</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface-elevated)]/70 border border-[var(--border-soft)] rounded-[var(--radius-md)] flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4.5 h-4.5 rounded-full border border-[var(--text-muted)] shrink-0" />
                  <span className="text-xs text-[var(--text-secondary)] truncate">
                    Algorithms problem set 4
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">Tomorrow</span>
              </div>
            </div>

            {/* Bottom Progress Summary Bar */}
            <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Daily Progress</span>
              <span className="text-[var(--text-primary)] font-bold">{completionPercentage}% Completed</span>
            </div>

            {/* FLOATING OBJECT 1: AI Insight Floating Card */}
            <div className="absolute -top-4 -right-3 sm:-top-5 sm:-right-4 w-52 sm:w-56 pointer-events-none hidden sm:block">
              <FloatingInsight
                icon={Sparkles}
                title="Peak Focus Window"
                subtitle="9:00 AM – 11:30 AM"
                badgeText="AI Recommendation"
                badgeVariant="accent"
                delay={0.2}
              />
            </div>

            {/* FLOATING OBJECT 2: Focus Session Floating Badge */}
            <div className="absolute -bottom-4 -left-3 sm:-bottom-5 sm:-left-4 w-48 sm:w-52 pointer-events-none hidden sm:block">
              <FloatingInsight
                icon={Flame}
                title="Focus Streak"
                subtitle="+18% productivity score"
                badgeText="Live"
                badgeVariant="focus"
                delay={0.3}
              />
            </div>
          </div>
        </Motion.div>
      </div>
    </section>
  );
};
