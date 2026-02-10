
import React, { useState, useRef } from 'react';
import { Person, Gender, Relationship } from '../types';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedPerson: Person | null;
  relationships: Relationship[];
  persons: Person[];
  onAddParent: (id: string) => void;
  onAddSibling: (id: string) => void;
  onAddChild: (id: string, partnerId?: string) => void;
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

export const Sidebar: React.FC<Props> = ({
  isOpen,
  onToggle,
  selectedPerson,
  relationships,
  persons,
  onAddParent,
  onAddSibling,
  onAddChild,
  onUpdatePerson,
  onDeletePerson,
  onExport,
  onImport,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'storage'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sidebarClasses = `
    fixed md:relative top-0 right-0 h-full bg-white border-l border-slate-200 shadow-2xl z-40
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'}
    w-full sm:w-80 flex flex-col
  `;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImport(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStorageTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cloud & Local Data</label>
        
        <div className="space-y-3">
          <button 
            onClick={onExport}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">Export Tree (.json)</span>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">Import Tree</span>
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button 
          onClick={onReset}
          className="w-full py-4 text-xs font-black text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest"
        >
          Clear Workspace & Reset
        </button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="h-full flex flex-col">
       <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">KinGraph</h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto mb-8">Select a family member on the canvas or manage your files below.</p>
        
        <div className="w-full flex bg-slate-100/80 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'storage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            DATA SETTINGS
          </button>
        </div>

        {activeTab === 'storage' && renderStorageTab()}

        <button 
          onClick={onToggle}
          className="md:hidden mt-auto px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          BACK TO CANVAS
        </button>
      </div>
    </div>
  );

  if (!selectedPerson) {
    return <div className={sidebarClasses}>{renderEmptyState()}</div>;
  }

  const spouses = relationships
    .filter(r => r.type === 'spouse' && (r.fromId === selectedPerson.id || r.toId === selectedPerson.id))
    .map(r => r.fromId === selectedPerson.id ? r.toId : r.fromId)
    .map(id => persons.find(p => p.id === id))
    .filter(p => p !== undefined) as Person[];

  const parents = relationships
    .filter(r => r.type === 'parent-child' && r.toId === selectedPerson.id)
    .map(r => persons.find(p => p.id === r.fromId))
    .filter(p => p !== undefined) as Person[];

  const children = relationships
    .filter(r => r.type === 'parent-child' && r.fromId === selectedPerson.id)
    .map(r => persons.find(p => p.id === r.toId))
    .filter(p => p !== undefined) as Person[];

  const genderColor = selectedPerson.gender === Gender.MALE ? 'bg-sky-500' : selectedPerson.gender === Gender.FEMALE ? 'bg-rose-500' : 'bg-indigo-500';

  return (
    <div className={sidebarClasses}>
      {/* Mobile Close Button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <span className="font-black text-xs text-slate-400 tracking-widest uppercase">Member Profile</span>
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User Header Card */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <div 
            style={selectedPerson.color ? { backgroundColor: selectedPerson.color } : {}}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg ring-4 ring-white ${!selectedPerson.color ? genderColor : ''} transition-all duration-500 flex-shrink-0`}
          >
            {selectedPerson.name[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 truncate tracking-tight leading-tight">{selectedPerson.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span 
                style={selectedPerson.color ? { backgroundColor: selectedPerson.color } : {}}
                className={`w-2 h-2 rounded-full ${!selectedPerson.color ? genderColor : ''}`}
              ></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{selectedPerson.gender}</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            DETAILS
          </button>
          <button 
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'actions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            ACTIONS
          </button>
          <button 
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'storage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            FILES
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Display Identity</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Full Name</label>
                  <input 
                    type="text"
                    value={selectedPerson.name}
                    onChange={(e) => onUpdatePerson({ ...selectedPerson, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Gender Expression</label>
                  <select 
                    value={selectedPerson.gender}
                    onChange={(e) => onUpdatePerson({ ...selectedPerson, gender: e.target.value as Gender })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm appearance-none"
                  >
                    <option value={Gender.UNKNOWN}>Unknown</option>
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1">Node Theme Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        title={c.name}
                        onClick={() => onUpdatePerson({ ...selectedPerson, color: c.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm flex items-center justify-center ${
                          (selectedPerson.color === c.value) || (!selectedPerson.color && c.value === undefined)
                            ? 'border-slate-900 scale-110'
                            : 'border-white hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: c.value || '#cbd5e1' }}
                      >
                        {(!selectedPerson.color && c.value === undefined) && (
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Connections</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Lineage (Parents)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parents.length > 0 ? parents.map(p => (
                      <span key={p.id} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">{p.name}</span>
                    )) : <span className="text-[10px] text-slate-300 font-medium italic">No parents recorded</span>}
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Affiliations (Partners)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {spouses.length > 0 ? spouses.map(p => (
                      <span key={p.id} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">{p.name}</span>
                    )) : <span className="text-[10px] text-slate-300 font-medium italic">No partners recorded</span>}
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Legacy (Children)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {children.length > 0 ? children.map(p => (
                      <span key={p.id} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">{p.name}</span>
                    )) : <span className="text-[10px] text-slate-300 font-medium italic">No children recorded</span>}
                  </div>
                </div>
              </div>
            </div>

            {selectedPerson.id !== 'me' && (
              <div className="pt-2">
                <button 
                  onClick={() => onDeletePerson(selectedPerson.id)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white py-4 rounded-2xl text-xs font-black transition-all duration-300 shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  REMOVE FROM TREE
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ASCEND (Ancestors)</label>
              <button 
                onClick={() => onAddParent(selectedPerson.id)}
                disabled={parents.length >= 2}
                className={`group w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${parents.length >= 2 ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50' : 'border-sky-50 bg-sky-50/30 hover:border-sky-500 hover:bg-white hover:shadow-xl hover:shadow-sky-100 active:scale-95'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${parents.length >= 2 ? 'bg-slate-300' : 'bg-sky-500'}`}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-black text-slate-800 text-sm tracking-tight">Add Parents</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expand Upwards</div>
                </div>
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LATERAL (Siblings)</label>
              <button 
                onClick={() => onAddSibling(selectedPerson.id)}
                className="group w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/30 hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 active:scale-95"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm tracking-tight">Add Sibling</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Same Generation</div>
                </div>
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DESCEND (Descendants)</label>
              <button 
                onClick={() => onAddChild(selectedPerson.id)}
                className="group w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-50 bg-amber-50/30 hover:border-amber-500 hover:bg-white hover:shadow-xl hover:shadow-amber-100 transition-all duration-300 active:scale-95"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm tracking-tight">New Branch</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">With New Partner</div>
                </div>
              </button>
              {spouses.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-2 pl-2 border-l-2 border-slate-100">
                  {spouses.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => onAddChild(selectedPerson.id, s.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all group active:scale-95"
                    >
                      <div className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-colors flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-slate-700 text-xs truncate">Child with {s.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'storage' && renderStorageTab()}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 text-center font-black tracking-widest uppercase">
        KinGraph Engine v1.1 • Infinite Canvas
      </div>
    </div>
  );
};
