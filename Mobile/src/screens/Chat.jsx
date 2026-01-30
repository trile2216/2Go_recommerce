import React, { useState } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const Chat = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Alex Johnson",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7f4vv0orVpRdmpBGT1g5ISS6V2aXV1riENbg5yRv5dE-aKBCXjLyM-BFfPjlZT-R0vz4DY-nt0v2VaDynWV6BJyB2KxpV33SE5t7uuasYiTKi-1ScktJm89c2F0Xves8JETacTFV-MvNqfOT1UxrvJDFGkP-SM4vAAlpHQcY1oZjSArjcvFy6hHMWENlLvaGm57Y42l7Mkf84pAWM4XQWuKN_icpIAIDHQzTNfHSvDok2F0KH3D1hCXV5AOhZGeEcAmaWt-3cEGY",
      lastMessage: "Is the Trek Domane still available?",
      time: "2m ago",
      type: "Buying",
      productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB093d6ODpJKJsbbWqPya86PcYQi6EONSZSr-PY8TvmNOfBuqe-zSuxGr7gvPWCI1WnI-Q8tlEVO-NH6cWl6jPLJAbkN1DTxsUJ_j5lt9NOkdQqIwmSZcEthHqqT6aP9j3DTiluM81NizoIJGuUUaeLyTtKnFFhWnFAmkbd1vjFvx5Xk1o3ToFSAvGjFsdiOe8tTOqJz6a9t7ewP9iztff-QeoSyQQMmv2q6whpu9ktfrogHVrqZ3HQqggL6d12L2ClNWM3ekOPtg0",
      unread: true,
      online: true,
    },
    {
      id: 2,
      name: "BikeShop_Official",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsnbORpV4QLK6JUy9-Xf4nLF7wewU9qmiw61ye78M9iIrjw15beiNrtqeV5MHUp9G_Wrn0fYtcVUz7QqEMiw9Ar_EjBeMPeQU2u0Gh-kDgUG3rRKaJmPIoBe-z67r8fPq1hMwH-TcKHc_DrQs113IkKcK8Q9eRGFEbnCP5cSPnFubFkZ-gEk9OiLzM9v14NQ_1IGtxK9WCww3h6fJbQRqO2yvjmuVodueb0oVta3MRER9v2l-iIzrsr8ro38PoJVRXculBISSE6Hk",
      lastMessage: "Great, see you on Tuesday!",
      time: "1h ago",
      type: "Selling",
      productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQRruJp8rwAq5hMx51FGPrH2knjHm4s0rMupTH5tKD38Gj16qEJKxBcEFwJwbYrq6sZnx4STeb--WyD7-m-d17uqlklSLPSZ50MQWuFNRehMbiJz6WByDY6Az0EOvTxWIIZQutYtwPJVUaoIA42O_v8spizotqvD4cSYqnz7eqUIAtlw8Q5ymsrFKTVtgnCYFv-8mZC8JfFBPojR6czpy8q-tBtdRSorIBtmT0dQc6DsxRxLFK4w_C7xOIka4J4EgoOPC4GgD_JE4",
      unread: false,
      online: false,
    },
    {
      id: 3,
      name: "Sarah K.",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuACXc2N8t-7nhDbmRlDGcMu29aiAN9zRIceR0LXWMOvUFW6WPCtdMftiW7g4m2RTJbWz_PlElfxnRFK5l6bMYggHvBa3zmoxATZcDWUP5M5aTSQsFIMafZVSzv3dToO5Ecyc-ip8-TjqgyDrFBbN5N4DYM3d91l196uxYzq6jRv2sxe_OYQiCBD_H3xlNa74gt5uadh4jME6NKysOYeVgqq8n1s_liPmgRAegec_Dj3WwzIqI88c8iRJHwrWYTBXwy7GHmIyh-fo5Q",
      lastMessage: "Would you accept $450?",
      time: "Yesterday",
      type: "Selling",
      productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSGLJJ-zUf3oc0AIMbuEwVmof80vd7KLxwhq3H8f_Gi8_fXdPUUGUYob0IEObCgGOyguWbp-mlQDVy9bfu6aYGcwfpARdNCMMTjoUoPGfxEwd-ZBCneVnVNp_3xB1-9itx29n6Rwt-jRQWjN9Zq6YXD9SYpU8wFUiwtbP8WvFETRgWakARv0RWa2229JNdmvv3lRUVUG1VFua10LPU8u07QUG5_Merv_LrtyuO0W416XHTIgFuXDy8DJpdsopk48i7BO5Un0-sJAs",
      unread: false,
      online: false,
    },
    {
      id: 4,
      name: "Mike R.",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCcz4QDZ5sakVDLapgm0R6jv0fZT43ZwbvcEM6WlUouUrYuo1SBmopiVZfVGVNhbtvmau37_TEGLFMqvBi4wcqiCQdmMvMgjNcorErbpHXgakbZzrqxZq7c0F1IwvGZfb5XXqbmfa82GhO1Zn7PMrYCCVkDuw8Qy40aUYM5OHBEZo8JxP-1ZugdR_jhSZGSLogIFmZ-S6kXCHkkW1cPn8LQRpAgzowjzr80BobMoKAp_42924V5Iq-0XY3O_RXqEbrsgE_ZjZUVD8",
      lastMessage: "Can you send more photos of the gears?",
      time: "Wednesday",
      type: "Buying",
      productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFclkVYu4i-N8q0KsIlcy2Iat-covt7Oym8Kc8n40WHcuCwGO0ozHaWnzzq-0Ar_mmV12u8M43md-MIrC4kZGOoKas-lu4CL5EjPupIiUE-iOX9tzrBy6hfh11VuzkPhsz4xMaS0ls1rMdPUU_rWg95BQGp92RlGYbYMDPkYkAT8v4UwhhtgU3PXNpeKkExBcHbq3XzDG-o0bw-cdOa-8QgPKyJ42_2h192d-m9xONkZ50n6jNXAPp1cdo2kUblHSADFG_slFbkwo",
      unread: false,
      online: true,
    },
    {
      id: 5,
      name: "Emily",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Z3GPiBJlGUPYxiidrmItSbAUyND2TLRaN_nHIrQlTESAboYWZ97OnLB02BQhmpDXIqYoHYlAixLOqJjtt5UFz-oL0fPGV4r2gFSYS0aXYB4k2OEv48tBr3dFaYJFPRBA_yHk1t19Ratjr7ZCYdELibSc_xQMuXup41D1Bkr-yLEFtnIfUKc0PMhDTYOnsZGGsPlVIg-Z5XphR79k-EVjlodPXapOS5aYu-_j4P0tp39n6QQ_tLlnUb-t4CzOVszIN2cTaVHnQho",
      lastMessage: "Still available? I can pick up.",
      time: "Last week",
      type: "Buying",
      productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT0LCmRC-PldHzDKhAubdjs3Ag8N75j1tw2H9ipXhaEPk8SRrhc8foqeUQTnVtf_yMpN3DvFKaoIVVjVBvI_ifL8dqK-e8bcBB48znLkCGvrqVvZsXlg1LJD9ph--VoooAidkDPwzSCyEq-mppWZSjvNSsxobCBuamdPgkOfXz-CHF185WJ4phqoufVWZqEqXWRZQjwiXZoirSVUkYhUA0tV_3fQZ7K78ooDQrBFapSVRXv1e8IvRpVWqARMHO7TOgcZUyUTKIh5U",
      unread: false,
      online: false,
    },
  ];

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const ConversationItem = ({ item }) => (
    <Pressable
      onPress={() =>
        navigation.navigate("Conversation", { conversation: item })
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
      {/* Avatar with Online Status */}
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.avatar }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#e5e7eb",
          }}
        />
        {item.online && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#389cfa",
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
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
              fontWeight: item.unread ? "700" : "500",
              color: "#111827",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: item.unread ? "#389cfa" : "#9ca3af",
              marginLeft: 8,
            }}
          >
            {item.time}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: item.unread ? "#111827" : "#6b7280",
            fontWeight: item.unread ? "600" : "400",
          }}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>

        {/* Badge */}
        <View>
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor:
                item.type === "Buying" ? "#dbeafe" : "#dcfce7",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color:
                  item.type === "Buying" ? "#0369a1" : "#15803d",
              }}
            >
              {item.type}
            </Text>
          </View>
        </View>
      </View>

      {/* Product Thumbnail */}
      <View
        style={{
          position: "relative",
        }}
      >
        <Image
          source={{ uri: item.productImage }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            backgroundColor: "#e5e7eb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        />
        {item.unread && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#389cfa",
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
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
          Messages
        </Text>
      </View>

      {/* Search Bar */}
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
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => <ConversationItem item={item} />}
        contentContainerStyle={{
          paddingBottom: 80,
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
              No conversations found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Start a conversation by browsing bikes
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Chat;
