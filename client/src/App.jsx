import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import Flow from './components/Flow/Flow';
import Project from './components/Project/Project';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<Project />} />
          <Route path="/project/:projectId/flow/:flowId" element={<Flow />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
