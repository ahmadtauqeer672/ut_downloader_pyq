import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { StudentPapersComponent } from './pages/student-papers.component';
import { UploadPaperComponent } from './pages/upload-paper.component';
import { AdminPanelComponent } from './pages/admin-panel.component';
import { DisclaimerPageComponent } from './pages/disclaimer-page.component';
import { AdminSessionService } from './services/admin-session.service';

const adminOnly = () => {
  const adminSession = inject(AdminSessionService);
  const router = inject(Router);
  return adminSession.isAuthenticated() ? true : router.createUrlTree(['/admin']);
};

export const routes: Routes = [
  { path: '', component: StudentPapersComponent },
  { path: 'disclaimer', component: DisclaimerPageComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'upload', component: UploadPaperComponent, canActivate: [adminOnly] },
  {
    path: 'watermark-tool',
    canActivate: [adminOnly],
    loadComponent: () => import('./pages/watermark-tool.component').then((m) => m.WatermarkToolComponent)
  },
  { path: '**', redirectTo: '' }
];
