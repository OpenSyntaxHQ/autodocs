import React, { useState } from 'react';
import { TypeView } from './components/TypeView';
import { Sidebar } from './components/Sidebar';

// Mock data
const mockData = {
  types: [
    {
      name: 'User',
      kind: 'interface',
      documentation: 'Represents a user in the system',
      members: [
        { name: 'id', type: 'string', documentation: 'Unique identifier' },
        { name: 'name', type: 'string', documentation: 'Display name' },
        { name: 'role', type: '"admin" | "member"', documentation: 'User role' }
      ]
    },
    {
      name: 'Post',
      kind: 'interface',
      documentation: 'A blog post',
      members: [
        { name: 'id', type: 'string', documentation: 'Post ID' },
        { name: 'title', type: 'string', documentation: 'Post title' }
      ]
    }
  ]
};

function App() {
  const [selectedType, setSelectedType] = useState('User');
  const typeData = mockData.types.find(t => t.name === selectedType);

  return (
    <div className="app-container">
      <Sidebar 
          items={mockData.types.map(t => t.name)} 
          onSelect={setSelectedType} 
          selected={selectedType} 
      />
      <main className="content">
        <h1>{selectedType}</h1>
        {typeData && <TypeView data={typeData} />}
      </main>
    </div>
  );
}

export default App;
