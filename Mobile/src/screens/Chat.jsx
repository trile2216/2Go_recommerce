import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { fetchMyChats } from "../service/home/api.chat";
import { useAuth } from "../context/AuthContext";
import { formatTimeAgo } from "../utils/dateUtils";

const Chat = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    try {
      const data = await fetchMyChats();
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChats();
      const interval = setInterval(() => {
        loadChats(); // Silent polling
      }, 3000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const filteredConversations = conversations.filter((conv) => {
    if (searchText.trim().length >= 3) {
      const query = searchText.toLowerCase();
      const otherUser = conv.otherUser;
      const name = otherUser?.fullName || otherUser?.email || "";
      return name.toLowerCase().includes(query) || (conv.lastMessage && conv.lastMessage.toLowerCase().includes(query));
    }
    return true;
  });

  const ConversationItem = ({ item }) => {
    const otherUser = item.otherUser || {};
    const name = otherUser.fullName || otherUser.email || `User #${item.otherUserId}`;
    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    return (
      <Pressable
        onPress={() =>
          navigation.navigate("Conversation", { chatId: item.chatId, otherUser: otherUser })
        }
        style={({ pressed }) => ({
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: pressed ? "#f9fafb" : "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        })}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: otherUser.avatarUrl || avatarFallback }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#e5e7eb",
            }}
          />
        </View>

        <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#9ca3af",
                marginLeft: 8,
              }}
            >
              {formatTimeAgo(item.lastMessageAt)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: "#6b7280",
            }}
            numberOfLines={1}
          >
            {item.lastMessage || 'Chưa có tin nhắn'}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#111827",
            letterSpacing: 0.5,
          }}
        >
          Trò chuyện
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            height: 48,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#6b7280"
          />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color: "#111827",
            }}
            placeholder="Tìm kiếm trò chuyện..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#389cfa" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.chatId.toString()}
          renderItem={({ item }) => <ConversationItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 80,
            flexGrow: 1
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 60,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#f3f4f6",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={40}
                  color="#d1d5db"
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Chưa có cuộc trò chuyện nào
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                Bắt đầu trò chuyện với người bán hoặc người mua khác
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Chat;
