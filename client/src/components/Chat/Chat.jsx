import { Button, Form, Input, Layout, Modal, Select, Space, Menu, Avatar, List } from 'antd';
import HeaderApp from '../Header/Header';
import React, { useState, useEffect } from 'react';
import { UserOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons';
//import 'antd/dist/antd.css';
import './chat.css';

import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ContactInfo from './ContactInfo';
import api from '../../context/ApiContext';
import { useParams } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState();
  const { projectId } = useParams();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get(`/api/chats/${projectId}`);
        setChats(response.data);
        setFilteredChats(response.data);
        console.log(response.data)
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchChats();
    }
  }, [projectId]);
  
  useEffect(() => {
    const filterChats = () => {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(chat => 
        chat.first_name?.toLowerCase().includes(query) ||
        chat.last_name?.toLowerCase().includes(query) ||
        chat.email?.toLowerCase().includes(query) ||
        chat.numeroTelefono?.toLowerCase().includes(query)
      );
      setFilteredChats(filtered);
    };

    filterChats();
  }, [searchQuery, chats]);

  if (loading) return <p>Loading...</p>;

  const updateContact = (updatedContact) => {
    const updatedChats = chats.map(chat => 
      chat._id === updatedContact._id ? updatedContact : chat
    );
    const updatedChats2 = filteredChats.map(chat => 
      chat._id === updatedContact._id ? updatedContact : chat
    );
    setChats(updatedChats);
    setFilteredChats(updatedChats2)
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <HeaderApp showProject={true} />
      {!loading && <Layout>
        <Sider width={300} className="site-layout-background">
          <div className="chat-list-header">
            <Select defaultValue="All Conversations" style={{ width: '100%' }}>
              <Select.Option value="all">All Conversations</Select.Option>
              <Select.Option value="unread">Unread</Select.Option>
              <Select.Option value="read">Read</Select.Option>
            </Select>
            <Button icon={<DownOutlined />} />
            <Button icon={<SearchOutlined />} onClick={() => setSearchQuery('')} />
          </div>
          <Input 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ margin: '10px 0' }}
            />
          <ChatList chats={filteredChats && filteredChats} setSelectedChat={setSelectedChat} />
        </Sider>
        <Layout>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <ChatWindow selectedChat={selectedChat && selectedChat} />
          </Content>
        </Layout>
        <Sider width={300} className="site-layout-background">
          <ContactInfo contact={selectedChat && selectedChat} updateContact={updateContact} />
        </Sider>
      </Layout>}
    </Layout>
  )
}

export default Chat

const LeadFieldModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [customFields, setCustomFields] = useState([]);

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', type: '' }]);
  };

  const handleCustomFieldChange = (index, field, value) => {
    const newCustomFields = [...customFields];
    newCustomFields[index][field] = value;
    setCustomFields(newCustomFields);
  };

  const onSubmit = () => {
    console.log('ok')
  }

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onSubmit({ ...values, customFields });
        form.resetFields();
        setCustomFields([]);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      visible={visible}
      title="Lead Information"
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Submit"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please input the first name!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please input the last name!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please input the email!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="numeroTelefono" label="Phone Number" rules={[{ required: true, message: 'Please input the phone number!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="summary" label="Summary">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="appointment" label="Appointment Date">
          <Input />
        </Form.Item>
        {customFields.map((field, index) => (
          <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="start">
            <Form.Item
              label="Field Name"
              required
              rules={[{ required: true, message: 'Please input the field name!' }]}
            >
              <Input
                value={field.name}
                onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
              />
            </Form.Item>
            <Form.Item
              label="Field Type"
              required
              rules={[{ required: true, message: 'Please select the field type!' }]}
            >
              <Select
                value={field.type}
                onChange={(value) => handleCustomFieldChange(index, 'type', value)}
              >
                <Option value="string">String</Option>
                <Option value="number">Number</Option>
                <Option value="boolean">Boolean</Option>
                <Option value="object">Object</Option>
                <Option value="array">Array</Option>
              </Select>
            </Form.Item>
          </Space>
        ))}
        <Button type="dashed" onClick={addCustomField} icon={<PlusOutlined />}>
          Add Custom Field
        </Button>
      </Form>
    </Modal>
  );
};