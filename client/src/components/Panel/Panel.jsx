import PropTypes from 'prop-types'
import { PanelContainer } from './styled'
import { NodesPanel } from './NodesPanel'
import { SettingsPanel } from './SettingsPanel'

export const Panel = ({ onChange, onBack, selectedNode, flow, project }) => {
  return (
    <PanelContainer>
      {selectedNode ? (
        <SettingsPanel
          flow={flow}
          onChange={onChange}
          onBack={onBack}
          selectedNode={selectedNode}
          project={project}
        />
      ) : (
        <NodesPanel />
      )}
    </PanelContainer>
  )
}

Panel.propTypes = {
  onChange: PropTypes.func,
  onBack: PropTypes.func,
  selectedNode: PropTypes.shape({
    label: PropTypes.string,
    id: PropTypes.string,
  }),
}
