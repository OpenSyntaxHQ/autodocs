import React from 'react';

export function Sidebar({ items, onSelect, selected }: { items: string[], onSelect: (id: string) => void, selected: string }) {
  return (
      <aside className="sidebar">
          <h3>Types</h3>
          <ul>
              {items.map(item => (
                  <li key={item} 
                      className={item === selected ? 'active' : ''}
                      onClick={() => onSelect(item)}>
                      {item}
                  </li>
              ))}
          </ul>
      </aside>
  );
}
