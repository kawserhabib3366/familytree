
import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
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

export interface CanvasHandle {
  zoomToPerson: (id: string) => void;
}

export const FamilyTreeCanvas = forwardRef<CanvasHandle, Props>(({ 
  data, 
  selectedPersonId, 
  onSelectPerson,
  onUpdatePosition,
  onDeletePerson
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    
    // Initial center
    if (transform.k === 1 && transform.x === 0 && transform.y === 0) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2));
    }
  }, []);

  useImperativeHandle(ref, () => ({
    zoomToPerson: (id: string) => {
      const person = data.persons.find(p => p.id === id);
      if (!person || !svgRef.current || !zoomBehaviorRef.current) return;

      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      d3.select(svgRef.current)
        .transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1.2)
            .translate(-person.position.x, -person.position.y)
        );
    }
  }));

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
        className="w-full h-full outline-none touch-none"
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
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10 scale-110 md:scale-100 origin-bottom-right">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border border-slate-200 flex flex-col gap-2">
          <button 
            onClick={() => d3.select(svgRef.current!).transition().duration(200).call(zoomBehaviorRef.current!.scaleBy, 1.5)}
            className="w-12 h-12 hover:bg-slate-100 rounded-2xl transition-all text-slate-800 font-black text-2xl flex items-center justify-center active:scale-90"
          >
            +
          </button>
          <button 
            onClick={() => d3.select(svgRef.current!).transition().duration(200).call(zoomBehaviorRef.current!.scaleBy, 0.6)}
            className="w-12 h-12 hover:bg-slate-100 rounded-2xl transition-all text-slate-800 font-black text-2xl flex items-center justify-center active:scale-90"
          >
            −
          </button>
          <div className="h-px bg-slate-100 mx-2" />
          <button 
            onClick={() => {
              const width = svgRef.current?.clientWidth || 0;
              const height = svgRef.current?.clientHeight || 0;
              d3.select(svgRef.current!).transition().duration(750).call(
                zoomBehaviorRef.current!.transform, 
                d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
              );
            }}
            className="w-12 h-12 hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center active:scale-90"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
