import type { Component } from 'solid-js';

export const Dashboard: Component = () => {
  return (
    <div class="pt-24 px-8 pb-12">
      <div class="mb-10">
        <h1 class="text-4xl font-extrabold text-on-surface tracking-tight mb-2">At a Glance</h1>
        <p class="text-secondary text-lg">The pulse of your digital publication today.</p>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(20,27,43,0.06)] relative overflow-hidden">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h3 class="text-lg font-bold">Impression Volume</h3>
              <p class="text-sm text-secondary">Traffic trends across all channels</p>
            </div>
            <div class="flex gap-2">
              <span class="px-3 py-1 bg-surface-container-low rounded-full text-xs font-medium text-primary">Last 7 Days</span>
              <span class="px-3 py-1 text-xs font-medium text-secondary">Monthly</span>
            </div>
          </div>
          <div class="h-64 flex items-end justify-between gap-2">
            <div class="w-full bg-surface-container-low rounded-t-lg h-[40%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
            <div class="w-full bg-surface-container-low rounded-t-lg h-[60%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
            <div class="w-full bg-surface-container-low rounded-t-lg h-[45%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
            <div class="w-full bg-primary-container rounded-t-lg h-[85%] relative">
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded">12.4k</div>
            </div>
            <div class="w-full bg-surface-container-low rounded-t-lg h-[55%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
            <div class="w-full bg-surface-container-low rounded-t-lg h-[70%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
            <div class="w-full bg-surface-container-low rounded-t-lg h-[50%] transition-all hover:bg-primary-container/20 cursor-pointer"></div>
          </div>
          <div class="flex justify-between mt-4 text-[10px] text-secondary font-bold uppercase tracking-widest">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div class="col-span-4 flex flex-col gap-6">
          <div class="flex-1 bg-primary text-white rounded-xl p-6 relative overflow-hidden">
            <div class="relative z-10">
              <p class="text-primary-fixed text-xs font-bold uppercase tracking-widest mb-1">Total Subscribers</p>
              <h4 class="text-3xl font-bold">24,812</h4>
              <div class="mt-4 flex items-center gap-2 text-tertiary-fixed text-sm">
                <span class="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
                <span>+12% from last week</span>
              </div>
            </div>
          </div>
          <div class="flex-1 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(20,27,43,0.06)] border border-transparent">
            <p class="text-secondary text-xs font-bold uppercase tracking-widest mb-1">Average Read Time</p>
            <h4 class="text-3xl font-bold text-on-surface">04:12</h4>
            <div class="mt-4 flex items-center gap-2 text-tertiary text-sm">
              <span class="material-symbols-outlined text-sm" data-icon="query_builder">query_builder</span>
              <span>Optimal engagement</span>
            </div>
          </div>
        </div>

        <div class="col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(20,27,43,0.06)]">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Recent Activity</h3>
            <button class="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary" data-icon="edit_note">edit_note</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-on-surface">New Draft: "The Future of Minimalist Design"</p>
                <p class="text-xs text-secondary">by Sarah Jenkins • 2 hours ago</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-primary-container"></div>
                <span class="text-[10px] font-bold text-secondary uppercase">Draft</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-tertiary" data-icon="check_circle">check_circle</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-on-surface">Article Published: "Urban Gardening 101"</p>
                <p class="text-xs text-secondary">by Marcus Thorne • 5 hours ago</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-tertiary"></div>
                <span class="text-[10px] font-bold text-secondary uppercase">Live</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-error" data-icon="report">report</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-on-surface">System Update: Plugin conflict detected</p>
                <p class="text-xs text-secondary">WooCommerce Core • 1 day ago</p>
              </div>
              <button class="px-3 py-1 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant uppercase">Fix Now</button>
            </div>
          </div>
        </div>

        <div class="col-span-5 bg-surface-container rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div class="h-40 bg-cover bg-center relative" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCoPNIPFIier22DHgXKqkxOx9Bsix3QR_993a1YhTIR5oeQFk2lnJstg62C03CKbYK_NmURZvA3CijpKlP5JJ_g-fnY1LueoQUhW6jzeiUFQkmlU_tAXb7g2z4kR72hkSqty2soRoeQz1z7syNVxVLCJZ8Oia-163AcEBWN8PaEIoRfyBK_MNfNnAb9wpvUKMPzhenuUWOIqSspieo2_ozF5Dd-GuY0IUdhmvyJFHp2dcGsYdsZNrCZNFcneYtq9GpbGQ6CQAcCQ3Xl')">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <span class="text-white text-xs font-bold uppercase tracking-widest">Featured Insight</span>
            </div>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-between bg-surface-container-lowest">
            <div>
              <h4 class="text-xl font-bold leading-tight mb-2">Is generative AI the new editorial assistant?</h4>
              <p class="text-sm text-secondary mb-4">Deep dive into how newsrooms are leveraging LLMs without losing the human touch.</p>
            </div>
            <div class="flex items-center justify-between mt-4">
              <div class="flex -space-x-2">
                <img alt="Author" class="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy0amLOhf7SxAgttOKBf1t2zmzAe9Fz69GSieIvJWm5GOwboXsYlQJWXhpHeHgQU_Qb3CUONGDHbobzdlVLCOTAh0TKng9S9Ee7chlccRFaUpf_kEBHLIR3HwmLk5P8t8IBkhpWzw0twtWpVzePJ_93y9G9M_CkY83pyuVqBoyOHEDQlmA9v_jd3bqpBrBkoqGEaOYFDAyqSlXTktS06kxOHaGcBwkqxF4WdTFxgT2J4Wz8YP4YfW28IM_moFUiQ97i-3J73_Z-6oc"/>
                <img alt="Author" class="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjlnQkw-K8KQZZAj_0TamQGUCmGgtQDZUd3uReqf-gmsZE5bRuc7VC361sWblIHpknDOTMo8_rfI9UpN9-cVXBbqdHyTB9J7cjLz7aLEZTe0WchIf6oFt7D6XncaZxkLcZ0ek3heQgdQXimegvWiOJ_z50hHEkIu1q_odixGR9rqYOc-wFfuycG8IWsSOy7K96sUNtTIQ5th-y0HJ3rm_FHN3mt-0LvDd3cwos0V_HDAhVqlmjr1iDdM_9Gcr81xUz82-YN5ofuN3_"/>
              </div>
              <button class="flex items-center gap-2 text-primary font-bold text-sm">
                Read More
                <span class="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
