import type { ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col sm:items-center sm:justify-center sm:bg-neutral-300 sm:p-6 sm:dark:bg-neutral-950">
      <div className="flex min-h-full flex-1 flex-col sm:h-[844px] sm:min-h-0 sm:w-[390px] sm:flex-none sm:overflow-hidden sm:rounded-[2.5rem] sm:border-8 sm:border-neutral-900 sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
