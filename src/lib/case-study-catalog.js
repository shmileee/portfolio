import caseStudyCatalog from "../_data/caseStudyCatalog.js";

const entriesByFolder = new Map(caseStudyCatalog.map((entry) => [entry.folder, entry]));
const entriesById = new Map(caseStudyCatalog.map((entry) => [entry.id, entry]));

function requireCatalogEntry(entries, value, field) {
  const entry = entries.get(value);
  if (!entry) throw new RangeError(`Unknown case-study ${field}: ${String(value)}`);
  return entry;
}

export function getCaseStudyCatalogEntry(folder) {
  return requireCatalogEntry(entriesByFolder, folder, "folder");
}

export function getCaseStudyCatalogEntryById(id) {
  return requireCatalogEntry(entriesById, id, "id");
}
