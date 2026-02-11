
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

export type RelationshipType = 'parent-child' | 'spouse' | 'other';

export interface Relationship {
  id: string;
  type: RelationshipType;
  fromId: string; // parent, spouse 1, or source
  toId: string;   // child, spouse 2, or target
  label?: string; // Custom label for 'other' type
}

export interface FamilyData {
  persons: Person[];
  relationships: Relationship[];
}
