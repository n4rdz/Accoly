'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Calendar,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

const SUBJECTS = [
  'Financial Accounting',
  'Cost Accounting',
  'Auditing',
  'Taxation',
  'Business Law',
  'Economics',
  'Management Services',
];

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  updated_at: string;
  color: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', subject: SUBJECTS[0], content: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('notes').insert([
        {
          user_id: user.id,
          title: newNote.title,
          subject: newNote.subject,
          content: newNote.content,
          color: 'blue',
        },
      ]);

      if (error) throw error;
      setNewNote({ title: '', subject: SUBJECTS[0], content: '' });
      setShowForm(false);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">PDF</h1>
          <p className="text-muted-foreground mt-2">Organize and study from your personal notes</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary text-white font-semibold h-11">
          <Plus className="w-5 h-5 mr-2" />
          Create New Note
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notes by title or subject..."
          className="pl-10 h-11 bg-white border-border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Subject Tabs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Subjects
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedSubject === subject
                  ? `border-primary bg-primary/10`
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-xs font-medium text-foreground truncate">{subject.split(' ')[0]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* New Note Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Create New Note</h3>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <select
                  value={newNote.subject}
                  onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground"
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Content</label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write your notes here..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground min-h-32 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary text-white"
              >
                Save Note
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          {selectedSubject ? `${selectedSubject} Notes` : 'All Notes'}
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No notes found</p>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="bg-primary/10 inline-block px-3 py-1 rounded-full text-xs font-semibold text-primary mb-3">
                  {note.subject}
                </div>
                <h4 className="font-bold text-foreground mb-4 group-hover:text-primary transition-colors text-lg line-clamp-2">
                  {note.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                  <Calendar className="w-4 h-4" />
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
                <p className="text-sm text-foreground/80 line-clamp-3 mb-4">{note.content}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 border border-primary/10">
        <h3 className="text-2xl font-bold text-foreground mb-6">Note-Taking Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-bold text-foreground mb-2">✏️ Pen & Drawing Tools</p>
            <p className="text-xs text-muted-foreground">Write, draw, and sketch directly on your notes</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-bold text-foreground mb-2">🟦 Blue Highlighter</p>
            <p className="text-xs text-muted-foreground">Highlight important concepts in blue</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-bold text-foreground mb-2">📄 Pre-made Templates</p>
            <p className="text-xs text-muted-foreground">Use structured templates for consistency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
