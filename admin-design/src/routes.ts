import { lazy } from 'solid-js';
import type { RouteDefinition } from '@solidjs/router';
import Dashboard from './pages/Dashboard';

export const routes: RouteDefinition[] = [
  { path: '/', component: Dashboard },
  { path: '/posts', component: lazy(() => import('./pages/Posts')) },
  { path: '/posts/new', component: lazy(() => import('./pages/PostEditor')) },
  { path: '/posts/:id', component: lazy(() => import('./pages/PostEditor')) },
  { path: '/media', component: lazy(() => import('./pages/MediaLibrary')) },
  { path: '/pages', component: lazy(() => import('./pages/PagesManager')) },
  { path: '/plugins', component: lazy(() => import('./pages/Plugins')) },
  { path: '/settings', component: lazy(() => import('./pages/Settings')) },
  { path: '/users', component: lazy(() => import('./pages/Users')) },
  { path: '**', component: lazy(() => import('./errors/404')) },
];
