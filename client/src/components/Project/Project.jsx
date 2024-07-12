import React, { useState, useEffect } from 'react';
import { Layout, Button, Modal, Form, Input, Select, Spin, message, Typography, List, Space } from 'antd';
import { SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderApp from '../Header/Header';
import './project.css';
import axios from 'axios'
import api from '../../context/ApiContext';

const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const LeadFieldModal = ({ visible, onCancel, projectId, project }) => {
  const [customFields, setCustomFields] = useState(project.customFields || []);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');

  const predefinedFields = [
    { label: 'First Name', value: 'Text' },
    { label: 'Last Name', value: 'Text' },
    { label: 'Email', value: 'Text email' },
    { label: 'Phone Number', value: 'Text number' },
    { label: 'Summary', value: 'Text' },
    { label: 'Appointment Date', value: 'Date GG-MM-AAAA' }
  ];

  const addCustomField = () => {
    setCustomFields([...customFields, { name: fieldName, type: fieldType, description: fieldDescription }]);
    setFieldName('');
    setFieldType('');
    setFieldDescription('');
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/api/projects/${projectId}/custom-fields`, { customFields });
      message.success('Custom fields saved successfully');
      onCancel();
    } catch (error) {
      console.error('Error saving custom fields:', error);
      message.error('Failed to save custom fields');
    }
  };

  const removeCustomField = (index) => {
    const newCustomFields = customFields.filter((_, i) => i !== index);
    setCustomFields(newCustomFields);
  };

  return (
    <Modal
      visible={visible}
      title="Lead Information"
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Submit"
      width={"50%"}
    >
      <List
        header={<div>Predefined Fields</div>}
        bordered
        dataSource={predefinedFields}
        renderItem={item => (
          <List.Item>
            <Text strong>{item.label}:</Text> {item.value}
          </List.Item>
        )}
      />
      <div style={{ marginTop: 20 }}>
        <div>
          <Text strong>Add Custom Field</Text>
        </div>
        <Space style={{ marginBottom: 8, display: 'flex' }} align="start">
          <Input
            placeholder="Field Name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
          />
          <Select
            placeholder="Field Type"
            value={fieldType}
            onChange={(value) => setFieldType(value)}
            style={{ width: 120 }}
          >
            <Option value="string">String</Option>
            <Option value="number">Number</Option>
            <Option value="boolean">Boolean</Option>
            <Option value="object">Object</Option>
            <Option value="array">Array</Option>
          </Select>
          <Input.TextArea
            placeholder="Description"
            value={fieldDescription}
            onChange={(e) => setFieldDescription(e.target.value)}
            style={{ width: '100%' }}
          />
          <Button type="dashed" onClick={addCustomField} icon={<PlusOutlined />}>
            Add
          </Button>
        </Space>
        {customFields.length > 0 && (
          <List
            header={<div>Custom Fields</div>}
            bordered
            dataSource={customFields}
            renderItem={(item, index) => (
              <List.Item>
                <Space style={{ flex: 1 }}>
                  <Text strong>{item.name}:</Text> {item.type}
                  <Text>{item.description}</Text>
                </Space>
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={() => removeCustomField(index)}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate()
  const [project, setProject] = useState(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [leadVisible, setLeadVisible] = useState(false);
  const [flowModalVisible, setFlowModalVisible] = useState(false);
  const [flows, setFlows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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

  const showLeadModal = () => {
    setLeadVisible(true);
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
        clientName: values.clientName
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
        promptSaveInfo: values.promptSaveInfo,
        projectId: projectId,
        flowType: values.flowType,
        tag: values.tag
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
          <Button type="primary" icon={<SettingOutlined />} onClick={showProjectModal}>
            Modifica progetto
          </Button>
        </div>
        <div className="project-settings">
          <Button type="primary" icon={<SettingOutlined />} onClick={showLeadModal}>
            Modifica campi lead
          </Button>
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
          clientName: project?.clientName,
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
                <Select style={{ width: '17%' }} defaultValue="+39">
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
                <Input style={{ width: '83%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
          label="LeadSystem"
          required
          >
            <div className="lead-system-options">
              <div
                className={`lead-system-option ${project?.clientName === 'ECP' ? 'selected' : ''}`}
                onClick={() => setProject(prevProject => ({
                  ...prevProject,
                  clientName: "ECP"
                }))}
              >
                LeadSystem ECP
              </div>
              <div
                className={`lead-system-option ${project?.clientName === 'Bludental' ? 'selected' : ''}`}
                onClick={() => setProject(prevProject => ({
                  ...prevProject,
                  clientName: "Bludental"
                }))}
              >
                LeadSystem Bludental
              </div>
              <div
                className={`lead-system-option ${project?.clientName === 'AI' ? 'selected' : ''}`}
                onClick={() => setProject(prevProject => ({
                  ...prevProject,
                  clientName: "AI"
                }))}
              >
                LeadSystem AI
              </div>
            </div>
            {project?.clientName === 'AI' && (
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
            label="Tag"
            name="tag"
            rules={[{ required: true, message: 'Please input the response time!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Prompt"
            name="prompt"
            rules={[{ required: true, message: 'Please input the prompt!' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="Prompt save info"
            name="promptSaveInfo"
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
      <LeadFieldModal
        visible={leadVisible}
        onCancel={() => setLeadVisible(false)}
        projectId={project?._id}
        project={project}
      />
    </Layout>
  );
};

export default Project;