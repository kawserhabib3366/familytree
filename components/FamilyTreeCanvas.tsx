
import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { FamilyData, Person, Relationship } from '../types';
import { PersonNode } from './PersonNode';

interface Props {
  data: FamilyData;
  selectedIds: string[];
  onSelectPersons: (ids: string[]) => void;
  onUpdatePosition: (id: string, dx: number, dy: number) => void;
  onDeletePerson: (id: string) => void;
  onAddParent: (id: string) => void;
  onAddSibling: (id: string) => void;
  onAddChild: (id: string) => void;
}

export interface CanvasHandle {
  jumpToPerson: (id: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  personId: string;
}

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
}

export const FamilyTreeCanvas = forwardRef<CanvasHandle, Props>(({ 
  data, 
  selectedIds, 
  onSelectPersons,
  onUpdatePosition,
  onDeletePerson,
  onAddParent,
  onAddSibling,
  onAddChild
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .filter((event) => !event.ctrlKey && event.button !== 2)
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    
    if (transform.k === 1 && transform.x === 0 && transform.y === 0) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2));
    }

    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useImperativeHandle(ref, () => ({
    jumpToPerson: (id: string) => {
      const person = data.persons.find(p => p.id === id);
      if (!person || !svgRef.current || !zoomBehaviorRef.current) return;

      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      d3.select(svgRef.current)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1.2)
            .translate(-person.position.x, -person.position.y)
        );
    }
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      setSelectionBox({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        active: true
      });
    } else {
      if (e.target === svgRef.current) {
        onSelectPersons([]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox?.active) {
      setSelectionBox(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (selectionBox?.active) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const isDrag = Math.abs(selectionBox.startX - selectionBox.currentX) > 5 || 
                     Math.abs(selectionBox.startY - selectionBox.currentY) > 5;

      if (isDrag) {
        const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
        const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
        const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
        const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

        const newlySelected: string[] = [];
        data.persons.forEach(person => {
          const screenX = transform.applyX(person.position.x) + rect.left;
          const screenY = transform.applyY(person.position.y) + rect.top;
          if (screenX >= x1 && screenX <= x2 && screenY >= y1 && screenY <= y2) {
            newlySelected.push(person.id);
          }
        });
        onSelectPersons(newlySelected);
      }
      setSelectionBox(null);
    }
  };

  const handleNodeContextMenu = (e: React.MouseEvent, personId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectionBox?.active) return;
    setContextMenu({ x: e.clientX, y: e.clientY, personId });
    if (!selectedIds.includes(personId)) onSelectPersons([personId]);
  };

  const renderRelationships = useMemo(() => {
    return data.relationships.map(rel => {
      const from = data.persons.find(p => p.id === rel.fromId);
      const to = data.persons.find(p => p.id === rel.toId);
      if (!from || !to) return null;

      if (rel.type === 'spouse') {
        return (
          <line key={rel.id} x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y}
            stroke="#94a3b8" strokeWidth="3" strokeDasharray="5,5" />
        );
      }

      if (rel.type === 'other') {
        return (
          <g key={rel.id}>
            <line x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y}
              stroke="#818cf8" strokeWidth="2" strokeDasharray="2,4" />
            {rel.label && (
              <text 
                x={(from.position.x + to.position.x) / 2} 
                y={(from.position.y + to.position.y) / 2} 
                dy="-5"
                textAnchor="middle"
                className="text-[10px] font-black fill-indigo-600 bg-white"
              >
                {rel.label}
              </text>
            )}
          </g>
        );
      }

      const midY = from.position.y + (to.position.y - from.position.y) / 2;
      return (
        <path key={rel.id} d={`M ${from.position.x} ${from.position.y} C ${from.position.x} ${midY}, ${to.position.x} ${midY}, ${to.position.x} ${to.position.y}`}
          fill="none" stroke="#cbd5e1" strokeWidth="2" />
      );
    });
  }, [data]);

  const selectionRect = selectionBox?.active ? (
    <rect
      x={Math.min(selectionBox.startX, selectionBox.currentX) - (svgRef.current?.getBoundingClientRect().left || 0)}
      y={Math.min(selectionBox.startY, selectionBox.currentY) - (svgRef.current?.getBoundingClientRect().top || 0)}
      width={Math.abs(selectionBox.currentX - selectionBox.startX)}
      height={Math.abs(selectionBox.currentY - selectionBox.startY)}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      pointerEvents="none"
    />
  ) : null;

  return (
    <div className="relative w-full h-full bg-slate-50 canvas-bg overflow-hidden cursor-grab active:cursor-grabbing">
      <svg 
        ref={svgRef} 
        className="w-full h-full outline-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          if (selectionBox) e.preventDefault();
        }}
      >
        <g transform={transform.toString()}>
          {renderRelationships}
          {data.persons.map(person => (
            <PersonNode 
              key={person.id}
              person={person}
              isSelected={selectedIds.includes(person.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  const already = selectedIds.includes(person.id);
                  onSelectPersons(already ? selectedIds.filter(id => id !== person.id) : [...selectedIds, person.id]);
                } else {
                  onSelectPersons([person.id]);
                }
                setContextMenu(null);
              }}
              onContextMenu={(e) => handleNodeContextMenu(e, person.id)}
              onDrag={(dx, dy) => onUpdatePosition(person.id, dx, dy)}
              onDelete={onDeletePerson}
              zoomScale={transform.k}
            />
          ))}
        </g>
        {selectionRect}
      </svg>
      
      {contextMenu && (
        <div 
          className="fixed bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl py-2 w-52 z-[60]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { onAddParent(contextMenu.personId); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white text-slate-700 font-bold text-xs">
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            </div>
            Add Parent
          </button>
          <button onClick={() => { onAddSibling(contextMenu.personId); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white text-slate-700 font-bold text-xs">
             <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </div>
            Add Sibling
          </button>
          <button onClick={() => { onAddChild(contextMenu.personId); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white text-slate-700 font-bold text-xs">
             <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </div>
            Add Child
          </button>
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <button onClick={() => { onDeletePerson(contextMenu.personId); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 bg-white text-rose-600 font-bold text-xs">
             <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            Remove Person
          </button>
        </div>
      )}

      <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-auto sm:right-6 flex flex-col gap-2 sm:gap-3 z-10 scale-90 sm:scale-100 origin-bottom-left sm:origin-bottom-right mb-[env(safe-area-inset-bottom)]">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col gap-1.5 sm:gap-2">
          <button onClick={() => d3.select(svgRef.current!).call(zoomBehaviorRef.current!.scaleBy, 1.5)} className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl text-slate-800 font-black text-xl sm:text-2xl flex items-center justify-center">+</button>
          <button onClick={() => d3.select(svgRef.current!).call(zoomBehaviorRef.current!.scaleBy, 0.6)} className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl text-slate-800 font-black text-xl sm:text-2xl flex items-center justify-center">−</button>
          <div className="h-px bg-slate-100 mx-2" />
          <button onClick={() => {
            const width = svgRef.current?.clientWidth || 0;
            const height = svgRef.current?.clientHeight || 0;
            d3.select(svgRef.current!).call(zoomBehaviorRef.current!.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1));
          }} className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
});
