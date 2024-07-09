import React from 'react';
import { BsChatText } from 'react-icons/bs';
import { AiOutlineApi, AiOutlineSave } from 'react-icons/ai';
import { TextContainer } from './styled';

export const NodesPanel = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="nodes-panel">
      <button
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'messageNode')}
        draggable
      >
        <TextContainer>
          <BsChatText />
          <span>Message</span>
        </TextContainer>
      </button>
      <button
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'llmNode')}
        draggable
      >
        <TextContainer>
          <AiOutlineApi />
          <span>Call LLM</span>
        </TextContainer>
      </button>
      <button
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'saveInfoNode')}
        draggable
      >
        <TextContainer>
          <AiOutlineSave />
          <span>Save Info</span>
        </TextContainer>
      </button>
    </div>
  );
};
