import { UniversityOption } from '@/lib/types';

export const SITE_URL = 'https://utpaper.in';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.utpaper.in/api';

export const UNIVERSITY_OPTIONS: UniversityOption[] = [
  { name: 'PTU', courses: ['BTECH', 'BCA', 'BBA', 'MBA', 'MCA'] }
];

export const BTECH_DEPARTMENTS = ['CSE', 'CIVIL', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL'];
export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const FAQ_ITEMS = [
  {
    question: 'What are PTU question papers?',
    answer:
      'PTU question papers are previous year exam papers from I. K. Gujral Punjab Technical University courses such as BTECH, BCA, BBA, MBA and MCA.'
  },
  {
    question: 'Can I download semester-wise papers on UTpaper?',
    answer:
      'Yes. UTpaper organizes uploaded papers by university, course, and where available by semester and department so students can find papers faster.'
  },
  {
    question: 'Does UTpaper only include PTU papers?',
    answer:
      'No. The directory also includes papers for PU Chandigarh, GNDU, MDU, GTU and selected competitive exams wherever papers have been uploaded.'
  },
  {
    question: 'Are these papers useful for exam preparation?',
    answer:
      'Yes. Previous year papers help students understand exam patterns, repeated topics, and the level of questions they are likely to face.'
  }
] as const;

export const FEATURE_ITEMS = [
  {
    title: 'Semester-wise browsing',
    description: 'Open academic papers by course, department and semester without digging through long menus.'
  },
  {
    title: 'Multiple universities',
    description: 'Browse PTU, PU Chandigarh, GNDU, MDU, GTU and selected other university paper collections.'
  },
  {
    title: 'Competitive support',
    description: 'See uploaded competitive exam papers year-wise to compare past exam patterns quickly.'
  }
] as const;
