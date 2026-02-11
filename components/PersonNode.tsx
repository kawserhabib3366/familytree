
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';

interface Props {
  person: Person;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDrag: (dx: number, dy: number) => void;
  onDelete?: (id: string) => void;
  zoomScale: number;
}

const GENDER_THEMES = {
  [Gender.MALE]: {
    bg: 'fill-sky-500',
    stroke: 'stroke-sky-600',
    glow: 'rgba(14, 165, 233, 0.4)',
    icon: (
      <g>
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        <path d="M16 4h3m0 0v3m0-3-3 3" />
      </g>
    )
  },
  [Gender.FEMALE]: {
    bg: 'fill-rose-500',
    stroke: 'stroke-rose-600',
    glow: 'rgba(244, 63, 94, 0.4)',
    icon: (
      <g>
        <circle cx="12" cy="8" r="3" />
        <path d="M7 18.662V17a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        <path d="M12 21v-2m-2 2h4" />
      </g>
    )
  },
  [Gender.OTHER]: {
    bg: 'fill-indigo-500',
    stroke: 'stroke-indigo-600',
    glow: 'rgba(99, 102, 241, 0.4)',
    icon: (
      <g>
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
      </g>
    )
  },
  [Gender.UNKNOWN]: {
    bg: 'fill-slate-400',
    stroke: 'stroke-slate-500',
    glow: 'rgba(148, 163, 184, 0.4)',
    icon: (
      <g>
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        <text x="12" y="11" fontSize="6" textAnchor="middle" fill="white" fontWeight="bold">?</text>
      </g>
    )
  },
};

export const PersonNode: React.FC<Props> = ({ 
  person, 
  isSelected, 
  onClick, 
  onContextMenu,
  onDrag,
  onDelete,
  zoomScale
}) => {
  const gRef = useRef<SVGGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!gRef.current) return;

    const dragBehavior = d3.drag<SVGGElement, unknown>()
      .on('start', (event) => {
        setIsDragging(true);
        if (event.sourceEvent) event.sourceEvent.stopPropagation();
      })
      .on('drag', (event) => {
        onDrag(event.dx, event.dy);
      })
      .on('end', () => {
        setIsDragging(false);
      });

    d3.select(gRef.current).call(dragBehavior);
  }, [onDrag]);

  const theme = GENDER_THEMES[person.gender] || GENDER_THEMES[Gender.UNKNOWN];
  const deceasedFilter = person.isDeceased ? 'grayscale(100%) opacity(0.8)' : 'none';
  const mainCircleStyle = person.color ? { fill: person.color } : {};

  const datesText = [person.birthYear, person.deathYear]
    .filter(Boolean)
    .join(' — ');

  return (
    <g 
      ref={gRef} 
      transform={`translate(${person.position.x}, ${person.position.y})`}
      onClick={(e) => {
        if (!isDragging) onClick(e);
      }}
      onContextMenu={onContextMenu}
      className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ filter: deceasedFilter, touchAction: 'none' }}
    >
      {/* Selection Ring (Static) */}
      {isSelected && (
        <g>
          <circle 
            r="54" 
            fill="none" 
            stroke={person.color || theme.glow} 
            strokeWidth="2" 
            strokeDasharray="4 4" 
            className="opacity-40"
          />
          <circle 
            r="50" 
            fill={person.color || theme.glow} 
            fillOpacity={0.15} 
          />
        </g>
      )}

      {/* Lifted Shadow during drag */}
      {isDragging && (
        <circle r="42" fill="black" fillOpacity={0.15} transform="translate(6, 6)" filter="blur(8px)" />
      )}
      
      <circle r="44" fill="white" className="opacity-10" />

      {/* Main Node Body */}
      <circle 
        r="40" 
        style={mainCircleStyle}
        className={`
          ${person.color ? '' : theme.bg} 
          ${person.isDeceased ? 'stroke-black' : theme.stroke} 
          ${isSelected ? 'stroke-[6px]' : 'stroke-[4px]'}
          ${isDragging ? 'drop-shadow-2xl' : 'drop-shadow-md'}
        `}
        stroke={person.isDeceased ? 'black' : 'white'}
      />
      
      <g transform="translate(-16, -16) scale(1.33)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-sm">
          {theme.icon}
        </svg>
      </g>

      {person.isDeceased && (
        <g transform="translate(26, -26)">
          <circle r="14" fill="black" stroke="white" strokeWidth="2" />
          <path d="M-5 5 L5 5 L5 -2 Q5 -7 0 -7 Q-5 -7 -5 -2 Z" fill="white" transform="scale(0.9)" />
        </g>
      )}

      {/* Label Group */}
      <foreignObject x="-80" y="46" width="160" height="80">
        <div className="flex flex-col items-center p-1 text-center pointer-events-none">
          <span className={`
            px-3 py-1 rounded-full text-[11px] font-black shadow-md tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full
            ${isSelected 
              ? 'bg-slate-900 text-white ring-2 ring-white z-10' 
              : (person.isDeceased ? 'bg-black text-slate-100' : 'bg-white text-slate-800 border border-slate-200')}
          `}>
            {person.name || 'Unnamed'}
          </span>
          {datesText && (
            <span className={`
              mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap
              ${isSelected ? 'bg-slate-900 text-slate-200' : 'bg-slate-900/5 backdrop-blur-sm text-slate-500'}
            `}>
              {datesText}
            </span>
          )}
        </div>
      </foreignObject>

      {isSelected && person.id !== 'me' && !isDragging && (
        <g transform="translate(38, -38)" onClick={(e) => { e.stopPropagation(); onDelete?.(person.id); }} className="cursor-pointer">
          <circle r="15" fill="#ef4444" stroke="white" strokeWidth="2" />
          <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
