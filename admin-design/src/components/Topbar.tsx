import type { Component } from 'solid-js';

export const Topbar: Component = () => {
  return (
    <header class="fixed top-0 right-0 left-64 z-50 glass-header flex justify-between items-center px-8 py-4 border-b border-transparent shadow-[0_12px_40px_rgba(20,27,43,0.06)]">
      <div class="flex items-center flex-1">
        <div class="relative w-full max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
          <input class="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search entries, media, or settings..." type="text"/>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 text-secondary hover:bg-[#f1f3ff] rounded-full transition-colors active:scale-95">
          <span class="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <button class="p-2 text-secondary hover:bg-[#f1f3ff] rounded-full transition-colors active:scale-95">
          <span class="material-symbols-outlined" data-icon="settings">settings</span>
        </button>
        <button class="ml-2 px-6 py-2 bg-primary-container text-white rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">
          Publish
        </button>
        <div class="ml-4 flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-semibold text-on-surface leading-none">Julian Vane</p>
            <p class="text-[10px] text-secondary uppercase tracking-widest font-bold">Editor-in-Chief</p>
          </div>
          <img alt="User avatar" class="w-10 h-10 rounded-full border-2 border-white shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQT-wwyUipsBjbHVUZJATEqSqh3mCqlO2RPnd6hjfLi3_-dyT9Htqq7WBf5-XdQaWMPSiUH_Z2Y6CxyYzqj0ahPgBCH2mHB6rt5sOVRImQuKaU3jvTFxdKwj1M-n1sEJ_sQ83kjh58oVtTdM_fHigk7Hj-fhsmvoNVyGTnH9CkuEqvts1y3gM-7zgJXRzMNzaTae-f_PqrQ4TZ85ULNcTBQ5U8dTyfPZG8ZkYhQRK1VfGY7aj9fE1XJyUhUlA5capS3cJtiO3Kh7W9"/>
        </div>
      </div>
    </header>
  );
};
