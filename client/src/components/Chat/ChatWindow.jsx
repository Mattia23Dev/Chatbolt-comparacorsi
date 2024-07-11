import React, { useEffect, useRef } from 'react';
import { List, Avatar } from 'antd';
import { WhatsAppOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment'

const ChatWindow = ({ selectedChat }) => {
    const lastMessageRef = useRef(null);

    const formatTimestamp = (timestamp) => {
        const now = moment();
        const messageTime = moment(timestamp);
        if (now.isSame(messageTime, 'day')) {
          return messageTime.format('HH:mm');
        } else {
          return messageTime.format('DD-MM HH:mm');
        }
      };

      useEffect(() => {
        if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, [selectedChat]);
  return (
    <div>
      <div className="chat-header">
        <Avatar icon={<UserOutlined />} />
        <span>{selectedChat?.first_name && selectedChat?.last_name ? selectedChat?.first_name + ' ' + selectedChat?.last_name :
            selectedChat?.first_name && !selectedChat?.last_name ? selectedChat?.first_name : 'Utente'}</span>
      </div>
      <div className="chat-messages">
        {selectedChat?.messages.map((message, index) => (
            <div key={message._id} className={`message ${message.sender}`} ref={index === selectedChat.messages.length - 1 ? lastMessageRef : null}>
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
