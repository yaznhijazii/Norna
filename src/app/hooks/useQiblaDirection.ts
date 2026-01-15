import { useState, useEffect } from 'react';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

interface QiblaData {
  qiblaDirection: number | null;
  deviceHeading: number | null;
  needsPermission: boolean;
  error: string | null;
  loading: boolean;
}

export function useQiblaDirection() {
  const [qiblaData, setQiblaData] = useState<QiblaData>({
    qiblaDirection: null,
    deviceHeading: null,
    needsPermission: false,
    error: null,
    loading: true,
  });

  // Calculate Qibla direction from user's location
  const calculateQiblaDirection = (userLat: number, userLng: number): number => {
    // Convert to radians
    const lat1 = (userLat * Math.PI) / 180;
    const lat2 = (KAABA_LAT * Math.PI) / 180;
    const lng1 = (userLng * Math.PI) / 180;
    const lng2 = (KAABA_LNG * Math.PI) / 180;

    // Calculate bearing using Haversine formula
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  useEffect(() => {
    // Get user location
    if (!navigator.geolocation) {
      // Default to Amman, Jordan if geolocation not supported
      const qiblaDir = calculateQiblaDirection(31.9454, 35.9284);
      setQiblaData(prev => ({
        ...prev,
        qiblaDirection: qiblaDir,
        loading: false,
        error: null,
      }));
      return;
    }

    // Try to get user's location, but don't fail if denied
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const qiblaDir = calculateQiblaDirection(
          position.coords.latitude,
          position.coords.longitude
        );

        setQiblaData(prev => ({
          ...prev,
          qiblaDirection: qiblaDir,
          loading: false,
          error: null,
        }));
      },
      () => {
        // Silently fall back to Amman, Jordan coordinates if permission denied or error
        const qiblaDir = calculateQiblaDirection(31.9454, 35.9284);
        setQiblaData(prev => ({
          ...prev,
          qiblaDirection: qiblaDir,
          loading: false,
          error: null,
        }));
      },
      {
        timeout: 5000,
        enableHighAccuracy: false,
      }
    );

    // Setup device orientation
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = event.alpha;
      
      if (heading !== null) {
        // Adjust for compass heading (alpha gives rotation around z-axis)
        // For iOS, we might need to use webkitCompassHeading
        if ((event as any).webkitCompassHeading) {
          heading = (event as any).webkitCompassHeading;
        }
        
        setQiblaData(prev => ({
          ...prev,
          deviceHeading: heading,
        }));
      }
    };

    // Check if we need permission (iOS 13+)
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setQiblaData(prev => ({
        ...prev,
        needsPermission: true,
      }));
    } else {
      // Android or older iOS
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', (event) => {
            let heading = event.alpha;
            if ((event as any).webkitCompassHeading) {
              heading = (event as any).webkitCompassHeading;
            }
            
            if (heading !== null) {
              setQiblaData(prev => ({
                ...prev,
                deviceHeading: heading,
                needsPermission: false,
              }));
            }
          });
        }
      } catch (error) {
        console.error('Permission denied:', error);
        setQiblaData(prev => ({
          ...prev,
          error: 'تم رفض الإذن',
        }));
      }
    }
  };

  return { ...qiblaData, requestPermission };
}