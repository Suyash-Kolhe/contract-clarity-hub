import { useCallback, useSyncExternalStore } from "react";

import type { DocumentAnalysis } from "./analysis.functions";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type StoredDoc = {
  id: string;
  fileName: string;
  kind: "pdf" | "docx";
  text: string;
  charCount: number;
  createdAt: number;
  status: "analyzing" | "ready" | "error";
  error?: string;
  analysis?: DocumentAnalysis;
  chat: ChatMessage[];
  checkedQuestions: string[];
};

const KEY = "counsel.docs.v1";

let docs: StoredDoc[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) docs = JSON.parse(raw) as StoredDoc[];
  } catch {
    docs = [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {
    /* quota — keep in memory */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return docs;
}

const EMPTY: StoredDoc[] = [];
function getServerSnapshot() {
  return EMPTY;
}

export function useDocs() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDoc(id: string | undefined) {
  const all = useDocs();
  return id ? all.find((d) => d.id === id) : undefined;
}

export function useDocActions() {
  return {
    addDoc: useCallback(addDoc, []),
    updateDoc: useCallback(updateDoc, []),
    removeDoc: useCallback(removeDoc, []),
  };
}

export function addDoc(doc: StoredDoc) {
  load();
  docs = [doc, ...docs];
  emit();
  return doc;
}

export function updateDoc(id: string, patch: Partial<StoredDoc>) {
  load();
  docs = docs.map((d) => (d.id === id ? { ...d, ...patch } : d));
  emit();
}

export function removeDoc(id: string) {
  load();
  docs = docs.filter((d) => d.id !== id);
  emit();
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
