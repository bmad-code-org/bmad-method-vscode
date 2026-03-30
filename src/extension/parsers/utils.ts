/**
 * Convert title to kebab-case key for story/epic identifiers.
 *
 * @param title - The title to convert (e.g., "Story File Parser")
 * @returns Kebab-case string suitable for use as a key (e.g., "story-file-parser")
 */
export function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and') // Convert & to and
    .replace(/\./g, '-') // Convert dots to dashes (e.g., package.json → package-json)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}
