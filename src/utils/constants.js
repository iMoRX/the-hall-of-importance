export const DEFAULT_SPACES = [
  { name: 'University', color: 'hsl(250, 80%, 65%)', icon: 'GraduationCap', order: 0 },
  { name: 'Work', color: 'hsl(170, 70%, 50%)', icon: 'Briefcase', order: 1 },
  { name: 'Personal Life', color: 'hsl(35, 90%, 60%)', icon: 'Heart', order: 2 },
];

export const SPACE_COLORS = [
  { name: 'Purple', value: 'hsl(250, 80%, 65%)' },
  { name: 'Teal', value: 'hsl(170, 70%, 50%)' },
  { name: 'Amber', value: 'hsl(35, 90%, 60%)' },
  { name: 'Rose', value: 'hsl(350, 80%, 60%)' },
  { name: 'Blue', value: 'hsl(215, 80%, 60%)' },
  { name: 'Green', value: 'hsl(145, 65%, 50%)' },
  { name: 'Orange', value: 'hsl(20, 90%, 58%)' },
  { name: 'Pink', value: 'hsl(330, 80%, 65%)' },
  { name: 'Cyan', value: 'hsl(190, 80%, 55%)' },
  { name: 'Lime', value: 'hsl(85, 70%, 50%)' },
];

export const SPACE_ICONS = [
  'GraduationCap', 'Briefcase', 'Heart', 'Home', 'Star',
  'BookOpen', 'Code', 'Music', 'Plane', 'Dumbbell',
  'Camera', 'ShoppingBag', 'Palette', 'Gamepad2', 'Stethoscope',
];

export const EXPIRY_PRESETS = [
  { label: '1 Day', days: 1 },
  { label: '1 Week', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: 'Never', days: null },
];

export const EXPIRY_WARNING_DAYS = 3;
export const TRASH_RETENTION_DAYS = 7;

export const ACCEPTED_FILE_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/json',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
