import React, { useState } from 'react';

export const JsonViewer = ({ data, name, initiallyExpanded = true }: { data: any, name?: string, initiallyExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  if (data === null) return <span className="text-slate-500">null</span>;
  if (data === undefined) return <span className="text-slate-500">undefined</span>;
  if (typeof data === 'string') return <span className="text-emerald-400">"{data}"</span>;
  if (typeof data === 'number') return <span className="text-blue-400">{data}</span>;
  if (typeof data === 'boolean') return <span className="text-purple-400">{data ? 'true' : 'false'}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-500">[]</span>;
    return (
      <div className="font-mono text-sm leading-relaxed">
        <span className="cursor-pointer select-none text-slate-400 hover:text-white transition-colors" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▼' : '▶'} {name ? <span className="text-blue-300">"{name}": </span> : null}<span className="text-slate-400">Array({data.length}) [</span>
        </span>
        {expanded && (
          <div className="pl-4 border-l border-slate-700/50 ml-1.5 mt-1 mb-1">
            {data.map((item, i) => (
              <div key={i} className="flex items-start">
                <span className="text-slate-500 mr-2 select-none">{i}:</span>
                <div className="flex-1 overflow-hidden">
                  <JsonViewer data={item} initiallyExpanded={false} />
                </div>
              </div>
            ))}
          </div>
        )}
        {expanded && <div className="text-slate-400">]</div>}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-slate-500">{"{}"}</span>;
    return (
      <div className="font-mono text-sm leading-relaxed">
        <span className="cursor-pointer select-none text-slate-400 hover:text-white transition-colors" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▼' : '▶'} {name ? <span className="text-blue-300">"{name}": </span> : null}<span className="text-slate-400">{"{"}</span>
        </span>
        {expanded && (
          <div className="pl-4 border-l border-slate-700/50 ml-1.5 mt-1 mb-1">
            {keys.map((key) => (
              <div key={key} className="flex items-start">
                <div className="flex-1 overflow-hidden">
                  <JsonViewer data={data[key]} name={key} initiallyExpanded={false} />
                </div>
              </div>
            ))}
          </div>
        )}
        {expanded && <div className="text-slate-400">{"}"}</div>}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};
