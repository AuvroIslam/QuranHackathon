import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookOpen, Compass, Home, User } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import ExploreScreen from '../screens/ExploreScreen';
import HomeScreen from '../screens/HomeScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuranScreen from '../screens/QuranScreen';
import { useTheme } from '../context/ThemeContext';
import { type AppColors, RADIUS, SHADOW } from '../theme';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Home size={22} color={focused ? colors.primary : colors.textMuted} />
            </View>
          ),
        }}
      >
        {({ navigation }) => (
          <HomeScreen
            onStartLesson={(resume) => navigation.navigate('Journey', { ayahOnly: false, resume })}
            onGetAyah={() => navigation.navigate('Journey', { ayahOnly: true, resume: false })}
          />
        )}
      </Tab.Screen>

      {/* Journey is navigated to programmatically — not shown in tab bar */}
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{ tabBarButton: () => null, tabBarLabel: () => null }}
      />

      <Tab.Screen
        name="Quran"
        component={QuranScreen}
        options={{
          tabBarLabel: 'Quran',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <BookOpen size={22} color={focused ? colors.primary : colors.textMuted} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Compass size={22} color={focused ? colors.primary : colors.textMuted} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <User size={22} color={focused ? colors.primary : colors.textMuted} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.card,
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 84 : 64,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      ...SHADOW.strong,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    iconWrap: {
      width: 38,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.md,
    },
    iconWrapActive: {
      backgroundColor: colors.primaryBg,
    },
  });
}
