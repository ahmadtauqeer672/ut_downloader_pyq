import { UniversityOption } from '@/lib/types';

export const SITE_URL = 'https://www.utpaper.in';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.utpaper.in/api';

export const UNIVERSITY_OPTIONS: UniversityOption[] = [
  { name: 'PTU', courses: ['BTECH', 'BCA', 'BBA', 'MBA', 'MCA'] },
  { name: 'BIHAR BOARD (BSEB)', courses: ['10TH'] }
];

export const BTECH_DEPARTMENTS = ['CSE', 'CIVIL', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL'];
export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
export const BSEB_10TH_SUBJECTS = [
  'HINDI MT',
  'HINDI SIL',
  'URDU',
  'MATHEMATICS',
  'SCIENCE',
  'SOCIAL SCIENCE',
  'SANSKRIT'
] as const;
