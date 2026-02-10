
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FamilyTreeCanvas } from './components/FamilyTreeCanvas';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLastSaved(Date.now());
  }, [data]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kingraph_tree_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  const handleImport = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData);
      // Basic validation
      if (imported.persons && Array.isArray(imported.persons)) {
        setData(imported);
        setSelectedPersonId(imported.persons[0]?.id || null);
      }
    } catch (e) {
      alert("Invalid JSON file provided.");
    }
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to delete your entire tree? This cannot be undone.")) {
      setData({
        persons: [{ ...INITIAL_PERSON, id: 'me' }],
        relationships: []
      });
      setSelectedPersonId('me');
    }
  }, []);

  const addParent = useCallback((childId: string) => {
    setData(prev => {
      const child = prev.persons.find(p => p.id === childId);
      if (!child) return prev;

      const parentRels = prev.relationships.filter(r => r.toId === childId && r.type === 'parent-child');
      const existingParentIds = parentRels.map(r => r.fromId);

      if (existingParentIds.length >= 2) return prev;

      const newPersons = [...prev.persons];
      const newRelationships = [...prev.relationships];

      const hasFather = prev.persons.some(p => existingParentIds.includes(p.id) && p.gender === Gender.MALE);
      const hasMother = prev.persons.some(p => existingParentIds.includes(p.id) && p.gender === Gender.FEMALE);

      let fatherId = '';
      let motherId = '';

      if (!hasFather) {
        fatherId = uuidv4();
        newPersons.push({
          id: fatherId,
          name: 'Father',
          gender: Gender.MALE,
          position: { x: child.position.x - 120, y: child.position.y - 180 }
        });
        newRelationships.push({ id: uuidv4(), type: 'parent-child', fromId: fatherId, toId: childId });
      } else {
        fatherId = prev.persons.find(p => existingParentIds.includes(p.id) && p.gender === Gender.MALE)?.id || '';
      }

      if (!hasMother) {
        motherId = uuidv4();
        newPersons.push({
          id: motherId,
          name: 'Mother',
          gender: Gender.FEMALE,
          position: { x: child.position.x + 120, y: child.position.y - 180 }
        });
        newRelationships.push({ id: uuidv4(), type: 'parent-child', fromId: motherId, toId: childId });
      } else {
        motherId = prev.persons.find(p => existingParentIds.includes(p.id) && p.gender === Gender.FEMALE)?.id || '';
      }

      if (fatherId && motherId) {
        const alreadySpouses = newRelationships.some(r => 
          r.type === 'spouse' && 
          ((r.fromId === fatherId && r.toId === motherId) || (r.fromId === motherId && r.toId === fatherId))
        );
        if (!alreadySpouses) {
          newRelationships.push({ id: uuidv4(), type: 'spouse', fromId: fatherId, toId: motherId });
        }
      }

      return { persons: newPersons, relationships: newRelationships };
    });
  }, []);

  const addSibling = useCallback((personId: string) => {
    setData(prev => {
      const person = prev.persons.find(p => p.id === personId);
      if (!person) return prev;

      const parentRels = prev.relationships.filter(r => r.toId === personId && r.type === 'parent-child');
      if (parentRels.length === 0) {
        alert("Add parents first to create a sibling!");
        return prev;
      }

      const siblingId = uuidv4();
      const newSibling: Person = {
        id: siblingId,
        name: 'Sibling',
        gender: Gender.UNKNOWN,
        position: { x: person.position.x + 250, y: person.position.y }
      };

      const newRels = parentRels.map(pr => ({
        id: uuidv4(),
        type: 'parent-child' as const,
        fromId: pr.fromId,
        toId: siblingId
      }));

      return {
        persons: [...prev.persons, newSibling],
        relationships: [...prev.relationships, ...newRels]
      };
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
        newPersons.push({
          id: spouseId,
          name: 'Partner',
          gender: Gender.UNKNOWN,
          position: { x: parent.position.x + 200, y: parent.position.y }
        });
        newRels.push({ id: uuidv4(), type: 'spouse', fromId: parentId, toId: spouseId });
      }

      const childId = uuidv4();
      newPersons.push({
        id: childId,
        name: 'Child',
        gender: Gender.UNKNOWN,
        position: { x: parent.position.x + 100, y: parent.position.y + 180 }
      });

      newRels.push({ id: uuidv4(), type: 'parent-child', fromId: parentId, toId: childId });
      newRels.push({ id: uuidv4(), type: 'parent-child', fromId: spouseId, toId: childId });

      return { persons: newPersons, relationships: newRels };
    });
  }, []);

  const updatePerson = useCallback((updatedPerson: Person) => {
    setData(prev => ({
      ...prev,
      persons: prev.persons.map(p => p.id === updatedPerson.id ? updatedPerson : p)
    }));
  }, []);

  const deletePerson = useCallback((personId: string) => {
    if (personId === 'me') {
        alert("The root person 'Me' cannot be deleted, but you can rename them.");
        return;
    }
    setData(prev => ({
      persons: prev.persons.filter(p => p.id !== personId),
      relationships: prev.relationships.filter(r => r.fromId !== personId && r.toId !== personId)
    }));
    setSelectedPersonId(null);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 relative">
      <FamilyTreeCanvas 
        data={data}
        selectedPersonId={selectedPersonId}
        onSelectPerson={(id) => {
          setSelectedPersonId(id);
          if (id && window.innerWidth < 768) setIsSidebarOpen(true);
        }}
        onUpdatePosition={(id, x, y) => {
          setData(prev => ({
            ...prev,
            persons: prev.persons.map(p => p.id === id ? { ...p, position: { x, y } } : p)
          }));
        }}
        onDeletePerson={deletePerson}
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
        onUpdatePerson={updatePerson}
        onDeletePerson={deletePerson}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      {/* Floating Toggle Button for Mobile */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center z-20 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}

      <div className="absolute bottom-6 left-6 pointer-events-none hidden sm:flex flex-col">
        <h1 className="text-3xl font-black text-slate-900 drop-shadow-sm tracking-tight">KinGraph</h1>
        <div className="flex items-center gap-2">
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-[10px]">Heritage Browser</p>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <p className="text-emerald-500 font-bold uppercase text-[9px] animate-pulse">Auto-saved</p>
        </div>
      </div>
    </div>
  );
};

export default App;
