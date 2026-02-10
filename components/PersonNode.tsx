
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Person, Gender } from '../types';

interface Props {
  person: Person;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDrag: (x: number, y: number) => void;
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
  onDrag,
  onDelete,
  zoomScale
}) => {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current) return;

    const dragBehavior = d3.drag<SVGGElement, unknown>()
      .on('drag', (event) => {
        onDrag(event.x, event.y);
      });

    d3.select(gRef.current).call(dragBehavior);
  }, [onDrag]);

  const theme = GENDER_THEMES[person.gender] || GENDER_THEMES[Gender.UNKNOWN];
  
  // Use custom color if provided, otherwise fallback to theme class
  const mainCircleStyle = person.color ? { fill: person.color } : {};
  const mainCircleClass = person.color 
    ? `${theme.stroke} transition-all duration-300 shadow-2xl ${isSelected ? 'stroke-[8px]' : 'stroke-[4px]'}` 
    : `${theme.bg} ${theme.stroke} transition-all duration-300 shadow-2xl ${isSelected ? 'stroke-[8px]' : 'stroke-[4px]'}`;

  return (
    <g 
      ref={gRef} 
      transform={`translate(${person.position.x}, ${person.position.y})`}
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Selection Backdrop */}
      {isSelected && (
        <circle r="54" fill={person.color ? person.color : theme.glow} fillOpacity={0.4} className="animate-pulse" />
      )}
      
      {/* Connection Point Aura */}
      <circle r="44" fill="white" className="opacity-20" />

      {/* Main Node Body */}
      <circle 
        r="40" 
        style={mainCircleStyle}
        className={mainCircleClass}
        stroke="white"
      />
      
      {/* Gender/Status Icon */}
      <g transform="translate(-16, -16) scale(1.33)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-sm">
          {theme.icon}
        </svg>
      </g>

      {/* Name Label */}
      <foreignObject x="-80" y="46" width="160" height="50">
        <div className="flex justify-center p-1">
          <span className={`px-4 py-1 rounded-full text-xs font-black shadow-lg transition-all duration-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${isSelected ? 'bg-slate-900 text-white scale-110' : 'bg-white text-slate-800 border-2 border-slate-100'}`}>
            {person.name || 'Unnamed'}
          </span>
        </div>
      </foreignObject>

      {/* Contextual Delete Button */}
      {isSelected && person.id !== 'me' && (
        <g 
          transform="translate(38, -38)"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(person.id);
          }}
          className="hover:scale-125 transition-transform duration-200"
        >
          <circle r="16" fill="#f43f5e" stroke="white" strokeWidth="3" className="shadow-lg" />
          <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
