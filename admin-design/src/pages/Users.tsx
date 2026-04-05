import { type Component, For } from 'solid-js';
import Icon from '../components/Icon';

const users = [
  { id: '1', name: 'Admin User', username: 'admin', email: 'admin@blitzpress.dev', role: 'Administrator', posts: 18 },
  { id: '2', name: 'Jane Editor', username: 'jane', email: 'jane@example.com', role: 'Editor', posts: 7 },
  { id: '3', name: 'John Author', username: 'john', email: 'john@example.com', role: 'Author', posts: 4 },
  { id: '4', name: 'Sarah Contrib', username: 'sarah', email: 'sarah@example.com', role: 'Contributor', posts: 2 },
  { id: '5', name: 'Mike Reader', username: 'mike', email: 'mike@example.com', role: 'Subscriber', posts: 0 },
];

const roleColors: Record<string, string> = {
  Administrator: 'bg-blue-50 text-blue-700 ring-1 ring-blue-500/20',
  Editor: 'bg-violet-50 text-violet-700 ring-1 ring-violet-500/20',
  Author: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
  Contributor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20',
  Subscriber: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
};

const avatarColors = [
  'bg-indigo-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-pink-600',
];

const Users: Component = () => {
  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div />
        <button class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]">
          <Icon name="plus" size={16} />
          Add User
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-10 px-4 py-3">
                <input type="checkbox" class="rounded border-slate-300 cursor-pointer" />
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Username
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posts</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <For each={users}>
              {(user, index) => (
                <tr class="hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200 group">
                  <td class="px-4 py-3">
                    <input type="checkbox" class="rounded border-slate-300 cursor-pointer" />
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class={`w-8 h-8 ${avatarColors[index() % avatarColors.length]} rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-slate-900">{user.name}</div>
                        <div class="flex items-center gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button class="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Edit</button>
                          <span class="text-slate-300">|</span>
                          <button class="text-xs text-red-500 hover:text-red-600 cursor-pointer">Delete</button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{user.username}</td>
                  <td class="px-4 py-3 text-sm text-slate-500">{user.email}</td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{user.posts}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
