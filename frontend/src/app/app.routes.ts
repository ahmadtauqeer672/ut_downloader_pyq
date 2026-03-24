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
  {
    path: '',
    component: StudentPapersComponent,
    data: {
      seo: {
        title: 'PTU Question Papers, Previous Year Papers and Competitive Exam PYQs | UTpaper',
        description:
          'Browse PTU and other university previous year question papers semester-wise. Download BTECH, BCA, BBA, MBA, MCA and competitive exam PYQs on UTpaper.',
        keywords: 'PTU question papers, previous year papers, BTECH papers, university PYQ, competitive exam papers',
        path: '/',
        type: 'website',
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'UTpaper',
            url: 'https://utpaper.in/'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'UTpaper Question Papers',
            url: 'https://utpaper.in/',
            description: 'Browse PTU and other university previous year question papers and competitive exam PYQs.'
          }
        ]
      }
    }
  },
  {
    path: 'question-papers/:university',
    component: StudentPapersComponent
  },
  {
    path: 'question-papers/:university/:course',
    component: StudentPapersComponent
  },
  {
    path: 'disclaimer',
    component: DisclaimerPageComponent,
    data: {
      seo: {
        title: 'Disclaimer | UTpaper',
        description:
          'Read the UTpaper disclaimer for previous year question papers, study materials, copyright concerns, and content removal requests.',
        path: '/disclaimer'
      }
    }
  },
  {
    path: 'admin',
    component: AdminPanelComponent,
    data: {
      seo: {
        title: 'Admin Panel | UTpaper',
        description: 'UTpaper admin login and management dashboard.',
        path: '/admin',
        robots: 'noindex,nofollow,noarchive'
      }
    }
  },
  {
    path: 'upload',
    component: UploadPaperComponent,
    canActivate: [adminOnly],
    data: {
      seo: {
        title: 'Manage Papers | UTpaper',
        description: 'Private upload and paper management area for UTpaper administrators.',
        path: '/upload',
        robots: 'noindex,nofollow,noarchive'
      }
    }
  },
  {
    path: 'watermark-tool',
    canActivate: [adminOnly],
    loadComponent: () => import('./pages/watermark-tool.component').then((m) => m.WatermarkToolComponent),
    data: {
      seo: {
        title: 'Watermark Tool | UTpaper',
        description: 'Private PDF watermark tool for UTpaper administrators.',
        path: '/watermark-tool',
        robots: 'noindex,nofollow,noarchive'
      }
    }
  },
  { path: '**', redirectTo: '' }
];
