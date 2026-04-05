import { type Component } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from '../components/Icon';

const NotFound: Component = () => (
  <div class="flex flex-col items-center justify-center h-96">
    <div class="text-8xl font-black text-indigo-600 mb-4">404</div>
    <div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
      <Icon name="globe" size={32} class="text-indigo-400" />
    </div>
    <h2 class="text-2xl font-bold text-slate-800 mb-2">Page not found</h2>
    <p class="text-slate-500 max-w-sm text-center">The page you're looking for doesn't exist or has been moved.</p>
    <A
      href="/"
      class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] mt-6"
    >
      <Icon name="arrow-left" size={16} />
      Back to Dashboard
    </A>
  </div>
);

export default NotFound;
