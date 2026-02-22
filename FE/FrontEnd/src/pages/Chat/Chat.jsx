import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layout,
  List,
  Avatar,
  Input,
  Typography,
  Button,
  Badge,
  Card,
  Drawer,
  Divider,
  Tabs,
  Spin,
  message as antMessage,
} from 'antd';
import {
  MoreOutlined,
} from '@ant-design/icons';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Image as ImageIcon, 
  MapPin, 
  ArrowLeft,
  Ban,
  Flag,
  Shield,
  EyeOff,
} from 'lucide-react';
import { fetchMyChats, fetchMessages, sendMessage } from '../../service/home/api.chat';
import useAuth from '../../context/UseAuth';
import { formatTimeAgo, formatMessageTime, formatDateLabel } from '../../utils/utils';
import './Chat.css';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

const QUICK_REPLIES = [
  'Sản phẩm còn không?',
  'Giá này có thương lượng được không?',
  'Địa chỉ cụ thể ở đâu?',
  'Khi nào có thể xem hàng?',
];

export default function Chat() {
  const { chatId: chatIdParam } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.userId;

  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const selectedConversation = conversations.find(c => c.chatId === selectedChatId);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Get initials from a user ID
  const getInitials = (userId) => {
    return `U${userId}`;
  };

  // Fetch conversations
  const loadChats = useCallback(async () => {
    try {
      const data = await fetchMyChats();
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Fetch messages for selected chat
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const data = await fetchMessages(chatId, 0, 50);
      // API returns messages in descending order, reverse for display
      setMessages((data || []).slice().reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Auto-open chat when chatId is in URL params
  useEffect(() => {
    if (chatIdParam) {
      setSelectedChatId(Number(chatIdParam));
    }
  }, [chatIdParam]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages & chats
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      loadChats();
      if (selectedChatId) {
        loadMessages(selectedChatId);
      }
    }, 2000);
    return () => clearInterval(pollIntervalRef.current);
  }, [selectedChatId, loadChats, loadMessages]);

  // Send message
  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedChatId) return;

    setSendingMessage(true);
    setMessageText('');
    
    // Optimistic update
    const optimisticMsg = {
      messageId: Date.now(),
      chatId: selectedChatId,
      senderId: currentUserId,
      content: text,
      imageUrl: null,
      sentAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await sendMessage(selectedChatId, { content: text });
      // Reload messages to get the real one from server
      await loadMessages(selectedChatId);
      // Also refresh chat list to update lastMessage
      await loadChats();
    } catch (error) {
      antMessage.error('Gửi tin nhắn thất bại');
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.messageId !== optimisticMsg.messageId));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = (chatId) => {
    setSelectedChatId(chatId);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'unread') {
      // Since we don't have unread count from API, show all for now
      return true;
    }
    if (searchQuery.trim().length >= 3) {
      const query = searchQuery.toLowerCase();
      return (
        conv.lastMessage?.toLowerCase().includes(query) ||
        String(conv.otherUserId).includes(query)
      );
    }
    return true;
  });

  const infoItems = [
    { icon: <Flag size={16} />, label: 'Báo xấu' },
    { icon: <Ban size={16} />, label: 'Chặn người dùng' },
    { icon: <Shield size={16} />, label: 'Đánh dấu tin nhắn rác' },
    { icon: <EyeOff size={16} />, label: 'Ẩn hội thoại' },
  ];

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach((msg) => {
      const msgDate = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', label: formatDateLabel(msg.sentAt) });
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-container">
      <Layout className="chat-layout">
        {/* Conversations Sidebar */}
        <Sider
          className={`chat-sidebar ${selectedChatId ? 'hidden-sidebar' : ''}`}
          width={380}
          trigger={null}
          collapsible
          collapsed={false}
        >
          <div className="chat-sidebar-header">
            <div className="chat-header-top">
              <Title level={4} style={{ margin: 0 }}>
                Chat
              </Title>
              <Button type="text" icon={<MoreVertical size={20} />} />
            </div>

            <div className="chat-search">
              <Search size={18} className="search-icon" />
              <Input
                placeholder="Nhập 3 ký tự để bắt đầu tìm kiếm"
                className="chat-search-input"
                variant="filled"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs
              defaultActiveKey="all"
              onChange={(key) => setActiveTab(key)}
              items={[
                { key: 'all', label: 'Tất cả tin nhắn' },
                { key: 'unread', label: 'Tin chưa đọc' },
              ]}
              className="chat-tabs"
            />
          </div>

          <div className="chat-conversations-list">
            {loadingChats ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8e8e' }}>
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={filteredConversations}
                renderItem={(item) => (
                  <List.Item
                    className={`chat-list-item ${
                      selectedChatId === item.chatId ? 'active' : ''
                    }`}
                    onClick={() => handleSelectConversation(item.chatId)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: '#0091FF' }}
                          size={48}
                          className="chat-avatar"
                        >
                          {getInitials(item.otherUserId)}
                        </Avatar>
                      }
                      title={
                        <div className="chat-item-title">
                          <Text strong className="chat-name">
                            {item.otherUser?.fullName || item.otherUser?.email}
                          </Text>
                          <Text className="chat-time">
                            {formatTimeAgo(item.lastMessageAt)}
                          </Text>
                        </div>
                      }
                      description={
                        <Text className="chat-last-message" ellipsis>
                          {item.lastMessage || 'Chưa có tin nhắn'}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Sider>

        {/* Chat Area */}
        <Content className="chat-content">
          {selectedChatId ? (
            <Card className="chat-card" bordered={false}>
              {/* Chat Header */}
              <div className="chat-card-header">
                <div className="chat-header-left">
                  <Button
                    type="text"
                    icon={<ArrowLeft size={20} />}
                    className="chat-back-button"
                    onClick={() => setSelectedChatId(null)}
                  />
                  <Avatar
                    style={{ backgroundColor: '#0091FF' }}
                    size={40}
                    className="chat-avatar"
                  >
                    {selectedConversation ? getInitials(selectedConversation.otherUserId) : '?'}
                  </Avatar>
                  <div className="chat-header-info">
                    <Text strong className="chat-header-name">
                      {selectedConversation?.otherUser?.fullName || selectedConversation?.otherUser?.email}
                    </Text>
                  </div>
                </div>

                <Button
                  type="text"
                  icon={<MoreVertical size={20} />}
                  onClick={() => setDrawerVisible(true)}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Messages */}
              <div className="chat-messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8e8e' }}>
                    Hãy gửi tin nhắn đầu tiên!
                  </div>
                ) : (
                  messageGroups.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${idx}`} className="message-date">
                          <span className="date-badge">{item.label}</span>
                        </div>
                      );
                    }
                    const msg = item.data;
                    const isSent = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.messageId}
                        className={`message-group ${isSent ? 'sent' : 'received'}`}
                      >
                        {!isSent && (
                          <Avatar
                            style={{ backgroundColor: '#0091FF' }}
                            size={40}
                            className="message-avatar"
                          >
                            {selectedConversation ? getInitials(selectedConversation.otherUserId) : '?'}
                          </Avatar>
                        )}
                        <div className="message-content">
                          <div className="message-bubble">
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="attachment"
                                style={{ maxWidth: '200px', borderRadius: '4px', marginBottom: msg.content ? '8px' : 0 }}
                              />
                            )}
                            {msg.content && (
                              <p className="message-text">{msg.content}</p>
                            )}
                            <Button
                              type="text"
                              size="small"
                              icon={<MoreOutlined rotate={90} />}
                              className="message-menu"
                            />
                          </div>
                          <Text className="message-time">{formatMessageTime(msg.sentAt)}</Text>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer - Sticky Bottom */}
              <div className="chat-footer">
                {/* Quick Replies */}
                <div className="chat-quick-replies">
                  {QUICK_REPLIES.map((reply, idx) => (
                    <Button
                      key={idx}
                      className="quick-reply-btn"
                      onClick={() => setMessageText(reply)}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                  {/* <Button
                    type="text"
                    icon={<ImageIcon size={20} />}
                    className="input-icon-btn"
                  />
                  <Button
                    type="text"
                    icon={<MapPin size={20} />}
                    className="input-icon-btn"
                  /> */}
                  <Input
                    placeholder="Nhập tin nhắn"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onPressEnter={handleSendMessage}
                    className="message-input"
                    variant="filled"
                    disabled={sendingMessage}
                  />
                  <Button
                    type="primary"
                    icon={<Send size={16} />}
                    className="send-button"
                    disabled={!messageText.trim() || sendingMessage}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="chat-card empty-state" bordered={false}>
              <div className="empty-state-content">
                <div className="empty-state-inner">
                  <img
                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400"
                    alt="Chat illustration"
                    className="empty-state-image"
                  />
                  <Title level={3}>Chọn một cuộc trò chuyện</Title>
                  <Text className="empty-state-text">
                    💡 <strong>Mẹo!</strong> Giúp làm sáng tỏ thêm thông tin, tăng hiệu quả mua bán.
                  </Text>
                </div>
              </div>
            </Card>
          )}
        </Content>
      </Layout>

      {/* Info Drawer */}
      <Drawer
        title="Thông tin"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        placement="right"
      >
        <div className="drawer-content">
          <div className="user-info-section">
            <Avatar
              style={{ backgroundColor: '#0091FF' }}
              size={80}
              className="info-avatar"
            >
              {selectedConversation ? getInitials(selectedConversation.otherUserId) : '?'}
            </Avatar>
            <Title level={4}>User #{selectedConversation?.otherUserId}</Title>
            <Button type="primary" className="view-profile-btn">
              Xem Trang
            </Button>
          </div>

          <Divider />

          <div className="media-section">
            <Title level={5}>Ảnh và video</Title>
            <Text type="secondary">
              Hình, video mới nhất của trò chuyện sẽ xuất hiện tại đây
            </Text>
          </div>

          <Divider />

          <div className="actions-section">
            {infoItems.map((item, idx) => (
              <Button
                key={idx}
                type="text"
                block
                className="chat-action-button"
                icon={item.icon}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
