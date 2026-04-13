import { For, Show, createEffect, createSignal, type JSX } from "solid-js";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  type ColumnDef,
  type RowData,
} from "@tanstack/solid-table";

export interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  getRowId?: (row: TData, index: number) => string;
}

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  ariaLabel: string;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
}

function SelectionCheckbox(props: SelectionCheckboxProps) {
  let checkboxRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (checkboxRef) {
      checkboxRef.indeterminate = props.indeterminate ?? false;
    }
  });

  return (
    <input
      ref={(element) => {
        checkboxRef = element;
      }}
      type="checkbox"
      checked={props.checked}
      aria-label={props.ariaLabel}
      class="cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
      onChange={props.onChange}
    />
  );
}

export function DataTable<TData extends RowData>(props: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = createSignal<RowSelectionState>({});
  const table = createSolidTable<TData>({
    get columns() {
      return props.columns;
    },
    get data() {
      return props.data;
    },
    getRowId: props.getRowId,
    enableRowSelection: () => props.selectable ?? false,
    getCoreRowModel: getCoreRowModel(),
    state: {
      get rowSelection() {
        return rowSelection();
      },
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((current) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
  });

  const colSpan = () => Math.max(table.getAllLeafColumns().length + (props.selectable ? 1 : 0), 1);
  const emptyMessage = () => props.emptyMessage ?? "No data found";

  return (
    <div class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50">
      <table class="w-full">
        <thead>
          <For each={table.getHeaderGroups()}>
            {(headerGroup, headerGroupIndex) => (
              <tr class="border-b border-slate-200 bg-slate-50/80">
                <Show when={props.selectable && headerGroupIndex() === 0}>
                  <th class="w-10 px-4 py-3">
                    <SelectionCheckbox
                      checked={table.getIsAllRowsSelected()}
                      indeterminate={table.getIsSomeRowsSelected()}
                      ariaLabel="Select all rows"
                      onChange={(event) => table.toggleAllRowsSelected(event.currentTarget.checked)}
                    />
                  </th>
                </Show>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th
                      colSpan={header.colSpan}
                      class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      <Show when={!header.isPlaceholder}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Show>
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <Show
            when={!props.loading}
            fallback={
              <For each={[0, 1, 2]}>
                {() => (
                  <tr>
                    <td colSpan={colSpan()} class="px-4 py-3">
                      <div class="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                )}
              </For>
            }
          >
            <Show
              when={table.getRowModel().rows.length > 0}
              fallback={
                <tr>
                  <td colSpan={colSpan()} class="px-4 py-8 text-center text-sm text-slate-500">
                    {emptyMessage()}
                  </td>
                </tr>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <tr class="group transition-colors hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent">
                    <Show when={props.selectable}>
                      <td class="px-4 py-3">
                        <SelectionCheckbox
                          checked={row.getIsSelected()}
                          indeterminate={row.getIsSomeSelected()}
                          ariaLabel="Select row"
                          onChange={(event) => row.toggleSelected(event.currentTarget.checked)}
                        />
                      </td>
                    </Show>
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <td class="px-4 py-3 text-sm text-slate-600">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </Show>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
