import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

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
import Compare from "../screens/Compare";
import Listings from "../screens/Listings";
import MyReports from "../screens/MyReports";
import MyReviews from "../screens/MyReviews";
import PaymentResult from "../screens/PaymentResult";
import RepairShopMap from "../screens/RepairShopMap";
import Notifications from "../screens/Notifications";
import SellerListingDetail from "../screens/SellerListingDetail";

// Policy Screens
import HelpCenter from "../screens/Policy/HelpCenter";
import PricingPolicy from "../screens/Policy/PricingPolicy";
import PrivacyPolicy from "../screens/Policy/PrivacyPolicy";
import TermsOfUse from "../screens/Policy/TermsOfUse";

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
        tabBarHideOnKeyboard: true,
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
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tabs.Screen name="Home" component={Home} options={{ title: "Trang chủ" }} />
      <Tabs.Screen
        name="Favorites"
        component={Favorites}
        options={{ title: "Yêu thích" }}
      />
      <Tabs.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{ title: "Tin nhắn", headerShown: false }}
      />
      <Tabs.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Hồ sơ" }}
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

  const linking = {
    prefixes: [Linking.createURL("/"), "twogo://"],
    config: {
      screens: {
        PaymentResult: "payment-result",
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
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
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="Compare" component={Compare} />
            <Stack.Screen name="Listings" component={Listings} />
            <Stack.Screen name="RepairShopMap" component={RepairShopMap} />
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
            <Stack.Screen name="Conversation" component={Conversation} />
            <Stack.Screen name="AddListing" component={AddListingStack} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="Checkout" component={Checkout} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} />
            <Stack.Screen name="Subscription" component={Subscription} />
            <Stack.Screen name="MyPost" component={MyPost} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="PostListing" component={PostListing} />
            <Stack.Screen name="Compare" component={Compare} />
            <Stack.Screen name="Listings" component={Listings} />
            <Stack.Screen name="MyReports" component={MyReports} />
            <Stack.Screen name="MyReviews" component={MyReviews} />
            <Stack.Screen name="PaymentResult" component={PaymentResult} />
            <Stack.Screen name="RepairShopMap" component={RepairShopMap} />
            <Stack.Screen name="SellerListingDetail" component={SellerListingDetail} />
            
            {/* Policy Screens */}
            <Stack.Screen name="HelpCenter" component={HelpCenter} />
            <Stack.Screen name="PricingPolicy" component={PricingPolicy} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="TermsOfUse" component={TermsOfUse} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;

