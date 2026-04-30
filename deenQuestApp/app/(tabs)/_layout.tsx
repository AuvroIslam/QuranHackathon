import { Tabs } from "expo-router";
import { Home, BookOpen, CheckSquare, Users, MessageCircle } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#10122e",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#E491C9",
        tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="quran" options={{ title: "Quran", tabBarIcon: ({ color }) => <BookOpen size={22} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarIcon: ({ color }) => <CheckSquare size={22} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="ai" options={{ title: "Ask AI", tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} /> }} />
    </Tabs>
  );
}
