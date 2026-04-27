"use client"

import type { AxaChuteRow } from "@/lib/axa-chutes-extractor"

/**
 * Client-side persistence for AXA Chutes uploads, keyed by the saved
 * smart-list id the upload produced.
 */
export interface AxaChutesUpload {
  savedListId: string
  filename: string
  uploadedAt: string
  rows: AxaChuteRow[]
}

const KEY = "qollabi:axa-chutes"
const CHANGE_EVENT = "qollabi:axa-chutes-changed"

function read(): Record<string, AxaChutesUpload> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, AxaChutesUpload>
  } catch {
    return {}
  }
}

function write(all: Record<string, AxaChutesUpload>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function saveAxaChutesUpload(u: AxaChutesUpload) {
  const all = read()
  all[u.savedListId] = u
  write(all)
}

export function getAxaChutesUpload(savedListId: string): AxaChutesUpload | null {
  return read()[savedListId] ?? null
}
