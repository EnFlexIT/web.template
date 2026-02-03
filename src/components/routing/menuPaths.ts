// src/routing/menuPaths.ts
import { MenuItem } from "../../redux/slices/menuSlice";

function normalizePath(p: string) {
  if (!p) return "/";
  let out = p.trim();
  if (!out.startsWith("/")) out = "/" + out;
  if (out.length > 1) out = out.replace(/\/+$/g, "");
  return out;
}

function slugify(input: string) {
  return (input ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-/g, "")
    .replace(/-$/g, "")
    .toLowerCase();
}

export function buildMenuPaths(rawMenu: MenuItem[]) {
  const byParent = new Map<number, MenuItem[]>();

  rawMenu.forEach((m) => {
    const p = m.parentID ?? 0;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(m);
  });

  const pathById: Record<number, string> = {};
  const idByPath: Record<string, number> = {};

  const walk = (parentId: number, parentPath: string) => {
    const used = new Set<string>();
    const children = byParent.get(parentId) ?? [];

    for (const c of children) {
      const id = c.menuID!;
      let seg = slugify(c.caption) || String(id);

      if (used.has(seg)) seg = `${seg}-${id}`;
      used.add(seg);

      const full = normalizePath(
        parentPath ? `${parentPath}/${seg}` : `/${seg}`
      );

      pathById[id] = full;
      idByPath[full] = id;

      walk(id, full);
    }
  };

  walk(0, "");

  return { pathById, idByPath };
}
