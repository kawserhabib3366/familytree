
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FamilyTreeCanvas, CanvasHandle } from './components/FamilyTreeCanvas';
import { Sidebar } from './components/Sidebar';
import { Person, Gender, FamilyData, Relationship } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'kingraph_v1_data';

const INITIAL_PERSON: Person = {
  id: 'me',
  name: 'Me (X)',
  gender: Gender.UNKNOWN,
  position: { x: 0, y: 0 }
};

const App: React.FC = () => {
  const canvasRef = useRef<CanvasHandle>(null);
  const [data, setData] = useState<FamilyData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      persons: [INITIAL_PERSON],
      relationships: []
    };
  });
  
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>('me');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const filteredPersons = searchQuery.length > 1 
    ? data.persons.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleJumpToPerson = (id: string) => {
    setSelectedPersonId(id);
    setSearchQuery('');
    canvasRef.current?.zoomToPerson(id);
  };

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kingraph_tree.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  const handleImport = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData);
      if (imported.persons && Array.isArray(imported.persons)) {
        setData(imported);
        setSelectedPersonId(imported.persons[0]?.id || null);
      }
    } catch (e) { alert("Invalid data format."); }
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Clear all data?")) {
      setData({ persons: [{ ...INITIAL_PERSON, id: 'me' }], relationships: [] });
      setSelectedPersonId('me');
    }
  }, []);

  const deletePerson = useCallback((id: string) => {
    if (id === 'me') {
      alert("The root person 'Me' cannot be deleted.");
      return;
    }
    setData(prev => ({ 
      persons: prev.persons.filter(p => p.id !== id), 
      relationships: prev.relationships.filter(r => r.fromId !== id && r.toId !== id) 
    }));
    setSelectedPersonId(null);
  }, []);

  const addParent = useCallback((childId: string) => {
    setData(prev => {
      const child = prev.persons.find(p => p.id === childId);
      if (!child) return prev;
      const parentRels = prev.relationships.filter(r => r.toId === childId && r.type === 'parent-child');
      if (parentRels.length >= 2) return prev;

      const newPersons = [...prev.persons];
      const newRelationships = [...prev.relationships];
      const existingParentIds = parentRels.map(r => r.fromId);
      const hasFather = prev.persons.some(p => existingParentIds.includes(p.id) && p.gender === Gender.MALE);
      const hasMother = prev.persons.some(p => existingParentIds.includes(p.id) && p.gender === Gender.FEMALE);

      let fatherId = '';
      let motherId = '';

      if (!hasFather) {
        fatherId = uuidv4();
        newPersons.push({ id: fatherId, name: 'Father', gender: Gender.MALE, position: { x: child.position.x - 140, y: child.position.y - 200 } });
        newRelationships.push({ id: uuidv4(), type: 'parent-child', fromId: fatherId, toId: childId });
      } else {
        fatherId = prev.persons.find(p => existingParentIds.includes(p.id) && p.gender === Gender.MALE)?.id || '';
      }

      if (!hasMother) {
        motherId = uuidv4();
        newPersons.push({ id: motherId, name: 'Mother', gender: Gender.FEMALE, position: { x: child.position.x + 140, y: child.position.y - 200 } });
        newRelationships.push({ id: uuidv4(), type: 'parent-child', fromId: motherId, toId: childId });
      } else {
        motherId = prev.persons.find(p => existingParentIds.includes(p.id) && p.gender === Gender.FEMALE)?.id || '';
      }

      if (fatherId && motherId) {
        const alreadySpouses = newRelationships.some(r => r.type === 'spouse' && ((r.fromId === fatherId && r.toId === motherId) || (r.fromId === motherId && r.toId === fatherId)));
        if (!alreadySpouses) newRelationships.push({ id: uuidv4(), type: 'spouse', fromId: fatherId, toId: motherId });
      }

      return { persons: newPersons, relationships: newRelationships };
    });
  }, []);

  const addSibling = useCallback((personId: string) => {
    setData(prev => {
      const person = prev.persons.find(p => p.id === personId);
      if (!person) return prev;
      const parentRels = prev.relationships.filter(r => r.toId === personId && r.type === 'parent-child');
      if (parentRels.length === 0) { alert("Add parents first!"); return prev; }

      const siblingId = uuidv4();
      const newSibling: Person = { id: siblingId, name: 'Sibling', gender: Gender.UNKNOWN, position: { x: person.position.x + 300, y: person.position.y } };
      const newRels = parentRels.map(pr => ({ id: uuidv4(), type: 'parent-child' as const, fromId: pr.fromId, toId: siblingId }));
      return { persons: [...prev.persons, newSibling], relationships: [...prev.relationships, ...newRels] };
    });
  }, []);

  const addChild = useCallback((parentId: string, partnerId?: string) => {
    setData(prev => {
      const parent = prev.persons.find(p => p.id === parentId);
      if (!parent) return prev;
      const newPersons = [...prev.persons];
      const newRels = [...prev.relationships];
      let spouseId = partnerId;

      if (!spouseId) {
        spouseId = uuidv4();
        newPersons.push({ id: spouseId, name: 'Partner', gender: Gender.UNKNOWN, position: { x: parent.position.x + 220, y: parent.position.y } });
        newRels.push({ id: uuidv4(), type: 'spouse', fromId: parentId, toId: spouseId });
      }

      const childId = uuidv4();
      newPersons.push({ id: childId, name: 'Child', gender: Gender.UNKNOWN, position: { x: parent.position.x + 110, y: parent.position.y + 200 } });
      newRels.push({ id: uuidv4(), type: 'parent-child', fromId: parentId, toId: childId });
      newRels.push({ id: uuidv4(), type: 'parent-child', fromId: spouseId, toId: childId });
      return { persons: newPersons, relationships: newRels };
    });
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 relative">
      {/* Search Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-200 p-1.5 flex items-center gap-2 pointer-events-auto ring-1 ring-black/5">
          <div className="pl-4 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search family member..."
            className="flex-1 bg-transparent border-none outline-none py-2 text-sm font-bold text-slate-800 placeholder:text-slate-400"
          />
        </div>
        
        {/* Search Results */}
        {filteredPersons.length > 0 && (
          <div className="mt-2 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            {filteredPersons.slice(0, 5).map(p => (
              <button 
                key={p.id}
                onClick={() => handleJumpToPerson(p.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-[10px] ${p.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500'}`}>
                  {p.name[0]}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-black text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{p.birthYear || 'Unknown'} — {p.deathYear || (p.isDeceased ? '?' : 'Present')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FamilyTreeCanvas 
        ref={canvasRef}
        data={data}
        selectedPersonId={selectedPersonId}
        onSelectPerson={(id) => {
          setSelectedPersonId(id);
          if (id && window.innerWidth < 768) setIsSidebarOpen(true);
        }}
        onUpdatePosition={(id, x, y) => {
          setData(prev => ({ ...prev, persons: prev.persons.map(p => p.id === id ? { ...p, position: { x, y } } : p) }));
        }}
        onDeletePerson={deletePerson}
        onAddParent={addParent}
        onAddSibling={addSibling}
        onAddChild={addChild}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedPerson={data.persons.find(p => p.id === selectedPersonId) || null}
        relationships={data.relationships}
        persons={data.persons}
        onAddParent={addParent}
        onAddSibling={addSibling}
        onAddChild={addChild}
        onUpdatePerson={(p) => setData(prev => ({ ...prev, persons: prev.persons.map(old => old.id === p.id ? p : old) }))}
        onDeletePerson={deletePerson}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center z-20 active:scale-90 transition-all border-4 border-white">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      )}
    </div>
  );
};

export default App;
