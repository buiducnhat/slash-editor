import { TableKit, type TableKitOptions } from "@tiptap/extension-table";

export { TableKit, type TableKitOptions };

/**
 * Configures Tiptap's table kit (table/tableRow/tableHeader/tableCell) with
 * resizable columns on by default — the one behavior worth diverging from
 * upstream's default, since a fixed-width table is the common Notion-parity
 * expectation. `insertTable`/`addColumnBefore`/`deleteRow`/… ship from the
 * upstream extension; slash-editor adds no table-specific commands.
 */
export function table(options: Partial<TableKitOptions> = {}) {
  const { table: tableOption, ...rest } = options;
  return TableKit.configure({
    table: tableOption === undefined ? { resizable: true } : tableOption,
    ...rest,
  });
}
