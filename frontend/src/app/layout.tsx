import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learning Progress Tracker',
  description: 'Cohort training and progress tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f7f2] text-[#17241d] antialiased">
        {children}
      </body>
    </html>
  );
}
