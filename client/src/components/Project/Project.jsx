import React, { useState, useEffect } from 'react';
import { Layout, Button, Modal, Form, Input, Select, Spin, message } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderApp from '../Header/Header';
import './project.css';
import api from '../../context/ApiContext';

const { Content } = Layout;
const { Option } = Select;

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate()
  const [project, setProject] = useState(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [flowModalVisible, setFlowModalVisible] = useState(false);
  const [flows, setFlows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProjectAndFlow = async () => {
      try {
        const response = await api.get(`/api/project/${projectId}`);
        setProject(response.data.project);
        setFlows(response.data.flows);
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching project:', error);
        setIsLoading(false)
      }
    };

    fetchProjectAndFlow();
  }, [projectId]);

  const showProjectModal = () => {
    setProjectModalVisible(true);
  };

  const handleProjectCancel = () => {
    setProjectModalVisible(false);
  };

  const handleUpdateProject = async (values) => {
    try {
      const response = await api.put(`/api/project/${projectId}`, {
        name: values.projectName,
        tokenMeta: values.tokenMeta,
        numeroTelefono: values.prefix + values.numeroTelefono,
        client: values.clientAssociation,
      });
      console.log(response.data)
      setProject(response.data);
      setProjectModalVisible(false);
      message.success('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      message.error('Failed to update project.');
    }
  };

  const showFlowModal = () => {
    setFlowModalVisible(true);
  };

  const handleFlowCancel = () => {
    setFlowModalVisible(false);
  };

  const handleCreateFlow = async (values) => {
    try {
      const response = await api.post(`/api/create-flow`, {
        name: values.flowName,
        responseTime: values.responseTime,
        prompt: values.prompt,
        projectId: projectId,
        flowType: values.flowType
      });
      
      const newFlow = response.data;
      setFlows([...flows, newFlow]);
      setFlowModalVisible(false);
      message.success('Flow created successfully!');
      navigate(`/project/${project._id}/flow/${newFlow._id}`)
    } catch (error) {
      console.error('Error creating flow:', error);
      message.error('Failed to create flow.');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="layout">
      <HeaderApp showProject={true} />
      <Content className='content'>
        <div className="project-settings">
          <Button type="text" icon={<SettingOutlined />} onClick={showProjectModal} />
        </div>
        <div className="site-layout-content">
          <Button type="primary" icon={<PlusOutlined />} onClick={showFlowModal}>
            Crea flusso
          </Button>
          <div className="projects-header">Flussi esistenti</div>
          <div className="projects-container">
            {flows.length > 0 && flows?.map((flow) => (
              <div onClick={() => {navigate(`/project/${project._id}/flow/${flow._id}`)}} key={flow._id} className="project-box">
                {flow.name}
              </div>
            ))}
          </div>
        </div>
      </Content>
      <Modal
        title="Edit Project"
        visible={projectModalVisible}
        onCancel={handleProjectCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUpdateProject} initialValues={{
          projectName: project?.name,
          tokenMeta: project?.tokenMeta,
          prefix: project?.numeroTelefono.slice(0, 3),
          numeroTelefono: project?.numeroTelefono.slice(3),
          clientAssociation: project?.client,
        }}>
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
            label="Numero di telefono"
            name="numeroTelefono"
          >
            <Input.Group compact>
              <Form.Item
                name="prefix"
                noStyle
                rules={[{ required: true, message: 'Please select a prefix!' }]}
              >
                <Select style={{ width: '30%' }} defaultValue="+39">
                  <Option value="+39">+39</Option>
                  <Option value="+1">+1</Option>
                  <Option value="+44">+44</Option>
                  <Option value="+49">+49</Option>
                  <Option value="+33">+33</Option>
                  {/* Aggiungi altri prefissi internazionali necessari */}
                </Select>
              </Form.Item>
              <Form.Item
                name="numeroTelefono"
                noStyle
                rules={[{ required: true, message: 'Please input your phone number!' }]}
              >
                <Input style={{ width: '70%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label="Client Association"
            name="clientAssociation"
            rules={[{ required: true, message: 'Please input the client association!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Create New Flow"
        visible={flowModalVisible}
        onCancel={handleFlowCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateFlow}>
          <Form.Item
            label="Flow Name"
            name="flowName"
            rules={[{ required: true, message: 'Please input the flow name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
              name="prefix"
              label='Tipologia flusso'
              rules={[{ required: true, message: 'Please select a type!' }]}
              >
                <Select defaultValue="">
                  <Option value="whatsapp">Whatsapp</Option>
                </Select>
          </Form.Item>
          <Form.Item
            label="Response Time (seconds)"
            name="responseTime"
            rules={[{ required: true, message: 'Please input the response time!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Prompt"
            name="prompt"
            rules={[{ required: true, message: 'Please input the prompt!' }]}
          >
            <Input.TextArea />
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

export default Project;