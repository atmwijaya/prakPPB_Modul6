import { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth, AuthProvider } from "./src/context/AuthContext.js";
import { MonitoringScreen } from "./src/screens/MonitoringScreen";
import { ControlScreen } from "./src/screens/ControlScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { assertConfig } from "./src/services/config";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

enableScreens(true);

// Tab Navigator untuk user yang sudah login
function AuthenticatedTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: "IOTWatch",
        headerTitleAlign: "center",
        headerTintColor: "#1f2937",
        headerStyle: { backgroundColor: "#f8f9fb" },
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === "Monitoring" ? "analytics" : "options";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator untuk menentukan flow berdasarkan auth status
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Atau tampilkan loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // User sudah login - tampilkan tab navigator
        <Stack.Screen name="MainTabs" component={AuthenticatedTabs} />
      ) : (
        // User belum login - tampilkan monitoring dan login screen
        <>
          <Stack.Screen 
            name="Monitoring" 
            component={MonitoringScreen}
            options={{
              headerShown: true,
              headerTitle: "IOTWatch",
              headerTitleAlign: "center",
              headerTintColor: "#1f2937",
              headerStyle: { backgroundColor: "#f8f9fb" },
              headerTitleStyle: { fontWeight: "600", fontSize: 18 },
            }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              headerShown: true,
              headerTitle: "Login",
              headerTitleAlign: "center",
              headerTintColor: "#1f2937",
              headerStyle: { backgroundColor: "#f8f9fb" },
              headerTitleStyle: { fontWeight: "600", fontSize: 18 },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    assertConfig();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#f8f9fb",
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={theme}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}