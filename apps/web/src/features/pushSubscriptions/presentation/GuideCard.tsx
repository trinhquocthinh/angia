import type { ReactNode } from 'react';
import { revealStyle } from '@src/shared/ui/revealStyle';
import '@src/shared/ui/modal-motion.css';
import { PushIcon, type PushIconName } from './PushIcon';

export interface GuideStep {
  icon: PushIconName;
  title: ReactNode;
  detail: string;
}

interface Props {
  id: string;
  title: string;
  intro: string;
  steps?: GuideStep[];
  children?: ReactNode;
}

// Thẻ hướng dẫn từng bước đánh số, chữ lớn vừa đủ cho người cao tuổi làm theo.
export function GuideCard({ id, title, intro, steps = [], children }: Props) {
  return (
    <section aria-labelledby={id} className="rounded-[20px] bg-accent-soft p-4 lg:p-6">
      <h2 id={id} className="text-base font-semibold text-accent">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{intro}</p>
      {steps.length > 0 && (
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((step, index) => (
            <li
              key={index}
              className="angia-modal-reveal flex items-start gap-3 rounded-2xl bg-surface p-3.5 shadow-[0_2px_8px_color-mix(in_srgb,var(--color-shadow)_4%,transparent)]"
              style={revealStyle(index)}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <PushIcon name={step.icon} />
                <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                  {index + 1}
                </span>
              </span>
              <span className="min-w-0 text-sm leading-relaxed">
                <span className="block text-text-primary">{step.title}</span>
                <span className="block text-[13px] text-text-secondary">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {children}
    </section>
  );
}
