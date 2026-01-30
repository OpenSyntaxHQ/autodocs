import React from 'react';

interface Member {
  name: string;
  type: string;
  documentation?: string;
}

interface TypeData {
  name: string;
  kind: string;
  documentation?: string;
  members?: Member[];
}

export function TypeView({ data }: { data: TypeData }) {
  return (
    <div className="type-view">
      <p className="description">{data.documentation}</p>
      <div className="code-block">
        <span className="keyword">interface</span> <span className="type-name">{data.name}</span> {'{'}
        {data.members?.map(member => (
          <div key={member.name} className="member-row">
            <span className="member-name">{member.name}</span>: <span className="member-type">{member.type}</span>;
            {member.documentation && <span className="comment"> // {member.documentation}</span>}
          </div>
        ))}
        {'}'}
      </div>
    </div>
  );
}
