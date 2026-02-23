import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fetchMessages, sendMessage } from "../service/home/api.chat";
import { useAuth } from "../context/AuthContext";
import { formatMessageTime, formatDateLabel } from "../utils/dateUtils";

const Conversation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, otherUser } = route.params || {};
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const data = await fetchMessages(chatId, 0, 50);
      setMessages((data || []).slice().reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages();
    }, 2000); // Polling every 2 seconds
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages.length]);

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !chatId || sendingMessage) return;

    setSendingMessage(true);
    setMessageText("");

    const optimisticMsg = {
      messageId: Date.now(),
      chatId: chatId,
      senderId: user?.userId,
      content: text,
      imageUrl: null,
      sentAt: new Date().toISOString(),
      _optimistic: true,
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await sendMessage(chatId, { content: text });
      await loadMessages();
    } catch (error) {
      Alert.alert('Lỗi', 'Gửi tin nhắn thất bại');
      setMessages(prev => prev.filter(m => m.messageId !== optimisticMsg.messageId));
    } finally {
      setSendingMessage(false);
    }
  };

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach((msg) => {
      const msgDate = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', id: `date-${msgDate}`, label: formatDateLabel(msg.sentAt) });
      }
      groups.push({ type: 'message', id: msg.messageId?.toString(), data: msg });
    });
    return groups;
  };

  const currentUserId = user?.userId;
  const messageGroups = groupMessagesByDate(messages);
  const otherUserName = otherUser?.fullName || otherUser?.email || `User #${otherUser?.userId || '?'}`;
  const getInitials = (userId) => `U${userId}`;
  const avatarFallback = otherUser ? `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=random` : null;

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={{ alignItems: "center", marginVertical: 16 }}>
          <View style={{ backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280" }}>
              {item.label}
            </Text>
          </View>
        </View>
      );
    }

    const msg = item.data;
    const isMe = msg.senderId === currentUserId;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          marginBottom: 12,
          marginHorizontal: 16,
          justifyContent: isMe ? "flex-end" : "flex-start",
          opacity: msg._optimistic ? 0.6 : 1,
        }}
      >
        {!isMe && (
          <Image
            source={{ uri: otherUser?.avatarUrl || avatarFallback }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#e5e7eb",
            }}
          />
        )}

        <View style={{ maxWidth: "75%", gap: 4 }}>
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
            {msg.imageUrl && (
              <Image
                source={{ uri: msg.imageUrl }}
                style={{
                  width: 200,
                  height: 150,
                  resizeMode: "cover",
                  borderRadius: 8,
                  marginBottom: msg.content ? 8 : 0,
                }}
              />
            )}
            {!!msg.content && (
              <Text
                style={{
                  fontSize: 15,
                  color: isMe ? "#fff" : "#111827",
                  fontWeight: isMe ? "600" : "400",
                  lineHeight: 20,
                }}
              >
                {msg.content}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 10,
              color: "#9ca3af",
              paddingHorizontal: 4,
              textAlign: isMe ? 'right' : 'left'
            }}
          >
            {formatMessageTime(msg.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7f8" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ padding: 8, borderRadius: 20 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
              {otherUserName}
            </Text>
          </View>

          <Pressable style={{ padding: 8, borderRadius: 20 }}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#111827" />
          </Pressable>
        </View>

        {/* Messages List */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#389cfa" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messageGroups}
              keyExtractor={(item, index) => item.id || `fallback-${index}`}
              renderItem={renderItem}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              onLayout={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", marginTop: 40, paddingHorizontal: 20 }}>
                  <Text style={{ color: '#8e8e8e', textAlign: 'center' }}>Hãy gửi tin nhắn đầu tiên!</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Input Area */}
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
              style={{ flex: 1, fontSize: 14, color: "#111827" }}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9ca3af"
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={handleSendMessage}
            />
          </View>

          <Pressable
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: !messageText.trim() || sendingMessage ? "#9ca3af" : "#389cfa",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Conversation;
