import { createSignal, createResource, For, Show } from "solid-js";
import { http } from "@blitzpress/plugin-sdk";

interface UserItem {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  roles: string[];
}

async function fetchUsers(): Promise<UserItem[]> {
  const res = await http().asJson().get("/api/plugins/users-plugin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users ?? [];
}

const UsersPage = () => {
  const [users, { refetch }] = createResource(fetchUsers);
  const [error, setError] = createSignal("");

  return (
    <div>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "1rem" }}>
        <h1 style={{ "font-size": "1.25rem", "font-weight": "600" }}>Users</h1>
      </div>
      <Show when={error()}>
        <p style={{ color: "red" }}>{error()}</p>
      </Show>
      <Show when={!users.loading} fallback={<p>Loading...</p>}>
        <table style={{ width: "100%", "border-collapse": "collapse" }}>
          <thead>
            <tr>
              <th style={{ "text-align": "left", padding: "0.5rem" }}>Name</th>
              <th style={{ "text-align": "left", padding: "0.5rem" }}>Email</th>
              <th style={{ "text-align": "left", padding: "0.5rem" }}>Role</th>
              <th style={{ "text-align": "left", padding: "0.5rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <For each={users()}>
              {(user) => (
                <tr>
                  <td style={{ padding: "0.5rem" }}>{user.display_name}</td>
                  <td style={{ padding: "0.5rem" }}>{user.email}</td>
                  <td style={{ padding: "0.5rem" }}>{user.roles.join(", ")}</td>
                  <td style={{ padding: "0.5rem" }}>{user.is_active ? "Active" : "Inactive"}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
};

export default UsersPage;
