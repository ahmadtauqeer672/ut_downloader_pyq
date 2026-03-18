export interface AcademicUniversityOption {
  name: string;
  courses: string[];
}

export const ACADEMIC_UNIVERSITY_OPTIONS: AcademicUniversityOption[] = [
  { name: 'PTU', courses: ['BTECH', 'BCA', 'BBA', 'MBA', 'MCA'] },
  { name: 'PU Chandigarh', courses: ['BTECH', 'BSC', 'BCA', 'MTECH'] },
  { name: 'GNDU', courses: ['BTECH', 'B.COM', 'MCA', 'MSC-IT'] },
  { name: 'MDU', courses: ['BTECH', 'BBA', 'MTECH', 'MBA'] },
  { name: 'GTU', courses: ['BTECH', 'BPHARM', 'MBA', 'MCA'] },
  { name: 'OTHER', courses: ['OTHER'] }
];

export const BTECH_DEPARTMENTS = ['CSE', 'CIVIL', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL'];

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
