
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
    w-[85%] max-w-[400px] md:w-80 flex flex-col
  `;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onImport(event.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStorageTab = () => (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-2">
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100">
        <label className="block text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4">Tree Management</label>
        <div className="space-y-2 sm:space-y-3">
          <button onClick={onExport} className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-400 active:scale-95 transition-all">
            <span className="text-xs sm:text-sm font-bold text-slate-700">Download (.json)</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-400 active:scale-95 transition-all">
            <span className="text-xs sm:text-sm font-bold text-slate-700">Restore from File</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </div>
      <button onClick={onReset} className="w-full py-4 sm:py-5 text-[10px] sm:text-xs font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest bg-rose-50 rounded-xl sm:rounded-2xl active:scale-95 transition-all">
        Wipe All Data
      </button>
    </div>
  );

  if (!selectedPerson) {
    return (
      <div className={sidebarClasses}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 text-slate-200">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800">No Selection</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Pick an ancestor to edit their details</p>
          <div className="w-full mt-6 sm:mt-8 flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('storage')} className="flex-1 py-2 text-[9px] sm:text-[10px] font-black rounded-lg bg-white shadow text-slate-900">FILES</button>
          </div>
          {activeTab === 'storage' && renderStorageTab()}
        </div>
        <button onClick={onToggle} className="m-4 sm:m-6 mb-[calc(1.5rem+env(safe-area-inset-bottom))] py-3 sm:py-4 bg-slate-900 text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-xl active:scale-95">CLOSE SIDEBAR</button>
      </div>
    );
  }

  const parents = relationships.filter(r => r.toId === selectedPerson.id && r.type === 'parent-child').map(r => persons.find(p => p.id === r.fromId));
  const spouses = relationships.filter(r => r.type === 'spouse' && (r.fromId === selectedPerson.id || r.toId === selectedPerson.id)).map(r => persons.find(p => p.id === (r.fromId === selectedPerson.id ? r.toId : r.fromId)));

  return (
    <div className={sidebarClasses}>
      {/* Fixed Header - Compact on small screens */}
      <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-50 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div style={selectedPerson.color ? { backgroundColor: selectedPerson.color } : {}} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-lg ${!selectedPerson.color ? (selectedPerson.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500') : ''}`}>
            {selectedPerson.name[0] || '?'}
          </div>
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">{selectedPerson.name}</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPerson.gender}</p>
          </div>
        </div>
        <button onClick={onToggle} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 rounded-xl sm:rounded-2xl active:scale-90 transition-all hover:bg-slate-200" aria-label="Close Sidebar">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-3 sm:p-4 bg-white sticky top-[68px] sm:top-[84px] z-10">
        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-md sm:rounded-lg transition-all ${activeTab === 'details' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>PROFILE</button>
          <button onClick={() => setActiveTab('actions')} className={`flex-1 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-md sm:rounded-lg transition-all ${activeTab === 'actions' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>CONNECT</button>
          <button onClick={() => setActiveTab('storage')} className={`flex-1 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black rounded-md sm:rounded-lg transition-all ${activeTab === 'storage' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>FILES</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] scrollbar-hide">
        {activeTab === 'details' && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-2 duration-200">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 sm:mb-2 ml-1">Full Name</label>
                <input type="text" value={selectedPerson.name} onChange={e => onUpdatePerson({...selectedPerson, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-slate-800 shadow-sm" placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 sm:mb-2 ml-1">Born</label>
                  <input type="number" value={selectedPerson.birthYear || ''} onChange={e => onUpdatePerson({...selectedPerson, birthYear: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-slate-800" placeholder="1900" />
                </div>
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 sm:mb-2 ml-1">Passed</label>
                  <input type="number" disabled={!selectedPerson.isDeceased} value={selectedPerson.deathYear || ''} onChange={e => onUpdatePerson({...selectedPerson, deathYear: e.target.value})} className={`w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 ${!selectedPerson.isDeceased ? 'opacity-40' : ''}`} placeholder="2000" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
                <span className="text-xs sm:text-sm font-bold text-slate-700">Deceased</span>
                <button onClick={() => onUpdatePerson({...selectedPerson, isDeceased: !selectedPerson.isDeceased})} className={`h-7 w-12 sm:h-8 sm:w-14 rounded-full transition-colors relative ${selectedPerson.isDeceased ? 'bg-slate-900' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 sm:top-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow transition-all ${selectedPerson.isDeceased ? 'left-6 sm:left-7' : 'left-1'}`} />
                </button>
              </div>
              <div>
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 ml-1">Color Theme</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c.name} onClick={() => onUpdatePerson({...selectedPerson, color: c.value})} className={`h-8 sm:h-10 rounded-lg sm:rounded-xl border active:scale-90 transition-all ${selectedPerson.color === c.value ? 'border-slate-900 ring-2 ring-slate-100' : 'border-white'}`} style={{ backgroundColor: c.value || '#cbd5e1' }} />
                  ))}
                </div>
              </div>
            </div>
            {selectedPerson.id !== 'me' && (
              <button onClick={() => onDeletePerson(selectedPerson.id)} className="w-full py-4 sm:py-5 text-[10px] sm:text-xs font-black text-rose-500 bg-rose-50 rounded-2xl sm:rounded-3xl active:scale-95 transition-all">REMOVE FROM TREE</button>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-2 duration-200">
            <button onClick={() => onAddParent(selectedPerson.id)} disabled={parents.length >= 2} className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-sky-50 bg-sky-50/40 hover:border-sky-500 transition-all active:scale-95 disabled:opacity-30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></div>
              <div className="text-left"><p className="font-black text-slate-800 text-xs sm:text-sm">Add Parents</p><p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Mother & Father</p></div>
            </button>
            <button onClick={() => onAddSibling(selectedPerson.id)} className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-emerald-50 bg-emerald-50/40 hover:border-emerald-500 transition-all active:scale-95">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></div>
              <div className="text-left"><p className="font-black text-slate-800 text-xs sm:text-sm">Add Sibling</p><p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Same Generation</p></div>
            </button>
            <button onClick={() => onAddChild(selectedPerson.id)} className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-amber-50 bg-amber-50/40 hover:border-amber-500 transition-all active:scale-95">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
              <div className="text-left"><p className="font-black text-slate-800 text-xs sm:text-sm">New Child</p><p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">New Branch</p></div>
            </button>
          </div>
        )}

        {activeTab === 'storage' && renderStorageTab()}
      </div>
    </div>
  );
};
