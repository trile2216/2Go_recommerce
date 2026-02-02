import { useState } from 'react';
import {
  Layout,
  List,
  Avatar,
  Input,
  Typography,
  Button,
  Badge,
  Card,
  Dropdown,
  Drawer,
  Divider,
  Tabs,
} from 'antd';
import {
  MoreOutlined,
  ArrowLeftOutlined,
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
import './Chat.css';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

const CONVERSATIONS = [
  {
    id: '1',
    name: 'Tạ Như Mộng',
    initials: 'TM',
    lastMessage: 'Cảm ơn bạn đã quan tâm đề...',
    time: '2 giờ trước',
    unread: 2,
  },
  {
    id: '2',
    name: 'Tuyen dung HomeKit',
    initials: 'TH',
    lastMessage: 'Bạn cho mình xin thông tin: h...',
    time: '5 giờ trước',
    unread: 0,
  },
  {
    id: '3',
    name: 'Nguyễn Hoài Anh',
    initials: 'NA',
    lastMessage: 'Sản phẩm còn không bạn?',
    time: '1 ngày trước',
    unread: 1,
  },
  {
    id: '4',
    name: 'Trần Đại Phú',
    initials: 'TP',
    lastMessage: 'Ok, tôi sẽ đến lấy vào chiều nay',
    time: '2 ngày trước',
    unread: 0,
  },
  {
    id: '5',
    name: 'Võ Thị Kim Dự',
    initials: 'VK',
    lastMessage: 'Giá này có giảm được không?',
    time: '3 ngày trước',
    unread: 0,
  },
];

const QUICK_REPLIES = [
  'Sản phẩm còn không?',
  'Giá này có thương lượng được không?',
  'Địa chỉ cụ thể ở đâu?',
  'Khi nào có thể xem hàng?',
];

const MESSAGES = [
  {
    id: 1,
    senderId: 1,
    senderName: 'Tạ Như Mộng',
    text: 'Cảm ơn bạn đã quan tâm đề nghị tuyển dụng của chúng tôi. Bạn vui lòng liên hệ và gửi CV qua website/QLý tin nhé. Chúng tôi sẽ phản hồi sớm nhất.',
    timestamp: '10:30 AM',
  },
  {
    id: 2,
    senderId: 1,
    senderName: 'Tạ Như Mộng',
    text: 'Xin vui lòng nộp thông tin qua link. Quản lý sẽ liên hệ.\nhttps://bit.ly/ChucksJobs',
    timestamp: '10:31 AM',
  },
];

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const selected = CONVERSATIONS.find((c) => c.id === selectedConversation);

  const infoItems = [
    {
      icon: <Flag size={16} />,
      label: 'Báo xấu',
    },
    {
      icon: <Ban size={16} />,
      label: 'Chặn người dùng',
    },
    {
      icon: <Shield size={16} />,
      label: 'Đánh dấu tin nhắn rác',
    },
    {
      icon: <EyeOff size={16} />,
      label: 'Ẩn hội thoại',
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <Layout className="chat-layout">
        {/* Conversations Sidebar */}
        <Sider
          className={`chat-sidebar ${selectedConversation ? 'hidden-sidebar' : ''}`}
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
                className="search-input"
                variant="filled"
              />
            </div>

            <Tabs
              defaultActiveKey="all"
              items={[
                {
                  key: 'all',
                  label: 'Tất cả tin nhắn',
                },
                {
                  key: 'unread',
                  label: 'Tin chưa đọc',
                },
              ]}
              className="chat-tabs"
            />
          </div>

          <div className="chat-conversations-list">
            <List
              itemLayout="horizontal"
              dataSource={CONVERSATIONS}
              renderItem={(item) => (
                <List.Item
                  className={`chat-list-item ${
                    selectedConversation === item.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedConversation(item.id)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={item.unread} color="#0091FF" offset={[-5, 5]}>
                        <Avatar
                          style={{ backgroundColor: '#0091FF' }}
                          size={48}
                          className="chat-avatar"
                        >
                          {item.initials}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <div className="chat-item-title">
                        <Text strong className="chat-name">
                          {item.name}
                        </Text>
                        <Text className="chat-time">{item.time}</Text>
                      </div>
                    }
                    description={
                      <Text className="chat-last-message" ellipsis>
                        {item.lastMessage}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Sider>

        {/* Chat Area */}
        <Content className="chat-content">
          {selectedConversation ? (
            <Card className="chat-card" bordered={false}>
              {/* Chat Header */}
              <div className="chat-card-header">
                <div className="chat-header-left">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined size={20} />}
                    className="back-button"
                    onClick={() => setSelectedConversation(null)}
                  />
                  <Avatar
                    style={{ backgroundColor: '#0091FF' }}
                    size={40}
                    className="chat-avatar"
                  >
                    {selected?.initials}
                  </Avatar>
                  <div className="chat-header-info">
                    <Text strong className="chat-header-name">
                      {selected?.name}
                    </Text>
                    <Text className="chat-header-status">Hoạt động 2 giờ trước</Text>
                  </div>
                </div>

                <Button
                  type="text"
                  icon={<MoreVertical size={20} />}
                  onClick={() => setDrawerVisible(true)}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Product Context */}
              <div className="chat-product-context">
                <div className="product-card">
                  <img
                    src="https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=100"
                    alt="Product"
                    className="product-image"
                  />
                  <div className="product-info">
                    <Text strong className="product-name">
                      iPhone 13 Pro 128GB Vàng
                    </Text>
                    <Text className="product-price">15.500.000 đ</Text>
                    <Text className="product-status">
                      (Tin tự ẩn hết hạn hoặc đã bán)
                    </Text>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                <div className="message-date">
                  <span className="date-badge">Hôm nay</span>
                </div>

                {MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-group ${
                      msg.senderId === 1 ? 'received' : 'sent'
                    }`}
                  >
                    <Avatar
                      style={{ backgroundColor: '#0091FF' }}
                      size={40}
                      className="message-avatar"
                    >
                      {selected?.initials}
                    </Avatar>
                    <div className="message-content">
                      <Text className="message-sender">{msg.senderName}</Text>
                      <div className="message-bubble">
                        <p className="message-text">{msg.text}</p>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined rotate={90} />}
                          className="message-menu"
                        />
                      </div>
                      <Text className="message-time">{msg.timestamp}</Text>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies */}
              <div className="chat-quick-replies">
                {QUICK_REPLIES.map((reply, idx) => (
                  <Button
                    key={idx}
                    className="quick-reply-btn"
                    onClick={() => setMessage(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </div>

              {/* Input Area */}
              <div className="chat-input-area">
                <Button
                  type="text"
                  icon={<ImageIcon size={20} />}
                  className="input-icon-btn"
                />
                <Button
                  type="text"
                  icon={<MapPin size={20} />}
                  className="input-icon-btn"
                />
                <Input
                  placeholder="Nhập tin nhắn"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onPressEnter={handleSendMessage}
                  className="message-input"
                  variant="filled"
                />
                <Button
                  type="primary"
                  icon={<Send size={16} />}
                  className="send-button"
                  disabled={!message.trim()}
                  onClick={handleSendMessage}
                />
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
              {selected?.initials}
            </Avatar>
            <Title level={4}>{selected?.name}</Title>
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
                className="action-button"
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
