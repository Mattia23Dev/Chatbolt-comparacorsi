import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Drawer, Modal, Form, Input, Select, message } from 'antd';
import { MenuOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../../context/ApiContext';
import './home.css';
import { useNavigate } from 'react-router-dom';
import HeaderApp from '../Header/Header';
import axios from 'axios';

const { Content } = Layout;
const { Option } = Select;

const Home = () => {
  const navigate = useNavigate()
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('https://leadsystemclienti-production.up.railway.app/api/get-all-client');
        console.log(response.data)
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        message.error('Failed to fetch clients.');
      }
    };

    fetchClients();
  }, []);

  const handleGetProject = async (values) => {
    try {
      const response = await api.post('/api/get-projects', {});
      
      const newProject = response.data;
      setProjects(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  useEffect(() => {
    handleGetProject()
  }, [])

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleCreateProject = async (values) => {
    const selectedClient = clients.find(client => client._id === values.clientAssociation);
    try {
      const response = await api.post('/api/create-projects', {
        name: values.projectName,
        tokenMeta: values.tokenMeta,
        numeroTelefono: values.prefix + values.numeroTelefono,
        client: selectedSystem === 'AI' ? values.clientAssociation : selectedSystem === "ECP" ? 'ECP' : 'Bludental',
        clientName: selectedSystem === "AI" ? selectedClient.name : selectedSystem === "ECP" ? 'Comparacorsi' : 'Bludental',
        phoneNumberId: values.phoneNumberId,
        waAccountId: values.waAccountId,
      });
      
      const newProject = response.data;
      setProjects([...projects, newProject]);
      setModalVisible(false);
      message.success('Project created successfully!');
      navigate(`/project/${newProject._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      message.error('Failed to create project.');
    }
  };

  const handleSystemSelect = (system) => {
    setSelectedSystem(system);
  };

  return (
    <Layout className="layout">
      <HeaderApp />
      <Content className="content">
        <div className="site-layout-content">
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            Crea progetto
          </Button>
          <div className="projects-header">Progetti esistenti</div>
          <div className="projects-container">
            {projects.length > 0 && projects?.map((project) => (
              <div onClick={() => {navigate(`/project/${project._id}`)}} key={project._id} className="project-box">
                {project.name}
              </div>
            ))}
          </div>
        </div>
      </Content>
      <Modal
        title="Create New Project"
        visible={modalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateProject}>
          <Form.Item
            label="Project Name"
            name="projectName"
            rules={[{ required: true, message: 'Please input the project name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Token Meta"
            name="tokenMeta"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Numero di telegono"
            name="numeroTelefono"
          >
            <Input.Group compact>
              <Form.Item
                name="prefix"
                noStyle
                rules={[{ required: true, message: 'Please select a prefix!' }]}
              >
                <Select style={{ width: '17%' }} defaultValue="+39">
                  <Option value="+39">+39</Option>
                  <Option value="+1">+1</Option>
                  <Option value="+44">+44</Option>
                  <Option value="+49">+49</Option>
                  <Option value="+33">+33</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="numeroTelefono"
                noStyle
                rules={[{ required: true, message: 'Please input your phone number!' }]}
              >
                <Input style={{ width: '83%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label="Id cellulare"
            name="phoneNumberId"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Account whatsapp associato al cellulare"
            name="waAccountId"
          >
            <Input />
          </Form.Item>
          <Form.Item
          label="LeadSystem"
          required
        >
          <div className="lead-system-options">
            <div
              className={`lead-system-option ${selectedSystem === 'ECP' ? 'selected' : ''}`}
              onClick={() => handleSystemSelect('ECP')}
            >
              LeadSystem ECP
            </div>
            <div
              className={`lead-system-option ${selectedSystem === 'Bludental' ? 'selected' : ''}`}
              onClick={() => handleSystemSelect('Bludental')}
            >
              LeadSystem Bludental
            </div>
            <div
              className={`lead-system-option ${selectedSystem === 'AI' ? 'selected' : ''}`}
              onClick={() => handleSystemSelect('AI')}
            >
              LeadSystem AI
            </div>
          </div>
          {selectedSystem === 'AI' && (
            <Form.Item
              name="clientAssociation"
              rules={[{ required: true, message: 'Please select a client!' }]}
            >
              <Select placeholder="Select a client">
                {clients.map(client => (
                  <Option key={client._id} value={client._id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Home;
