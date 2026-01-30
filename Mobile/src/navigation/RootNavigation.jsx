import { createStackNavigator } from "@react-navigation/stack";
import Home from "../screens/Home";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Detail from "../screens/Detail";
import Favorites from "../screens/Favorites";
import Login from "../screens/Login";
import Profile from "../screens/Profile";
import Chat from "../screens/Chat";
import Conversation from "../screens/Conversation";
import PostListing from "../screens/PostListing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, View } from "react-native";

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();
const ChatStack = createStackNavigator();

const ChatStackNavigator = () => {
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ChatStack.Screen name="ChatList" component={Chat} />
      <ChatStack.Screen name="Conversation" component={Conversation} />
    </ChatStack.Navigator>
  );
};

const BottomTabs = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(() => {
    checkLoginStatus();
  });

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error("Error checking login status:", error);
      setIsLoggedIn(false);
    }
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Favorites") {
            iconName = "heart";
          } else if (route.name === "Chat") {
            iconName = "chat";
          } else if (route.name === "Profile") {
            iconName = "account";
          }

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={color}
              style={{ fontVariationSettings: focused ? "'FILL' 1" : "'FILL' 0" }}
            />
          );
        },
        tabBarActiveTintColor: "#389cfa",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 64,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen
        name="Home"
        component={Home}
        options={{ title: "Home", headerShown: true }}
      />
      <Tabs.Screen
        name="Favorites"
        component={Favorites}
        options={{ title: "Wishlist" }}
      />
      <Tabs.Screen
        name="PostListing"
        component={PostListing}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("PostListingStack");
          },
        })}
        options={{
          title: "",
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                position: "absolute",
                bottom: 10,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#359EFF",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#359EFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{ title: "Messages" }}
      />
      <Tabs.Screen
        name="Profile"
        component={isLoggedIn ? Profile : Login}
        options={{ title: isLoggedIn ? "Profile" : "Login" }}
      />
    </Tabs.Navigator>
  );
};

const RootNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainApp"
          component={BottomTabs}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PostListingStack"
          component={PostListing}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
