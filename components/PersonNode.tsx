
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
  const GRID_SIZE = 20;

  useEffect(() => {
    if (!gRef.current) return;

    const dragBehavior = d3.drag<SVGGElement, unknown>()
      .on('drag', (event) => {
        // Implement snap-to-grid logic
        const snappedX = Math.round(event.x / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(event.y / GRID_SIZE) * GRID_SIZE;
        onDrag(snappedX, snappedY);
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
      onClick={onClick}
      className="cursor-pointer group"
      style={{ filter: deceasedFilter }}
    >
      {/* Selection Glow */}
      {isSelected && (
        <circle r="56" fill={person.color || (person.isDeceased ? '#000' : theme.glow)} fillOpacity={0.3} className="animate-pulse" />
      )}
      
      {/* Background Aura */}
      <circle r="44" fill="white" className="opacity-10" />

      {/* Main Node Body */}
      <circle 
        r="40" 
        style={mainCircleStyle}
        className={`${person.color ? '' : theme.bg} ${person.isDeceased ? 'stroke-black' : theme.stroke} transition-all duration-300 ${isSelected ? 'stroke-[8px]' : 'stroke-[4px]'}`}
        stroke={person.isDeceased ? 'black' : 'white'}
      />
      
      {/* Icon */}
      <g transform="translate(-16, -16) scale(1.33)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none drop-shadow-sm">
          {theme.icon}
        </svg>
      </g>

      {/* Deceased Tombstone Badge */}
      {person.isDeceased && (
        <g transform="translate(26, -26)">
          <circle r="14" fill="black" stroke="white" strokeWidth="2" />
          <path d="M-5 5 L5 5 L5 -2 Q5 -7 0 -7 Q-5 -7 -5 -2 Z" fill="white" transform="scale(0.9)" />
        </g>
      )}

      {/* Label Group */}
      <foreignObject x="-80" y="46" width="160" height="70">
        <div className="flex flex-col items-center p-1 text-center">
          <span className={`
            px-3 py-0.5 rounded-full text-[11px] font-black shadow-md transition-all duration-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full
            ${isSelected ? 'bg-slate-900 text-white scale-110 ring-2 ring-white' : (person.isDeceased ? 'bg-black text-slate-100' : 'bg-white text-slate-800 border-2 border-slate-100')}
          `}>
            {person.name || 'Unnamed'}
          </span>
          {datesText && (
            <span className="mt-1 px-2 py-0.5 bg-slate-900/5 backdrop-blur-sm rounded text-[9px] font-bold text-slate-500 tracking-tighter uppercase whitespace-nowrap">
              {datesText}
            </span>
          )}
        </div>
      </foreignObject>

      {/* Delete Shortcut */}
      {isSelected && person.id !== 'me' && (
        <g 
          transform="translate(38, -38)"
          onClick={(e) => { e.stopPropagation(); onDelete?.(person.id); }}
          className="hover:scale-110 transition-transform"
        >
          <circle r="15" fill="#ef4444" stroke="white" strokeWidth="3" />
          <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
