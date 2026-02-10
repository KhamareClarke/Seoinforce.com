export function slugify(name: string): string {
  if (!name || typeof name !== 'string') return 'dashboard';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'dashboard';
}
