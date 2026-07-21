import type { Condition } from './effect'

export enum DocumentType {
  JOURNAL = 'journal',
  NEWSPAPER = 'newspaper',
  LETTER = 'letter',
  BOOK = 'book',
  NOTE = 'note',
  REPORT = 'report',
  MANUAL = 'manual',
  DIARY = 'diary',
}

export interface Document {
  id: string
  title: string
  type: DocumentType
  content: string
  contentPages?: DocumentPage[]
  author?: string
  date?: string
  location?: string
  unlockCondition?: Condition
  isCollected: boolean
  icon?: string
  description?: string
  relatedEvents?: string[]
  relatedItems?: string[]
  revealsSecret?: boolean
  secretId?: string
}

export interface DocumentPage {
  pageNumber: number
  content: string
  image?: string
  condition?: Condition
}

export interface DocumentCollection {
  documents: Document[]
  collectedIds: string[]
  totalCount: number
  collectedCount: number
}

export interface DocumentState {
  collectedDocuments: string[]
  readDocuments: string[]
  currentDocumentId?: string
}

export interface Secret {
  id: string
  name: string
  description: string
  isDiscovered: boolean
  requiredDocuments?: string[]
  relatedEndingId?: string
}