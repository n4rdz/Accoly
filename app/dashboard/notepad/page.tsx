'use client';

import DrawingCanvas from '@/components/DrawingCanvas';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotepadPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Digital Notepad</h1>
          <p className="text-muted-foreground mt-2">Premium drawing & note-taking experience</p>
        </div>
      </div>

      {/* Main Canvas */}
      <DrawingCanvas />

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-blue-900 mb-2 text-sm">Pencil & Pen Tools</p>
          <p className="text-blue-800 text-xs">Choose between pencil (soft) and pen (sharp) tools. Adjust thickness from 1-20px.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-semibold text-amber-900 mb-2 text-sm">Highlighter & Colors</p>
          <p className="text-amber-800 text-xs">Use the highlighter with transparency. Switch between black, red, blue, and yellow colors.</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-semibold text-green-900 mb-2 text-sm">Export & Multi-Page</p>
          <p className="text-green-800 text-xs">Create multiple pages, use undo/redo, zoom in/out, and export pages as PNG images.</p>
        </div>
      </div>
    </div>
  );
}
