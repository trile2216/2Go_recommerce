import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Screens
import Login from "../screens/Login";
import Register from "../screens/Register";
import Home from "../screens/Home";
import Detail from "../screens/Detail";
import Favorites from "../screens/Favorites";
import Chat from "../screens/Chat";
import Conversation from "../screens/Conversation";
import Profile from "../screens/Profile";
import PostListing from "../screens/PostListing";
import Cart from "../screens/Cart";
import Checkout from "../screens/Checkout";
import Orders from "../screens/Orders";
import OrderDetail from "../screens/OrderDetail";
import Subscription from "../screens/Subscription";
import MyPost from "../screens/MyPost";

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();
const ChatStack = createStackNavigator();

// Chat Stack
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

// PostListing Stack
const AddListingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PostListingScreen" component={PostListing} />
    </Stack.Navigator>
  );
};

// Guest Bottom Tabs (Home only, with login prompts on other tabs)
const GuestTabs = () => {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "LoginTab") iconName = "login";

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: "#359EFF",
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
      <Tabs.Screen name="Home" component={Home} options={{ title: "Home" }} />
      <Tabs.Screen
        name="LoginTab"
        component={Login}
        options={{ title: "Đăng nhập" }}
      />
    </Tabs.Navigator>
  );
};

// Main User Tabs (logged in)
const MainStack = () => {
  const { cartCount } = useCart();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Favorites") {
            iconName = "heart";
          } else if (route.name === "AddListing") {
            iconName = "plus";
          } else if (route.name === "Chat") {
            iconName = "chat";
          } else if (route.name === "Profile") {
            iconName = "account";
          }

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={size}
              color={color}
              style={{ fontVariationSettings: focused ? "'FILL' 1" : "'FILL' 0" }}
            />
          );
        },
        tabBarActiveTintColor: "#359EFF",
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
      <Tabs.Screen name="Home" component={Home} options={{ title: "Home" }} />
      <Tabs.Screen
        name="Favorites"
        component={Favorites}
        options={{ title: "Wishlist" }}
      />
      <Tabs.Screen
        name="AddListing"
        component={AddListingStack}
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
        options={{ title: "Messages", headerShown: false }}
      />
      <Tabs.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile" }}
      />
    </Tabs.Navigator>
  );
};

// Root Navigator
const RootNavigation = () => {
  const { isLoggedIn, loading, token } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#359EFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn || !token ? (
          // Guest: Home, Detail, Login, Register only
          <>
            <Stack.Screen name="GuestMain" component={GuestTabs} />
            <Stack.Screen
              name="Detail"
              component={Detail}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : (
          // Authenticated: all screens
          <>
            <Stack.Screen name="Main" component={MainStack} />
            <Stack.Screen
              name="Detail"
              component={Detail}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="Checkout" component={Checkout} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} />
            <Stack.Screen name="Subscription" component={Subscription} />
            <Stack.Screen name="MyPost" component={MyPost} />
            <Stack.Screen name="PostListing" component={PostListing} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;

