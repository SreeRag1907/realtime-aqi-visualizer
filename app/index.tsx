import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';
import LoadingScreen from '@/components/LoadingScreen';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Show splash for 6 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Navigate based on auth state after splash
    if (!showSplash && !isLoading) {
      if (isAuthenticated) {
        setShowLoading(true);
      } else {
        router.replace('/auth');
      }
    }
  }, [showSplash, isLoading, isAuthenticated]);

  const handleLoadingComplete = () => {
    setShowLoading(false);
    router.replace('/(tabs)');
  };

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  if (showLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // This should not render as we're navigating away
  return null;
}
