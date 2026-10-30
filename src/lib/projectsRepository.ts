import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, storage } from './firebase';
import type {
  DocumentContent, Project, ProjectSummary, ProjectionPoint, ProjectionStyle, SourceType, UnitKind,
} from './types';
import type { ImportedDocument } from './importDocument';

interface ProjectDocument {
  title: string;
  sourceType: SourceType;
  pageCount: number;
  contentPath: string;
  remoteCode?: string | null;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
}
interface PointDocument {
  projectId: string; position: number; label: string; unitKind: UnitKind; pageNumber: number;
  text: string; style: ProjectionStyle;
}
export interface PointInput {
  label: string; unitKind: UnitKind; pageNumber: number; text: string; style: ProjectionStyle;
}

function services() {
  if (!db || !storage) throw new Error('firebase-not-configured');
  return { db, storage };
}
function dateValue(value?: { toDate: () => Date }): string {
  return value?.toDate().toISOString() ?? new Date().toISOString();
}
function toSummary(id: string, data: ProjectDocument): ProjectSummary {
  return {
    id, title: data.title, sourceType: data.sourceType, pageCount: data.pageCount,
    createdAt: dateValue(data.createdAt), updatedAt: dateValue(data.updatedAt),
  };
}
function isDocumentContent(value: unknown): value is DocumentContent {
  return typeof value === 'object' && value !== null && Array.isArray((value as DocumentContent).pages);
}
function toPoint(id: string, data: PointDocument): ProjectionPoint {
  return { id, projectId: data.projectId, position: data.position, label: data.label,
    unitKind: data.unitKind, pageNumber: data.pageNumber, text: data.text, style: data.style };
}
function projectRef(projectId: string) { return doc(services().db, 'projects', projectId); }
function pointsRef(projectId: string) { return collection(services().db, 'projects', projectId, 'points'); }

export async function listProjects(): Promise<ProjectSummary[]> {
  const { db } = services();
  const result = await getDocs(query(collection(db, 'projects'), orderBy('updatedAt', 'desc')));
  return result.docs.map((item) => toSummary(item.id, item.data() as ProjectDocument));
}

export async function getProject(id: string): Promise<Project | null> {
  const snapshot = await getDoc(projectRef(id));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as ProjectDocument;
  const url = await getDownloadURL(ref(services().storage, data.contentPath));
  const response = await fetch(url);
  if (!response.ok) throw new Error('content-download-failed');
  const content: unknown = await response.json();
  if (!isDocumentContent(content)) throw new Error('invalid-content');
  return { ...toSummary(snapshot.id, data), content };
}

export async function listRemoteProjects(remoteCode: string): Promise<ProjectSummary[]> {
  const { db } = services();
  const result = await getDocs(query(collection(db, 'projects'), where('remoteCode', '==', remoteCode), orderBy('createdAt', 'desc')));
  return result.docs.slice(0, 20).map((item) => toSummary(item.id, item.data() as ProjectDocument));
}

export async function createProject(imported: ImportedDocument, remoteCode?: string): Promise<ProjectSummary> {
  const { db, storage } = services();
  const projectCollection = collection(db, 'projects');
  const projectDocument = doc(projectCollection);
  const contentPath = `projects/${projectDocument.id}/content.json`;
  await setDoc(projectDocument, {
    title: imported.title, sourceType: imported.sourceType, pageCount: imported.content.pages.length,
    contentPath, remoteCode: remoteCode ?? null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  try {
    await uploadString(ref(storage, contentPath), JSON.stringify(imported.content), 'raw', { contentType: 'application/json' });
    const saved = await getDoc(projectDocument);
    return toSummary(saved.id, saved.data() as ProjectDocument);
  } catch (error) {
    await deleteDoc(projectDocument).catch(() => undefined);
    await deleteObject(ref(storage, contentPath)).catch(() => undefined);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  const { db, storage } = services();
  const points = await getDocs(pointsRef(id));
  await Promise.all(points.docs.map((point) => deleteDoc(point.ref)));
  const snapshot = await getDoc(projectRef(id));
  if (snapshot.exists()) {
    const data = snapshot.data() as ProjectDocument;
    await deleteObject(ref(storage, data.contentPath)).catch(() => undefined);
  }
  await deleteDoc(projectRef(id));
}

export async function listPoints(projectId: string): Promise<ProjectionPoint[]> {
  const result = await getDocs(query(pointsRef(projectId), orderBy('position', 'asc')));
  return result.docs.map((item) => toPoint(item.id, item.data() as PointDocument));
}
export async function createPoint(projectId: string, position: number, input: PointInput): Promise<ProjectionPoint> {
  const data: PointDocument = { projectId, position, label: input.label, unitKind: input.unitKind,
    pageNumber: input.pageNumber, text: input.text, style: input.style };
  const result = await addDoc(pointsRef(projectId), data);
  return toPoint(result.id, data);
}
export async function updatePoint(id: string, input: PointInput, projectId: string): Promise<void> {
  await updateDoc(doc(pointsRef(projectId), id), { label: input.label, unitKind: input.unitKind,
    pageNumber: input.pageNumber, text: input.text, style: input.style });
}
export async function setPointPosition(id: string, position: number, projectId: string): Promise<void> {
  await updateDoc(doc(pointsRef(projectId), id), { position });
}
export async function deletePoint(id: string, projectId: string): Promise<void> {
  await deleteDoc(doc(pointsRef(projectId), id));
}
