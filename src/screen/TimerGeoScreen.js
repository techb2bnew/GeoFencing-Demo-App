import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, Alert, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';

// 👇 Your Google Maps API key here
Geocoder.init('AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI'); // Replace with your actual key

const ADDRESS = "JohnsonLifts, Mohali"; // 👈 Just change this

const TimerGeoScreen = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [location, setLocation] = useState(null);
  const [targetCoords, setTargetCoords] = useState(null);
  const [isInsideArea, setIsInsideArea] = useState(false);
  const intervalRef = useRef(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission Required",
            message: "This app needs to access your location.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const json = await Geocoder.from(address);
      const location = json.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const fetchTargetCoords = async () => {
    const coords = await getCoordinatesFromAddress(ADDRESS);
    console.log('📍 Address fetched coords:', coords);
    if (coords) {
      const fullCoords = { ...coords, radius: 20.5 };
      console.log('📍 Setting targetCoords:', fullCoords);
      setTargetCoords(fullCoords);
    } else {
      Alert.alert("Error", "Could not fetch location from address.");
    }
  };

  useEffect(() => {
    fetchTargetCoords();
  }, []);

  useEffect(() => {
    if (!targetCoords) return;

    let watchId;

    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }

      watchId = Geolocation.watchPosition(
        position => {
          console.log("📍 Location update received:", position);

          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          const distance = getDistanceFromLatLonInMeters(
            latitude,
            longitude,
            targetCoords.latitude,
            targetCoords.longitude
          );

          if (distance <= targetCoords.radius) {
            setIsInsideArea(true);
          } else {
            setIsInsideArea(false);
            if (running) {
              stopTimer();
              Alert.alert("Alert", "You are outside the designated area!");
            }
          }
        },
        error => console.log('Location error: ', error),
        { enableHighAccuracy: true, distanceFilter: 0 }
      );
    })();

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [targetCoords, running]);

  const startTimer = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const toggleTimer = () => {
    if (running) {
      stopTimer();
    } else if (isInsideArea) {
      startTimer();
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={{ flex: 1 }}>
      {targetCoords && (
        <MapView
          style={{ flex: 1 }}
          region={{
            latitude: targetCoords.latitude,
            longitude: targetCoords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={targetCoords} title={ADDRESS} />
          {targetCoords.radius && typeof targetCoords.radius === 'number' ? (
            <Circle
              center={targetCoords}
              radius={targetCoords.radius}
              strokeColor="rgba(255,0,0,0.5)"
              fillColor="rgba(255,0,0,0.2)"
            />
          ) : (
            console.log("❌ Invalid radius or targetCoords")
          )}
          {location && <Marker coordinate={location} title="You" pinColor="blue" />}
        </MapView>
      )}


      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Time: {formatTime(seconds)}</Text>
        <Button
          title={running ? "Stop Timer" : "Start Timer"}
          onPress={toggleTimer}
          disabled={!isInsideArea}
        />
      </View>
    </View>
  );
};

export default TimerGeoScreen;
