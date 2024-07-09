import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { AiOutlineSave } from 'react-icons/ai';
import { Card, CardHeader, CardBody } from '../styled';

export const SaveInfoNode = ({ data }) => {
  return (
    <>
      <Card>
        <CardHeader bgColor={data.bgColor}>
          <AiOutlineSave />
          <span>Save Info</span>
        </CardHeader>
        <CardBody>{data.label}</CardBody>
      </Card>
      <Handle type="target" position={Position.Left} isConnectable />
      <Handle type="source" position={Position.Right} isConnectable />
    </>
  );
};

SaveInfoNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    bgColor: PropTypes.string,
  }).isRequired,
};
