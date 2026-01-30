import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

const Conversation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversation } = route.params || {};
  
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "other",
      text: "Hey! Is the bike still available?",
      timestamp: "10:23 AM",
      avatar: conversation?.avatar,
    },
    {
      id: 2,
      sender: "me",
      text: "Yes it is! I just replaced the tires last week, so it rides super smooth.",
      timestamp: "10:25 AM",
    },
    {
      id: 3,
      sender: "me",
      type: "image",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNSNu4ac7aa36XtU0xI6mFcN9nZ23JLZnh63PmjdMy01bwaSq2m6AcG8_U1_tRPCSXgnBP309uVgPkQaxzQVjNzAoYr_QXymkcFZOBRzAjrPMN5tWayHcgL5ZK0KI3BZVSh443KG8cpFKAE7cXD8F37P3cGWHjMiGXWdF_V9g-WpGBlRYsARxDZtbLosweUNGwUv3B8UPq4s2D01qSWowsuuC2Z2jpdnQPv1u4WMtKQu9NBbaNh4k2znhVgVrbk-t7GKhKbYrHzM",
      timestamp: "10:26 AM",
    },
    {
      id: 4,
      sender: "other",
      text: "Looks great. Would you take $800?",
      timestamp: "10:30 AM",
      avatar: conversation?.avatar,
    },
  ]);

  const flatListRef = useRef(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "me",
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setMessageText("");
    }
  };

  const MessageBubble = ({ message }) => {
    const isMe = message.sender === "me";

    if (message.type === "image") {
      return (
        <View
          style={{
            alignItems: isMe ? "flex-end" : "flex-start",
            marginBottom: 8,
            marginHorizontal: 16,
          }}
        >
          <View
            style={{
              maxWidth: "75%",
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: "#389cfa",
            }}
          >
            <Image
              source={{ uri: message.image }}
              style={{
                width: 200,
                height: 150,
                resizeMode: "cover",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#fff",
                  fontWeight: "500",
                }}
              >
                {message.timestamp}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          marginBottom: 12,
          marginHorizontal: 16,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe && message.avatar && (
          <Image
            source={{ uri: message.avatar }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#e5e7eb",
            }}
          />
        )}

        <View
          style={{
            maxWidth: "75%",
            gap: 4,
          }}
        >
          <View
            style={{
              backgroundColor: isMe ? "#389cfa" : "#fff",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              borderBottomLeftRadius: isMe ? 16 : 0,
              borderBottomRightRadius: isMe ? 0 : 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: isMe ? "#fff" : "#111827",
                fontWeight: isMe ? "600" : "400",
                lineHeight: 20,
              }}
            >
              {message.text}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: "#9ca3af",
              paddingHorizontal: 4,
            }}
          >
            {message.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f7f8" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        {/* Top Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#111827"
            />
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                {conversation?.name || "Chat"}
              </Text>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#389cfa",
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontWeight: "500",
                marginTop: 2,
              }}
            >
              Online
            </Text>
          </View>

          <Pressable
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              color="#111827"
            />
          </Pressable>
        </View>

        {/* Product Context */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 8,
            paddingVertical: 12,
            backgroundColor: "#f9fafb",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Image
            source={{ uri: conversation?.productImage }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: "#e5e7eb",
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#111827",
              }}
              numberOfLines={1}
            >
              Trek Domane AL 2
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#389cfa",
              }}
            >
              $850 • Used - Good
            </Text>
          </View>
          <Pressable
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#d1d5db",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              View
            </Text>
          </Pressable>
        </View>

        {/* Quick Action Chips */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#389cfa",
              borderRadius: 20,
              shadowColor: "#389cfa",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialCommunityIcons
              name="credit-card"
              size={18}
              color="#fff"
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#fff",
              }}
            >
              Make Offer
            </Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#f3f4f6",
              borderRadius: 20,
            }}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={18}
              color="#6b7280"
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#6b7280",
              }}
            >
              Test Ride
            </Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#f3f4f6",
              borderRadius: 20,
            }}
          >
            <MaterialCommunityIcons
              name="trending-up"
              size={18}
              color="#6b7280"
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#6b7280",
              }}
            >
              Price History
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
        ListHeaderComponent={
          <View
            style={{
              alignItems: "center",
              marginBottom: 24,
              gap: 8,
            }}
          >
            {/* Safety Banner */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#dbeafe",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#a8d8ff",
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color="#0369a1"
              />
              <Text
                style={{
                  fontSize: 12,
                  color: "#0369a1",
                  fontWeight: "500",
                }}
              >
                Keep communication inside the app for your safety.
              </Text>
            </View>

            {/* Date Separator */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Today, 10:23 AM
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          {/* Add Attachment */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color="#6b7280"
            />
          </Pressable>

          {/* Camera */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="camera"
              size={20}
              color="#6b7280"
            />
          </Pressable>

          {/* Text Input */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: 20,
              paddingHorizontal: 16,
              height: 40,
              gap: 8,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                fontSize: 14,
                color: "#111827",
              }}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={messageText}
              onChangeText={setMessageText}
            />
            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={20}
              color="#9ca3af"
            />
          </View>

          {/* Send Button */}
          <Pressable
            onPress={handleSendMessage}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#389cfa",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              shadowColor: "#389cfa",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color="#fff"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Conversation;
