import { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext.js";
import { MonitoringScreen } from "./src/screens/MonitoringScreen";
import { ControlScreen } from "./src/screens/ControlScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
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
          let iconName;
          
          if (route.name === "Monitoring") {
            iconName = "analytics";
          } else if (route.name === "Control") {
            iconName = "options";
          } else if (route.name === "Profile") {
            iconName = "person";
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator untuk menentukan flow berdasarkan auth status
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load resources, make API calls, etc.
        await assertConfig();
        
        // Artificially delay for 2 seconds to show splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#f8f9fb",
    },
  };

  if (!appIsReady) {
    return <SplashScreen />;
  }

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