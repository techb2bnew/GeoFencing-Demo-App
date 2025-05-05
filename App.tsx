import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import TimerGeoScreen from './src/screen/TimerGeoScreen';
import TimerGeoAndroidScreen from './src/screen/TimerGeoAndroidScreen';
import messaging from '@react-native-firebase/messaging';



const App = () => {
  
  useEffect(() => {
    requestUserPermission();
    getFCMToken();
  }, []);

  // 🔔 Ask notification permission
  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
    if (enabled) {
      console.log('Notification permission status:', authStatus);
    }
  };

  // 🔐 Get FCM Token
  const getFCMToken = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();

      const token = await messaging().getToken();
      console.log('FCM Token:', token);
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" ? <TimerGeoAndroidScreen /> : <TimerGeoScreen />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#000',
  },
});

export default App;
