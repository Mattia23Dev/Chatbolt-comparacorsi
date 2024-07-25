import React from 'react';
import { List, Avatar, Badge } from 'antd';
import { WhatsAppOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import moment from 'moment'

const ChatList = ({ chats, setSelectedChat }) => {
    const getLastMessage = (messages) => {
        if (!messages || messages.length === 0) return '';
    
        const lastMessage = messages.reduce((latest, message) => {
          return moment(message.timestamp).isAfter(latest.timestamp) ? message : latest;
        });
    
        const messageText = `${lastMessage.content}`;
        const truncatedMessage = messageText.length > 25 ? `${messageText.substring(0, 25)}...` : messageText;
        return `${truncatedMessage}`;
      };
  return (
    <div className="chat-list-container">
    <List
      itemLayout="horizontal"
      dataSource={chats}
      renderItem={chat => (
        <List.Item onClick={() => setSelectedChat(chat)} className="chat-list-item">
          <List.Item.Meta
            avatar={<Avatar icon={<WhatsAppOutlined />} />}
            title={<span className="chat-list-item-name">{chat.first_name && chat.last_name ? chat.first_name + ' ' + chat.last_name : chat.first_name && !chat.last_name ? chat.first_name : "Utente"}</span>}
            description={<span className="chat-list-item-lastMessage">{getLastMessage(chat?.messages)}</span>}
          />
          <div className="chat-list-item-time">{chat.lastMessage}</div>
        </List.Item>
      )}
    />
    </div>
  );
};

export default ChatList;

