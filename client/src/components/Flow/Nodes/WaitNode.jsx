import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { AiOutlineApi } from 'react-icons/ai';
import { Card, CardHeader, CardBody } from '../styled';

export const WaitNode = ({ data, flow }) => {
  return (
    <>
      <Card>
        <CardHeader bgColor={data.bgColor}>
          <AiOutlineApi />
          <span>Wait Seconds</span>
        </CardHeader>
        <CardBody>{flow?.responseTime || 15}</CardBody>
      </Card>
      <Handle type="target" position={Position.Left} isConnectable />
      <Handle type="source" position={Position.Right} isConnectable />
    </>
  );
};

WaitNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    bgColor: PropTypes.string,
    flow: PropTypes.shape({
      responseTime: PropTypes.number,
    }),
  }).isRequired,
};
