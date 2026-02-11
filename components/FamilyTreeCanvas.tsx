
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
  onAddParent: (id: string) => void;
  onAddSibling: (id: string) => void;
  onAddChild: (id: string) => void;
}

export interface CanvasHandle {
  zoomToPerson: (id: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  personId: string;
}

export const FamilyTreeCanvas = forwardRef<CanvasHandle, Props>(({ 
  data, 
  selectedPersonId, 
  onSelectPerson,
  onUpdatePosition,
  onDeletePerson,
  onAddParent,
  onAddSibling,
  onAddChild
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
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

    // Close context menu on any global click or zoom start
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
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

  const handleNodeContextMenu = (e: React.MouseEvent, personId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      personId
    });
    onSelectPerson(personId);
  };

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
        onClick={() => {
          onSelectPerson(null);
          setContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(null);
        }}
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
                setContextMenu(null);
              }}
              onContextMenu={(e) => handleNodeContextMenu(e, person.id)}
              onDrag={(x, y) => onUpdatePosition(person.id, x, y)}
              onDelete={onDeletePerson}
              zoomScale={transform.k}
            />
          ))}
        </g>
      </svg>
      
      {/* Context Menu UI */}
      {contextMenu && (
        <div 
          className="fixed bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl py-2 w-52 z-[60] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { onAddParent(contextMenu.personId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-xs"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            </div>
            Add Parent
          </button>
          <button 
            onClick={() => { onAddSibling(contextMenu.personId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-xs"
          >
             <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </div>
            Add Sibling
          </button>
          <button 
            onClick={() => { onAddChild(contextMenu.personId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-xs"
          >
             <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </div>
            Add Child
          </button>
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <button 
            onClick={() => { onDeletePerson(contextMenu.personId); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors text-rose-600 font-bold text-xs"
          >
             <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            Remove Person
          </button>
        </div>
      )}

      {/* Floating Canvas Controls - Moved to left on mobile to avoid toggle button conflict */}
      <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 sm:left-auto sm:right-6 flex flex-col gap-2 sm:gap-3 z-10 scale-90 sm:scale-100 origin-bottom-left sm:origin-bottom-right">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col gap-1.5 sm:gap-2">
          <button 
            onClick={() => d3.select(svgRef.current!).transition().duration(200).call(zoomBehaviorRef.current!.scaleBy, 1.5)}
            className="w-10 h-10 sm:w-12 sm:h-12 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-slate-800 font-black text-xl sm:text-2xl flex items-center justify-center active:scale-90"
          >
            +
          </button>
          <button 
            onClick={() => d3.select(svgRef.current!).transition().duration(200).call(zoomBehaviorRef.current!.scaleBy, 0.6)}
            className="w-10 h-10 sm:w-12 sm:h-12 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-slate-800 font-black text-xl sm:text-2xl flex items-center justify-center active:scale-90"
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
            className="w-10 h-10 sm:w-12 sm:h-12 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center active:scale-90"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
