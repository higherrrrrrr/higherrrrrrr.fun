import dynamic from 'next/dynamic';

const DynamicProfilePage = dynamic(
  () => import('../../components/profile/ProfilePage'),
  { ssr: false }
);

export default function ProfilePage() {
  return <DynamicProfilePage />;
} 