import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createNavigationContainerRef, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import GoalSetupScreen, { GOAL_SET_KEY } from './src/screens/GoalSetupScreen';
import OnboardingScreen, { ONBOARDING_KEY } from './src/screens/OnboardingScreen';
import { LIGHT_COLORS } from './src/theme';

// Configure Google Sign-In once at app startup
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const navigationRef = createNavigationContainerRef<any>();

const AppBg = require('./elementsApp/AppBg.png');
const AppBgDark = require('./elementsApp/AppBgDark.png');
const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

function RootNavigator() {
  const { user, uid, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [goalSet, setGoalSet] = useState<boolean | null>(null);
  const notifSubRef = useRef<Notifications.EventSubscription | null>(null);

  // Handle notification taps — navigate to the screen stored in notification data
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen && navigationRef.isReady()) {
        navigationRef.navigate(screen as never);
      }
    };

    notifSubRef.current = Notifications.addNotificationResponseReceivedListener(handleResponse);

    // App opened by tapping notification from killed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen) {
        setTimeout(() => {
          if (navigationRef.isReady()) navigationRef.navigate(screen as never);
        }, 500);
      }
    });

    return () => { notifSubRef.current?.remove(); };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => setOnboarded(val === 'true'))
      .catch(() => setOnboarded(false));
  }, []);

  // Read goalSet from AsyncStorage whenever the user changes
  useEffect(() => {
    if (!user) {
      setGoalSet(null);
      return;
    }
    const key = `${GOAL_SET_KEY}_${user.uid}`;
    AsyncStorage.getItem(key)
      .then((val) => setGoalSet(val === 'true'))
      .catch(() => setGoalSet(false));
  }, [user]);


  if (loading || onboarded === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={LIGHT_COLORS.primary} />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onDone={() => setOnboarded(true)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Wait until we know whether goal has been set
  if (goalSet === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={LIGHT_COLORS.primary} />
      </View>
    );
  }

  if (!goalSet) {
    return <GoalSetupScreen uid={uid!} onDone={() => setGoalSet(true)} />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={NAV_THEME}>
        <AppNavigator />
    </NavigationContainer>
  );
}

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <ImageBackground source={isDark ? AppBgDark : AppBg} style={{ flex: 1 }} resizeMode="cover">
        <RootNavigator />
      </ImageBackground>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
