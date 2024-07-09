import { Button, Drawer, Layout, Menu, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { MenuOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../../context/ApiContext';
import { useNavigate } from 'react-router-dom';
const { Header } = Layout;
const { Option } = Select;

const HeaderApp = ({showProject}) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
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
        navigate(`/project/${value}`);
      };
  return (
  <Header className="header">
        <div>
            <Button type="text" icon={<MenuOutlined className='icon' />} onClick={showDrawer} />
            {showProject &&
            <Select
                style={{ width: 200 }}
                placeholder="Select a project"
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
        <Menu>
            <Menu.Item key="1">Home</Menu.Item>
            <Menu.Item key="2">Projects</Menu.Item>
        </Menu>
        </Drawer>
  </Header>
  )
}

export default HeaderApp