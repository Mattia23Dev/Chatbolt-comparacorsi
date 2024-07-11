import { Button, Drawer, Layout, Menu, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { MenuOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../../context/ApiContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
const { Header } = Layout;
const { Option } = Select;

const HeaderApp = ({showProject}) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const navigate = useNavigate()
    const location = useLocation();
    const { projectId } = useParams();
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(projectId)
    const showDrawer = () => {
        setDrawerVisible(true);
      };
      const handleGetProject = async (values) => {
        try {
          const response = await api.post('/api/get-projects', {});
          
          const newProject = response.data;
          setProjects(newProject);
        } catch (error) {
          console.error('Error creating project:', error);
        }
      };

      useEffect(() => {
        handleGetProject()
      }, [showProject])
      const closeDrawer = () => {
        setDrawerVisible(false);
      };

      const handleProjectChange = (value) => {
        setSelectedProject(value);
        const currentPath = window.location.pathname;
    
        if (currentPath.includes('/project/')) {
            navigate(`/project/${value}`);
        } else if (currentPath.includes('/chats/')) {
            navigate(`/chats/${value}`);
        } else if (currentPath.includes('/contacts/')) {
            navigate(`/contacts/${value}`);
        } else {
            navigate(`/project/${value}`);
        }
    };
      const isProjectRoute = location.pathname.includes('/project/') || location.pathname.includes('/chats/');
      const handleMenuClick = (key) => {
        if (key === 'home') {
          navigate('/');
        } else if (key === 'flows' && projectId) {
          navigate(`/project/${projectId}`);
        } else if (key === 'contacts' && projectId) {
          navigate(`/contacts/${projectId}`);
        } else if (key === 'chat' && projectId) {
          navigate(`/chats/${projectId}`);
        }
        closeDrawer();
      };

  return (
  <Header className="header">
        <div>
            <Button type="text" icon={<MenuOutlined className='icon' />} onClick={showDrawer} />
            {showProject &&
            <Select
                style={{ width: 200 }}
                placeholder="Select a project"
                value={selectedProject}
                onChange={handleProjectChange}
              >
                {projects.length > 0 && projects.map((project) => (
                  <Option key={project._id} value={project._id}>
                    {project.name}
                  </Option>
                ))}
            </Select>}
        </div>
        <h2>ChatBolt</h2>
        <Drawer
        title="Menu"
        placement="left"
        onClose={closeDrawer}
        visible={drawerVisible}
        >
        <Menu onClick={({ key }) => handleMenuClick(key)}>
          <Menu.Item key="home">Home</Menu.Item>
          <Menu.Item key="flows">Flussi</Menu.Item>
          {isProjectRoute && <Menu.Item key="contacts">Contatti</Menu.Item>}
          {isProjectRoute && <Menu.Item key="chat">Chat</Menu.Item>}
        </Menu>
        </Drawer>
  </Header>
  )
}

export default HeaderApp