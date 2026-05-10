import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import GoalSetupScreen, { GOAL_SET_KEY } from './src/screens/GoalSetupScreen';
import OnboardingScreen, { ONBOARDING_KEY } from './src/screens/OnboardingScreen';
import { COLORS } from './src/theme';

const AppBg = require('./elementsApp/AppBg.png');
const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

function RootNavigator() {
  const { user, uid, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [goalSet, setGoalSet] = useState<boolean | null>(null);

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
      .then((val) => {
        if (val === 'true') {
          setGoalSet(true);
        } else {
          // Fallback: if this is the user's very first sign-in ever, they need goal setup
          // Otherwise treat as goalSet (handles AsyncStorage wipe edge-case)
          const isFirstSignIn =
            user.metadata?.creationTime === user.metadata?.lastSignInTime;
          setGoalSet(!isFirstSignIn);
        }
      })
      .catch(() => setGoalSet(true));
  }, [user]);


  if (loading || onboarded === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!goalSet) {
    return <GoalSetupScreen uid={uid!} onDone={() => setGoalSet(true)} />;
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <ImageBackground source={AppBg} style={{ flex: 1 }} resizeMode="cover">
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ImageBackground>
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
