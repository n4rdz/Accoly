'use client';

import { useState } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Download,
  Eye,
  Folder,
  File,
  Upload,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const folders = [
  {
    id: 1,
    name: 'Accounting Standards',
    emoji: '📚',
    color: 'from-primary to-secondary',
    lightColor: 'bg-primary/10',
    count: 12,
  },
  {
    id: 2,
    name: 'Tax Laws & Regulations',
    emoji: '📋',
    color: 'from-secondary to-accent',
    lightColor: 'bg-secondary/10',
    count: 8,
  },
  {
    id: 3,
    name: 'Auditing Standards',
    emoji: '🔍',
    color: 'from-accent to-primary',
    lightColor: 'bg-accent/10',
    count: 6,
  },
  {
    id: 4,
    name: 'Reviewer & Study Materials',
    emoji: '📖',
    color: 'from-primary to-accent',
    lightColor: 'bg-primary/10',
    count: 15,
  },
  {
    id: 5,
    name: 'Lecture Notes',
    emoji: '📝',
    color: 'from-secondary to-primary',
    lightColor: 'bg-secondary/10',
    count: 10,
  },
];

const documents = [
  {
    id: 1,
    name: 'IFRS Standards Overview 2024',
    folder: 'Accounting Standards',
    size: '2.4 MB',
    date: '2024-03-15',
    icon: '📄',
    color: 'bg-blue-50',
  },
  {
    id: 2,
    name: 'Indian Income Tax Act - Updated',
    folder: 'Tax Laws & Regulations',
    size: '5.1 MB',
    date: '2024-03-12',
    icon: '📑',
    color: 'bg-green-50',
  },
  {
    id: 3,
    name: 'Auditing Standards (SA) Guide',
    folder: 'Auditing Standards',
    size: '3.8 MB',
    date: '2024-03-10',
    icon: '📋',
    color: 'bg-purple-50',
  },
  {
    id: 4,
    name: 'CA Final - Financial Reporting',
    folder: 'Reviewer & Study Materials',
    size: '4.2 MB',
    date: '2024-03-08',
    icon: '📚',
    color: 'bg-orange-50',
  },
  {
    id: 5,
    name: 'Cost Accounting - Advanced Concepts',
    folder: 'Lecture Notes',
    size: '1.9 MB',
    date: '2024-03-05',
    icon: '📄',
    color: 'bg-indigo-50',
  },
  {
    id: 6,
    name: 'Business Law Case Studies',
    folder: 'Reviewer & Study Materials',
    size: '2.7 MB',
    date: '2024-03-01',
    icon: '📖',
    color: 'bg-red-50',
  },
];

export default function StandardsLibraryPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Shared standards and study resources (this section maps to Community in the app menu).
          </p>
          <p className="text-muted-foreground mt-2">
            Access updated accounting standards, regulations, and study materials
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary text-white font-semibold h-11">
          <Upload className="w-5 h-5 mr-2" />
          Upload PDF
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search documents..."
          className="pl-10 h-11 bg-white border-border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Folders Grid */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Folders</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(selectedFolder === folder.name ? null : folder.name)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedFolder === folder.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-3xl mb-2">{folder.emoji}</div>
              <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-2">
                {folder.name}
              </h4>
              <p className="text-xs text-muted-foreground">{folder.count} documents</p>
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        onDragEnter={() => setIsDragActive(true)}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={() => setIsDragActive(false)}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-foreground font-semibold mb-2">Drop your PDFs here</p>
        <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
          Select Files
        </Button>
      </div>

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          {selectedFolder ? `${selectedFolder}` : 'All Documents'}
        </h3>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <BookMarked className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No documents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`text-3xl p-3 rounded-lg ${doc.color}`}>
                    {doc.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground mb-1">{doc.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{doc.folder}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.date).toLocaleDateString()}
                      </span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/10">
        <h3 className="text-lg font-bold text-foreground mb-4">Library Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="font-semibold text-foreground mb-2">📄 Easy Access</p>
            <p className="text-sm text-muted-foreground">
              Quickly find and access all accounting standards and regulations
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">✏️ PDF Annotations</p>
            <p className="text-sm text-muted-foreground">
              Annotate PDFs with highlights, notes, and bookmarks
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">📥 Upload & Organize</p>
            <p className="text-sm text-muted-foreground">
              Upload your own materials and organize them in folders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
