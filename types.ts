
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  color?: string; // Hex color or CSS color name
  isPlaceholder?: boolean;
  isDeceased?: boolean;
  birthYear?: string;
  deathYear?: string;
  position: { x: number; y: number };
}

export type RelationshipType = 'parent-child' | 'spouse';

export interface Relationship {
  id: string;
  type: RelationshipType;
  fromId: string; // parent or spouse 1
  toId: string;   // child or spouse 2
}

export interface FamilyData {
  persons: Person[];
  relationships: Relationship[];
}
