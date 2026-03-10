import { Routes } from '@angular/router';
import { StudentPapersComponent } from './pages/student-papers.component';
import { UploadPaperComponent } from './pages/upload-paper.component';

export const routes: Routes = [
  { path: '', component: StudentPapersComponent },
  { path: 'upload', component: UploadPaperComponent },
  { path: '**', redirectTo: '' }
];