import PropTypes from 'prop-types';
import { BsArrowLeft } from 'react-icons/bs';
import { SettingsPanelHeader } from './styled';
import { Form, Input, Button, Select, InputNumber, List, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../context/ApiContext';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export const SettingsPanel = ({ onChange, onBack, selectedNode, flow, project }) => {
  const [selNode, setSelNode] = useState(selectedNode && selectedNode)
  const initialSaveOptions = [
    ...(Array.isArray(selectedNode?.data?.infoType) ? selectedNode.data.infoType : []),
    ...(Array.isArray(project?.customFields) ? project.customFields : []),
  ];
  const [templates, setTemplates] = useState([])
  const [saveOptions, setSaveOptions] = useState(initialSaveOptions)
  const [messageNode, setMessageNode] = useState({
    messageType: selectedNode?.data?.customType,
    metaTemplate: "",
    template: {},
  })
  console.log(project)
  const [saveInfoNode, setSaveInfoNode] = useState({
    messageType: selectedNode?.data?.customType,
    infoType: selectedNode?.data?.infoType,
  })
  const [LLMNode, setLLMNode] = useState({
    service: selectedNode?.data?.service,
    callType: selectedNode?.customType,
    LLMPrompt: selectedNode?.customType !== "save" ? selectedNode?.data?.prompt : '',
    LLMSavePrompt: selectedNode?.customType === "save" ? selectedNode?.data?.prompt : "",
  })
  const [waitNode, setWaitNode] = useState({
    responseTime: selectedNode?.data?.waitingTime || 15,
  })

  const handleFieldSelect = (value) => {
    const selectedField = saveOptions.find(field => field.name === value);
    if (selectedField && !saveInfoNode.infoType.some(field => field.name === value)) {
      setSaveInfoNode(prevState => ({
        ...prevState,
        infoType: [...prevState.infoType, selectedField],
      }));
    }
  };

  const handleRemoveField = (name) => {
    setSaveInfoNode(prevState => ({
      ...prevState,
      infoType: prevState.infoType.filter(field => field.name !== name),
    }));
  };
  const handleChange = (field, value) => {
    if (field === "metaTemplate"){
      const selectedTemplate = Array.isArray(templates) && templates?.find(template => template.name === value);
      setMessageNode(prevState => ({
        ...prevState,
        metaTemplate: value,
        template: selectedTemplate || {},
      }));
    } else {
      setMessageNode((prev) => ({ ...prev, [field]: value }));
    }
  };
  const handleChangeLLM = (field, value) => {
    const val = value?.target?.value
    if (field === "LLMSavePrompt" || field === "LLMPrompt"){
      setLLMNode((prev) => ({ ...prev, [field]: val }));
    } else {
      setLLMNode((prev) => ({ ...prev, [field]: value }));
    }
  };
  const handleChangeWait = (field, value) => {
    setWaitNode((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetTemplates = async () => {
    try {
      const response = await api.post(`/api/flows/${flow?._id}/get-template`, { numeroTelefono: project?.numeroTelefono });
      console.log(response.data.data)
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error getting templates:', error);
    }
  };

  useEffect(() => {
    handleGetTemplates()
  }, [project])


  const handleSave = async () => {
    const payload = {
      nodeId: selectedNode.id,
      type: selectedNode.type,
      data: {},
    };

    switch (selectedNode.type) {
      case 'messageNode':
        payload.data = {
          messageType: messageNode.messageType,
          metaTemplate: messageNode.metaTemplate,
          template: messageNode.template,
        };
        break;
      case 'llmNode':
        payload.data = {
          service: LLMNode.service,
          callType: LLMNode.callType,
          prompt: LLMNode.callType === 'save' ? LLMNode.LLMSavePrompt : LLMNode.LLMPrompt,
        };
        break;
      case 'saveInfoNode':
        payload.data = {
          infoType: saveInfoNode.infoType,
        };
        break;
      case 'waitNode':
        payload.data = {
          waitingTime: waitNode.responseTime,
        };
        break;
      default:
        console.log(`Node type ${selectedNode.type} not recognized.`);
        return;
    }

    try {
      const response = await api.post(`/api/nodes/${flow._id}/update`, payload);
      message.success('Node updated successfully');
      onBack();
      //onChange(selectedNode.id, payload.data)
    } catch (error) {
      console.error('Error updating node:', error);
      message.error('Error updating node');
    }
  };
  console.log(selectedNode)
  const renderSettings = () => {
    if (selectedNode?.label.includes('messageNode')) {
      return (
        <>
          <Form.Item label="Tipologia messaggio">
            <Select 
              onChange={(value) => handleChange('messageType', value)}
              value={messageNode?.messageType}
              defaultValue={messageNode?.messageType}>
              <Option value="LMMResponse">Risposta LLM</Option>
              <Option value="metaTemplate">Template Meta</Option>
            </Select>
          </Form.Item>
          {messageNode?.messageType === "metaTemplate" && (
          <Form.Item label="Scegli il template">
            <Select 
              onChange={(value) => handleChange('metaTemplate', value)} 
              value={messageNode?.metaTemplate?.name}
              defaultValue="">
                {Array.isArray(templates) && templates.length > 0 && templates?.map((template) => (
                  <Option value={template.name}>{template.name}</Option>
                ))}
            </Select>
          </Form.Item> 
          )}
        </>
      );
    }
    if (selectedNode?.label.includes('llmNode')) {
      return (
        <>
          <Form.Item label="Service">
            <Select 
            onChange={(value) => handleChangeLLM('service', value)}
            value={LLMNode?.service}
            defaultValue={LLMNode?.service}>
              <Option value="Openai">OpenAI</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Tipologia chiamata">
            <Select
            onChange={(value) => handleChangeLLM('callType', value)}
            value={LLMNode?.callType}
            defaultValue={LLMNode?.callType}>
              <Option value="save">Salva info</Option>
              <Option value="response">Rispondi al messaggio</Option>
            </Select>
          </Form.Item>
          {LLMNode.callType === "response" ?
          <Form.Item label="LLM Prompt">
            <TextArea
            onChange={(e) => handleChangeLLM('LLMPrompt', e)}
            value={LLMNode?.LLMPrompt}
            placeholder='Inserisci prompt'
            rows={4}
            />
          </Form.Item> : 
          <Form.Item label="LLM Prompt">
            <TextArea
            onChange={(e) => handleChangeLLM('LLMSavePrompt', e)}
            value={LLMNode?.LLMSavePrompt}
            placeholder='inserisci prompt'
            rows={4}
            />
          </Form.Item>}
        </>
      );
    }
    if (selectedNode?.label.includes('saveInfoNode')) {
      return (
        <>
          <Form.Item label="Select a Field">
              <Select
                placeholder="Select a field to add"
                onChange={handleFieldSelect}
              >
                {saveOptions?.map(field => (
                  <Option key={field.name} value={field.name}>
                    {field.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {saveInfoNode?.infoType?.length > 0 && (
              <List
                header={<div></div>}
                bordered
                dataSource={saveInfoNode?.infoType}
                renderItem={item => (
                  <List.Item>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.name}:</Text> {item.type}
                    </div>
                    {item.name !== "first_name" && item.name !== "last_name" && item.name !== "email"
                    && item.name !== "numeroTelefono" && item.name !== "conversation_summary" &&
                    item.name !== "appointment_date" &&
                    <a
                      onClick={() => handleRemoveField(item.name)}
                      style={{ marginLeft: 'auto', color: 'red' }}
                    >
                      Remove
                    </a>}
                  </List.Item>
                )}
              />
            )}
        </>
      );
    }
    if (selectedNode?.label.includes('waitNode')) {
      return (
        <>
          <Form.Item label="Wait seconds">
            <InputNumber
              style={{ width: '100%' }}
              defaultValue={waitNode.responseTime}
              value={waitNode.responseTime}
              onChange={(value) => handleChangeWait('responseTime', value)}
            />
          </Form.Item>
        </>
      );
    }
    return null;
  };

  return (
    <div>
      <SettingsPanelHeader>
        <Button type="text" onClick={onBack} icon={<BsArrowLeft />} />
        <span>{selectedNode?.label?.includes('messageNode') ? 'Message' : selectedNode?.label?.includes('llmNode') ? 'Call LLM' : 'Save Info'}</span>
      </SettingsPanelHeader>
      <Form layout="vertical">
        {renderSettings()}
      </Form>
      <Button onClick={handleSave} type='primary'>Salva</Button>
    </div>
  );
};

SettingsPanel.propTypes = {
  onChange: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  selectedNode: PropTypes.shape({
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }).isRequired,
};
