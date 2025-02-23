// No 'use client' directive here
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata() {
  return {
    title: 'Achievements',
    description: 'User achievements and progress'
  };
}

export default function AchievementsLayout({ children }) {
  return children;
} 