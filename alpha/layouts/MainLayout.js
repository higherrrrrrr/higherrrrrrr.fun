import { useEffect, useState } from 'react';
import ComingSoon from '../pages/coming-soon';
import Cookies from 'js-cookie';

const LAUNCH_DATE = new Date("2024-11-26T12:00:00-05:00");

export default function MainLayout({ children }) {
  const [shouldShowComingSoon, setShouldShowComingSoon] = useState(true);
  
  useEffect(() => {
    const launchOverride = Cookies.get('launch-override');
    const beforeLaunch = new Date().getTime() < LAUNCH_DATE.getTime();
    
    if (launchOverride === 'true') {
      setShouldShowComingSoon(false);
    } else {
      setShouldShowComingSoon(beforeLaunch);
    }
  }, []);

  if (shouldShowComingSoon) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-green-500">Higherrrrrrr</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}