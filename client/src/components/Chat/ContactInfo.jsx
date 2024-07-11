import React from 'react';
import { Avatar, List, Button } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment'

const ContactInfo = ({ contact }) => {
    const formatCreatedAt = (timestamp) => {
        return moment(timestamp).format('DD-MM-YYYY HH:mm');
      };
  return (
    <div className="contact-info">
      <Avatar size={64} icon={<UserOutlined />} />
      <h3>{contact?.first_name && contact?.last_name ? contact?.first_name + ' ' + contact?.last_name :
            contact?.first_name && !contact?.last_name ? contact?.first_name : 'Utente'}</h3>
      <List>
        <List.Item>
          <List.Item.Meta title="Email" description={contact?.email} />
          <Button type="link" icon={<EditOutlined />}>Edit</Button>
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Phone" description={contact?.numeroTelefono} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Creato il" description={contact?.createdAt ? formatCreatedAt(contact.createdAt) : 'N/A'} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Conversation Summary" description={contact?.conversation_summary} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Date & Time Appointment" description={contact?.appointment_date} />
        </List.Item>
        {contact?.customFields && contact?.customFields.map((field) => (
            <List.Item>
                <List.Item.Meta title={field.name} description={field?.value} />
            </List.Item>            
        ))}
      </List>
    </div>
  );
};

export default ContactInfo;
