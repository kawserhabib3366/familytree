
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FamilyTreeCanvas, CanvasHandle } from './components/FamilyTreeCanvas';
import { Sidebar } from './components/Sidebar';
import { Person, Gender, FamilyData, Relationship, RelationshipType } from './types';
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
  
  const [selectedIds, setSelectedIds] = useState<string[]>(['me']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const filteredPersons = searchQuery.length > 1 
    ? data.persons.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleJumpToPerson = (id: string) => {
    setSelectedIds([id]);
    setSearchQuery('');
    canvasRef.current?.jumpToPerson(id);
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
        setSelectedIds(imported.persons[0] ? [imported.persons[0].id] : []);
      }
    } catch (e) { alert("Invalid data format."); }
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Clear all data?")) {
      setData({ persons: [{ ...INITIAL_PERSON, id: 'me' }], relationships: [] });
      setSelectedIds(['me']);
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
    setSelectedIds(prev => prev.filter(sid => sid !== id));
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

  const addSpouse = useCallback((personId: string, spouseId?: string) => {
    setData(prev => {
      const person = prev.persons.find(p => p.id === personId);
      if (!person) return prev;

      const newPersons = [...prev.persons];
      const newRels = [...prev.relationships];
      let finalSpouseId = spouseId;

      if (!finalSpouseId) {
        finalSpouseId = uuidv4();
        const guessGender = person.gender === Gender.MALE ? Gender.FEMALE : (person.gender === Gender.FEMALE ? Gender.MALE : Gender.UNKNOWN);
        newPersons.push({ 
          id: finalSpouseId, 
          name: 'Partner', 
          gender: guessGender, 
          position: { x: person.position.x + 220, y: person.position.y } 
        });
      }

      const alreadySpouses = newRels.some(r => r.type === 'spouse' && ((r.fromId === personId && r.toId === finalSpouseId) || (r.fromId === finalSpouseId && r.toId === personId)));
      if (!alreadySpouses) {
        newRels.push({ id: uuidv4(), type: 'spouse', fromId: personId, toId: finalSpouseId });
      }

      return { persons: newPersons, relationships: newRels };
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

  const handleAddRelationship = useCallback((fromId: string, toId: string, type: RelationshipType, label?: string) => {
    if (fromId === toId) return;
    setData(prev => {
      const alreadyExists = prev.relationships.some(r => 
        r.type === type && 
        ((r.fromId === fromId && r.toId === toId) || (type === 'spouse' && r.fromId === toId && r.toId === fromId))
      );
      if (alreadyExists) return prev;

      const newRel: Relationship = { id: uuidv4(), type, fromId, toId, label };
      return { ...prev, relationships: [...prev.relationships, newRel] };
    });
  }, []);

  const handleUpdatePosition = useCallback((id: string, dx: number, dy: number) => {
    setData(prev => {
      const moveIds = selectedIds.includes(id) ? selectedIds : [id];
      return {
        ...prev,
        persons: prev.persons.map(p => 
          moveIds.includes(p.id) 
            ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy } } 
            : p
        )
      };
    });
  }, [selectedIds]);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs sm:max-w-md px-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-slate-200 p-1 flex items-center gap-2 pointer-events-auto ring-1 ring-black/5">
          <div className="pl-3 text-slate-400">
            <svg className="w-4 h-4 sm:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search family..."
            className="flex-1 bg-transparent border-none outline-none py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400"
          />
        </div>
        
        {filteredPersons.length > 0 && (
          <div className="mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto max-h-[50vh] overflow-y-auto">
            {filteredPersons.slice(0, 10).map(p => (
              <button 
                key={p.id}
                onClick={() => handleJumpToPerson(p.id)}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50 last:border-none"
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-white text-[9px] sm:text-[10px] ${p.gender === Gender.MALE ? 'bg-sky-500' : 'bg-rose-500'}`}>
                  {p.name[0]}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{p.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{p.birthYear || 'Unknown'} — {p.deathYear || (p.isDeceased ? '?' : 'Present')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FamilyTreeCanvas 
        ref={canvasRef}
        data={data}
        selectedIds={selectedIds}
        onSelectPersons={(ids) => {
          setSelectedIds(ids);
          if (ids.length === 1 && window.innerWidth < 768) setIsSidebarOpen(true);
        }}
        onUpdatePosition={handleUpdatePosition}
        onDeletePerson={deletePerson}
        onAddParent={addParent}
        onAddSibling={addSibling}
        onAddChild={addChild}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedPerson={data.persons.find(p => p.id === selectedIds[0]) || null}
        relationships={data.relationships}
        persons={data.persons}
        onAddParent={addParent}
        onAddSibling={addSibling}
        onAddSpouse={addSpouse}
        onAddChild={addChild}
        onAddRelationship={handleAddRelationship}
        onUpdatePerson={(p) => setData(prev => ({ ...prev, persons: prev.persons.map(old => old.id === p.id ? p : old) }))}
        onDeletePerson={deletePerson}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="fixed bottom-6 sm:bottom-8 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center z-20 border-2 sm:border-4 border-white mb-[env(safe-area-inset-bottom)]"
          aria-label="Open Sidebar"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      )}
    </div>
  );
};

export default App;
