import PropTypes from 'prop-types';
import { BsArrowLeft } from 'react-icons/bs';
import { SettingsPanelHeader } from './styled';
import { Form, Input, Button } from 'antd';

export const SettingsPanel = ({ onChange, onBack, selectedNode }) => {
  const renderSettings = () => {
    if (selectedNode.label.includes('messageNode')) {
      return (
        <>
          <Form.Item label="Message">
            <Input
              defaultValue={selectedNode.label}
              onChange={(e) => onChange(e.target.value)}
            />
          </Form.Item>
        </>
      );
    }
    if (selectedNode.label.includes('llmNode')) {
      return (
        <>
          <Form.Item label="LLM Prompt">
            <Input
              defaultValue={selectedNode.label}
              onChange={(e) => onChange(e.target.value)}
            />
          </Form.Item>
        </>
      );
    }
    if (selectedNode.label.includes('saveInfoNode')) {
      return (
        <>
          <Form.Item label="Save Info">
            <Input
              defaultValue={selectedNode.label}
              onChange={(e) => onChange(e.target.value)}
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
