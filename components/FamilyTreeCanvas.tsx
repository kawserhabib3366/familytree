
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { FamilyData, Person, Relationship } from '../types';
import { PersonNode } from './PersonNode';

interface Props {
  data: FamilyData;
  selectedPersonId: string | null;
  onSelectPerson: (id: string | null) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDeletePerson: (id: string) => void;
}

export const FamilyTreeCanvas: React.FC<Props> = ({ 
  data, 
  selectedPersonId, 
  onSelectPerson,
  onUpdatePosition,
  onDeletePerson
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    svg.call(zoomBehavior);
    
    // Initial centering if it's the first render
    if (transform.k === 1 && transform.x === 0 && transform.y === 0) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2));
    }
  }, []);

  const renderRelationships = useMemo(() => {
    return data.relationships.map(rel => {
      const from = data.persons.find(p => p.id === rel.fromId);
      const to = data.persons.find(p => p.id === rel.toId);

      if (!from || !to) return null;

      if (rel.type === 'spouse') {
        return (
          <line
            key={rel.id}
            x1={from.position.x}
            y1={from.position.y}
            x2={to.position.x}
            y2={to.position.y}
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        );
      }

      const dx = to.position.x - from.position.x;
      const dy = to.position.y - from.position.y;
      const midY = from.position.y + dy / 2;
      
      const pathData = `M ${from.position.x} ${from.position.y} 
                        C ${from.position.x} ${midY}, 
                          ${to.position.x} ${midY}, 
                          ${to.position.x} ${to.position.y}`;

      return (
        <path
          key={rel.id}
          d={pathData}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
      );
    });
  }, [data]);

  return (
    <div className="relative w-full h-full bg-slate-50 canvas-bg overflow-hidden cursor-grab active:cursor-grabbing">
      <svg 
        ref={svgRef} 
        className="w-full h-full outline-none"
        onClick={() => onSelectPerson(null)}
      >
        <g transform={transform.toString()}>
          {renderRelationships}
          {data.persons.map(person => (
            <PersonNode 
              key={person.id}
              person={person}
              isSelected={selectedPersonId === person.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPerson(person.id);
              }}
              onDrag={(x, y) => onUpdatePosition(person.id, x, y)}
              onDelete={onDeletePerson}
              zoomScale={transform.k}
            />
          ))}
        </g>
      </svg>
      
      {/* Zoom Controls - Repositioned for mobile accessibility */}
      <div className="absolute top-6 left-6 md:left-auto md:right-6 flex flex-col gap-2 z-10">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-1">
          <button 
            onClick={() => d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, any>().scaleBy, 1.4)}
            className="w-10 h-10 md:w-12 md:h-12 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 font-black text-xl flex items-center justify-center active:bg-slate-200"
          >
            +
          </button>
          <button 
            onClick={() => d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, any>().scaleBy, 0.7)}
            className="w-10 h-10 md:w-12 md:h-12 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 font-black text-xl flex items-center justify-center active:bg-slate-200"
          >
            −
          </button>
          <hr className="my-1 border-slate-200 mx-1.5" />
          <button 
            onClick={() => {
              const svg = d3.select(svgRef.current);
              const width = svgRef.current?.clientWidth || 0;
              const height = svgRef.current?.clientHeight || 0;
              svg.transition().duration(750).call(
                d3.zoom<SVGSVGElement, any>().transform, 
                d3.zoomIdentity.translate(width / 2, height / 2)
              );
            }}
            className="w-10 h-10 md:w-12 md:h-12 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center active:bg-slate-200"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
