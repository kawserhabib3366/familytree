
import React, { useState, useRef, useMemo } from 'react';
import { Person, Gender, Relationship, RelationshipType } from '../types';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedPerson: Person | null;
  relationships: Relationship[];
  persons: Person[];
  onAddParent: (id: string) => void;
  onAddSibling: (id: string) => void;
  onAddSpouse: (id: string, spouseId?: string) => void;
  onAddChild: (id: string, partnerId?: string) => void;
  onAddRelationship: (fromId: string, toId: string, type: RelationshipType, label?: string) => void;
  onUpdatePerson: (p: Person) => void;
  onDeletePerson: (id: string) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onReset: () => void;
}

const PRESET_COLORS = [
  { name: 'Default', value: undefined },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Black', value: '#0f172a' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: Gender.MALE, color: 'bg-sky-500' },
  { label: 'Female', value: Gender.FEMALE, color: 'bg-rose-500' },
  { label: 'Other', value: Gender.OTHER, color: 'bg-indigo-500' },
  { label: 'Unknown', value: Gender.UNKNOWN, color: 'bg-slate-400' },
];

export const Sidebar: React.FC<Props> = ({
  isOpen,
  onToggle,
  selectedPerson,
  relationships,
  persons,
  onAddParent,
  onAddSibling,
  onAddSpouse,
  onAddChild,
  onAddRelationship,
  onUpdatePerson,
  onDeletePerson,
  onExport,
  onImport,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'storage'>('details');
  const [linkSearch, setLinkSearch] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sidebarClasses = `
    fixed md:relative top-0 right-0 h-full bg-white border-l border-slate-200 shadow-2xl z-40
    ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'}
    w-[85%] max-w-[400px] md:w-80 flex flex-col
  `;

  const spouses = useMemo(() => {
    if (!selectedPerson) return [];
    return relationships
      .filter(r => r.type === 'spouse' && (r.fromId === selectedPerson.id || r.toId === selectedPerson.id))
      .map(r => persons.find(p => p.id === (r.fromId === selectedPerson.id ? r.toId : r.fromId)))
      .filter((p): p is Person => !!p);
  }, [selectedPerson, relationships, persons]);

  const potentialLinks = useMemo(() => {
    if (!selectedPerson) return [];
    return persons.filter(p => 
      p.id !== selectedPerson.id && 
      p.name.toLowerCase().includes(linkSearch.toLowerCase())
    );
  }, [selectedPerson, persons, linkSearch]);

  const parents = relationships.filter(r => r.toId === selectedPerson?.id && r.type === 'parent-child').map(r => persons.find(p => p.id === r.fromId));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onImport(event.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStorageTab = () => (
    <div className="space-y-6 p-2">
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
          <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Data Management</label>
        </div>
        <div className="space-y-2">
          <button onClick={onExport} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Export Tree (.json)</span>
            </div>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Import Tree File</span>
            </div>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </div>
      
      <div className="p-4 sm:p-5">
        <button onClick={onReset} className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl hover:bg-rose-100 transition-colors">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Reset All Tree Data
        </button>
      </div>
    </div>
  );

  if (!selectedPerson) {
    return (
      <div className={sidebarClasses}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/50">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white shadow-xl rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mb-4 sm:mb-6 text-slate-300 border border-slate-100">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800">Select a Relative</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-2 px-4 sm:px-6">Select an existing node on the canvas to edit their profile or add connections.</p>
          
          <div className="w-full mt-8 sm:mt-10 space-y-3 px-4">
             <div className="bg-white p-1 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('storage')} className="w-full py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl bg-slate-900 text-white shadow-lg flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  TREE SETTINGS
                </button>
             </div>
          </div>
          {activeTab === 'storage' && renderStorageTab()}
        </div>
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white">
           <button onClick={onToggle} className="w-full py-3 sm:py-4 bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl border border-slate-200">HIDE PANEL</button>
        </div>
      </div>
    );
  }

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div style={selectedPerson.color ? { backgroundColor: selectedPerson.color } : {}} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-xl ring-2 sm:ring-4 ring-white flex-shrink-0 ${!selectedPerson.color ? (selectedPerson.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500') : ''}`}>
            {selectedPerson.name[0] || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight leading-tight">{selectedPerson.name}</h2>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedPerson.gender}</span>
              <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-300"></span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedPerson.isDeceased ? 'Deceased' : 'Living'}</span>
            </div>
          </div>
          <button onClick={onToggle} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 rounded-lg sm:rounded-xl border border-slate-200 text-slate-400 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-50 sticky top-[77px] sm:top-[92px] z-10">
        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
          <button onClick={() => setActiveTab('details')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl ${activeTab === 'details' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500'}`}>
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            PROFILE
          </button>
          <button onClick={() => setActiveTab('actions')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl ${activeTab === 'actions' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500'}`}>
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.172a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.101" /></svg>
            CONNECT
          </button>
          <button onClick={() => setActiveTab('storage')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl ${activeTab === 'storage' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500'}`}>
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            DATA
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'details' && (
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Identity Group */}
            <div className="bg-slate-50/50 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Identity</label>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={selectedPerson.name} 
                    onChange={e => onUpdatePerson({...selectedPerson, name: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-slate-100 outline-none" 
                    placeholder="Full Name" 
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => onUpdatePerson({ ...selectedPerson, gender: g.value })}
                        className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl border text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2
                          ${selectedPerson.gender === g.value 
                            ? `${g.color} text-white border-transparent shadow-md` 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Group */}
            <div className="bg-slate-50/50 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Timeline & Status</label>
                <button 
                  onClick={() => onUpdatePerson({...selectedPerson, isDeceased: !selectedPerson.isDeceased})}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${selectedPerson.isDeceased ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  {selectedPerson.isDeceased ? 'Deceased' : 'Living'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200">
                  <span className="block text-[7px] sm:text-[8px] font-black text-slate-400 uppercase mb-0.5 sm:mb-1">Birth Year</span>
                  <input type="number" value={selectedPerson.birthYear || ''} onChange={e => onUpdatePerson({...selectedPerson, birthYear: e.target.value})} className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none" placeholder="YYYY" />
                </div>
                <div className={`bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 ${!selectedPerson.isDeceased ? 'opacity-30 grayscale' : ''}`}>
                  <span className="block text-[7px] sm:text-[8px] font-black text-slate-400 uppercase mb-0.5 sm:mb-1">Death Year</span>
                  <input type="number" disabled={!selectedPerson.isDeceased} value={selectedPerson.deathYear || ''} onChange={e => onUpdatePerson({...selectedPerson, deathYear: e.target.value})} className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none" placeholder="YYYY" />
                </div>
              </div>
            </div>

            {/* Appearance Group */}
            <div className="bg-slate-50/50 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm">
              <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 ml-1">Theme Color</label>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {PRESET_COLORS.map(c => (
                  <button 
                    key={c.name} 
                    onClick={() => onUpdatePerson({...selectedPerson, color: c.value})} 
                    className={`h-7 sm:h-9 w-full rounded-lg sm:rounded-xl border-2 shadow-sm ${selectedPerson.color === c.value ? 'border-slate-900 ring-2 sm:ring-4 ring-slate-100' : 'border-white'}`} 
                    style={{ backgroundColor: c.value || '#cbd5e1' }} 
                  />
                ))}
              </div>
            </div>

            {selectedPerson.id !== 'me' && (
              <div className="pt-2 sm:pt-4">
                <button onClick={() => onDeletePerson(selectedPerson.id)} className="w-full py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl sm:rounded-3xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Relative
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* New Relative Actions */}
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 ml-1">Add Family Member</label>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button onClick={() => onAddParent(selectedPerson.id)} disabled={parents.length >= 2} className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-blue-50 border border-blue-100 text-blue-700 disabled:opacity-30 disabled:grayscale">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-blue-100">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                  </div>
                  <span className="font-black text-[10px] sm:text-[11px] uppercase tracking-wider">Parent</span>
                </button>
                <button onClick={() => onAddSibling(selectedPerson.id)} className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-emerald-100">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="font-black text-[10px] sm:text-[11px] uppercase tracking-wider">Sibling</span>
                </button>
              </div>
              
              <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                {spouses.length > 0 && (
                  <div className="bg-amber-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 sm:mb-3 ml-1">Partner Selection</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                      {spouses.map(spouse => (
                        <button key={spouse.id} onClick={() => onAddChild(selectedPerson.id, spouse.id)} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-amber-200 rounded-xl sm:rounded-2xl text-left shadow-sm">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-white text-[9px] sm:text-[10px] flex-shrink-0 ${spouse.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500'}`}>{spouse.name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-black text-slate-800 truncate">Child with {spouse.name}</p>
                          </div>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button onClick={() => onAddChild(selectedPerson.id)} className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900 text-white shadow-xl hover:bg-black transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-black text-[10px] sm:text-[11px] uppercase tracking-widest">New Child</p>
                    <p className="text-[8px] sm:text-[9px] text-white/50 font-bold uppercase tracking-tighter">Unknown Partner</p>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 opacity-30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Link Existing Group */}
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 ml-1">Connect Existing Relatives</label>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1">
                  {(['parent-child', 'spouse', 'other'] as RelationshipType[]).map(t => (
                    <button 
                      key={t}
                      onClick={() => setSelectedRelType(t)}
                      className={`flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl uppercase tracking-widest ${selectedRelType === t ? 'bg-white text-slate-900 shadow-lg border border-slate-100' : 'text-slate-400'}`}
                    >
                      {t.replace('-child', '')}
                    </button>
                  ))}
                </div>
                
                {selectedRelType === 'other' && (
                  <div className="bg-indigo-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-indigo-100 space-y-2 sm:space-y-3">
                    <label className="block text-[8px] sm:text-[9px] font-black text-indigo-800 uppercase tracking-widest ml-1">Relationship Label</label>
                    <input 
                      type="text"
                      value={customLabel}
                      onChange={e => setCustomLabel(e.target.value)}
                      placeholder="e.g. Godparent, Cousin..."
                      className="w-full bg-white border border-indigo-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold text-slate-800 outline-none shadow-sm"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search relative by name..." 
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 sm:focus:ring-4 focus:ring-slate-100 outline-none"
                  />
                  {linkSearch.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 sm:mb-3 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl z-30 max-h-48 sm:max-h-60 overflow-y-auto p-1 sm:p-2">
                      {potentialLinks.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (selectedRelType === 'parent-child') {
                              onAddRelationship(p.id, selectedPerson.id, 'parent-child');
                            } else {
                              onAddRelationship(selectedPerson.id, p.id, selectedRelType, selectedRelType === 'other' ? customLabel : undefined);
                            }
                            setLinkSearch('');
                            setCustomLabel('');
                          }}
                          className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-slate-50 rounded-xl sm:rounded-2xl border-b border-slate-50 last:border-none"
                        >
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-white text-[9px] sm:text-[10px] flex-shrink-0 ${p.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500'}`}>
                            {p.name[0]}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="text-[11px] sm:text-xs font-black text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Connect as {selectedRelType.replace('-child', ' parent')}</span>
                          </div>
                        </button>
                      ))}
                      {potentialLinks.length === 0 && <p className="p-4 sm:p-6 text-center text-[10px] sm:text-xs font-bold text-slate-300">No relatives found.</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && renderStorageTab()}
      </div>

      {/* Footer Mobile Tabs */}
      <div className="md:hidden border-t border-slate-100 p-2 sm:p-3 pb-[env(safe-area-inset-bottom)] bg-white z-20">
         <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
           <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all ${activeTab === 'details' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}>DETAILS</button>
           <button onClick={() => setActiveTab('actions')} className={`flex-1 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all ${activeTab === 'actions' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}>CONNECT</button>
           <button onClick={() => setActiveTab('storage')} className={`flex-1 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all ${activeTab === 'storage' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}>DATA</button>
         </div>
      </div>
    </div>
  );
};
