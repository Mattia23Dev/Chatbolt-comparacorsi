import { useState, useRef, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'

import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow'

import { Panel } from '../Panel'
import { MessageNode } from './Nodes/MessageNode'

import {
  AppContainer,
  Header,
  MainContainer,
  FlowContainer,
  Alert,
} from './styled'

import { saveAsJSON } from '../../utils'
import { SAVE, DOWNLOAD, FLOW_KEY, DEFAULT_VIEWPORT } from './constants'
import { getInitialValues } from './helper'
import { useParams } from 'react-router-dom'
import api from '../../context/ApiContext'
import { LLMNode } from './Nodes/LLMNode'
import { SaveInfoNode } from './Nodes/SaveInfoNode'
import { WaitNode } from './Nodes/WaitNode'

const nodeTypes = {
  messageNode: MessageNode,
  llmNode: LLMNode,
  saveInfoNode: SaveInfoNode,
  waitNode: WaitNode,
};


const Flow = () => {
  const { flowId, projectId } = useParams();
  const reactFlowWrapper = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flow, setFlow] = useState()
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [hasFlowError, setHasFlowError] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState()
  console.log(selectedNode)
  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const response = await api.get(`/api/flow/${flowId}`);
        const flowData = response.data;
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        setFlow(flowData)
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching flow:', error);
        setHasFlowError(true);
        setIsLoading(false);
      }
    };

    fetchFlow();
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    const fetchProjectAndFlow = async () => {
      try {
        const response = await api.get(`/api/project/${projectId}`);
        setProject(response.data.project);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchProjectAndFlow()
  }, [projectId])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (!type) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = {
        id: nanoid(),
        type,
        position,
        data: { label: `${type} node` },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const handleNodeLabelChange = (label) => {
    const newNode = { ...selectedNode }
    newNode.data.label = label
    setSelectedNode(newNode)
    const newNodes = [...nodes]
    const nodeIndex = newNodes.findIndex((node) => node.id === selectedNode.id)
    newNodes[nodeIndex] = newNode
  }

  const handleNodeClick = (event, node) => {
    event.preventDefault()
    setSelectedNode(node)
  }

  const handleCloseSettings = () => {
    setSelectedNode(null)
  }
  console.log({nodes, edges})
  const handleSaveOrDownload = async (type) => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();

      const isInValid =
        flow.nodes.length === 1 || flow.edges.length !== flow.nodes.length - 1;
      setHasFlowError(isInValid);
      setTimeout(() => setHasFlowError(false), 3000);
      if (isInValid) return;
      if (type === 'DOWNLOAD') {
        const flowName = prompt(
          'Please enter the name of the flow',
          'Flow name'
        );
        saveAsJSON(flow, flowName || 'Flow');
      } else if (type === 'SAVE') {
        try {
          await api.put(`/api/flows/${flowId}`, {
            nodes: flow.nodes,
            edges: flow.edges,
          });
          message.success('Flow saved successfully!');
        } catch (error) {
          console.error('Error saving flow:', error);
          message.error('Failed to save flow.');
        }
      }
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <AppContainer>
      <Header>
        {hasFlowError && <Alert>Flow is invalid</Alert>}
        <div className="ml-auto btn-group">
          <button
            disabled={nodes.length === 0}
            type="button"
            className="button"
            title={
              nodes.length === 0 ? 'Add nodes to download' : 'Download JSON'
            }
            onClick={() => handleSaveOrDownload(DOWNLOAD)}
          >
            Download JSON
          </button>
          <button
            disabled={nodes.length === 0}
            title={
              nodes.length === 0
                ? 'Add nodes to save'
                : 'Save changes to device'
            }
            type="button"
            className="button"
            onClick={() => handleSaveOrDownload(SAVE)}
          >
            Salva
          </button>
        </div>
      </Header>
      <MainContainer>
        <ReactFlowProvider>
          <FlowContainer ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes.map(node => ({
                ...node,
                data: { ...node.data, flow: flow && flow }
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              defaultViewport={DEFAULT_VIEWPORT}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} />
              <Controls />
            </ReactFlow>
          </FlowContainer>
          <Panel
            onChange={handleNodeLabelChange}
            project={project && project}
            onBack={handleCloseSettings}
            flow={flow && flow}
            selectedNode={
              selectedNode
                ? { label: selectedNode.data.label, id: selectedNode.id, customType: selectedNode?.data.customType, data: selectedNode?.data, type: selectedNode?.type }
                : null
            }
          />
        </ReactFlowProvider>
      </MainContainer>
    </AppContainer>
  )
}

export default Flow
