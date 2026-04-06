import React from 'react';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
);

export const CardSkeleton = () => (
  <div className="bg-white/[0.02] rounded-2xl overflow-hidden relative border border-white/[0.04]">
    <div className="aspect-16/10 bg-white/[0.03] relative overflow-hidden">
      <Shimmer />
    </div>
    <div className="p-5 space-y-2.5">
      <div className="h-3 bg-white/[0.04] rounded-full w-3/4 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-2.5 bg-white/[0.04] rounded-full w-full relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="pt-3 border-t border-white/[0.03] flex justify-between">
        <div className="h-2 bg-white/[0.04] rounded-full w-16 relative overflow-hidden">
           <Shimmer />
        </div>
        <div className="h-2 w-2 bg-white/[0.04] rounded-sm relative overflow-hidden">
           <Shimmer />
        </div>
      </div>
    </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto px-6 lg:px-12 py-12 space-y-10">
    <header className="space-y-5">
      <div className="h-2 bg-white/[0.04] rounded-full w-20 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-10 bg-white/[0.04] rounded-xl w-full relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-white/[0.04] rounded-full w-28 relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-3 bg-white/[0.04] rounded-full w-20 relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
    </header>

    <div className="aspect-video bg-white/[0.02] rounded-2xl relative overflow-hidden border border-white/[0.04]">
      <Shimmer />
    </div>

    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`h-3 bg-white/[0.04] rounded-full relative overflow-hidden ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-[90%]' : 'w-[75%]'}`}>
          <Shimmer />
        </div>
      ))}
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-6 p-5">
    <div className="h-3 bg-white/[0.04] rounded-full w-28 relative overflow-hidden">
      <Shimmer />
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-white/[0.02] rounded-xl relative overflow-hidden border border-white/[0.04]">
          <Shimmer />
        </div>
      ))}
    </div>
  </div>
);
