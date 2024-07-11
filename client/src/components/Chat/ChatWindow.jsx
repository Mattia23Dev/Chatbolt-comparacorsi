import React from 'react';
import { List, Avatar } from 'antd';
import { WhatsAppOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment'

const ChatWindow = ({ selectedChat }) => {
    const formatTimestamp = (timestamp) => {
        const now = moment();
        const messageTime = moment(timestamp);
        if (now.isSame(messageTime, 'day')) {
          return messageTime.format('HH:mm');
        } else {
          return messageTime.format('DD-MM HH:mm');
        }
      };
  return (
    <div>
      <div className="chat-header">
        <Avatar icon={<UserOutlined />} />
        <span>{selectedChat?.first_name && selectedChat?.last_name ? selectedChat?.first_name + ' ' + selectedChat?.last_name :
            selectedChat?.first_name && !selectedChat?.last_name ? selectedChat?.first_name : 'Utente'}</span>
      </div>
      <div className="chat-messages">
        {selectedChat?.messages.map(message => (
            <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                {message.content}
                </div>
                <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
                </div>
            </div>
            ))}
      </div>
    </div>
  );
};

export default ChatWindow;
