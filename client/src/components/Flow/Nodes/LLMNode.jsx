import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { AiOutlineApi } from 'react-icons/ai';
import { Card, CardHeader, CardBody } from '../styled';

export const LLMNode = ({ data }) => {
  return (
    <>
      <Card>
        <CardHeader bgColor={data.bgColor}>
          <AiOutlineApi />
          <span>Call LLM</span>
        </CardHeader>
        <CardBody>{data.label}</CardBody>
      </Card>
      <Handle type="target" position={Position.Left} isConnectable />
      <Handle type="source" position={Position.Right} isConnectable />
    </>
  );
};

LLMNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    bgColor: PropTypes.string,
  }).isRequired,
};
