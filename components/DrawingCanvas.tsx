'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Pencil,
  Pen,
  Highlighter,
  Eraser,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Download,
  Type,
  Minus as MinusIcon,
  Square,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DrawingPoint {
  x: number;
  y: number;
}

interface CanvasState {
  tool: 'pencil' | 'pen' | 'highlighter' | 'eraser' | 'text';
  color: string;
  thickness: number;
  zoom: number;
  currentPage: number;
}

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CanvasState>({
    tool: 'pencil',
    color: '#000000',
    thickness: 2,
    zoom: 1,
    currentPage: 1,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [pages, setPages] = useState<string[]>(['']);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<DrawingPoint | null>(null);

  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const lastPoint = useRef<DrawingPoint>({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.current = canvas.getContext('2d');
    if (!ctx.current) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set background
    ctx.current.fillStyle = '#ffffff';
    ctx.current.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveHistory();
  }, []);

  // Save canvas state to history
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    const imageData = ctx.current.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyStep + 1), imageData]);
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyStep > 0 && history[historyStep - 1]) {
      const canvas = canvasRef.current;
      if (!canvas || !ctx.current) return;

      setHistoryStep((prev) => prev - 1);
      ctx.current.putImageData(history[historyStep - 1], 0, 0);
    }
  }, [history, historyStep]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1 && history[historyStep + 1]) {
      const canvas = canvasRef.current;
      if (!canvas || !ctx.current) return;

      setHistoryStep((prev) => prev + 1);
      ctx.current.putImageData(history[historyStep + 1], 0, 0);
    }
  }, [history, historyStep]);

  // Get brush settings
  const getBrushSettings = () => {
    const thickness = state.thickness;
    let color = state.color;

    if (state.tool === 'highlighter') {
      color = state.color === '#FFFF00' ? 'rgba(255, 255, 0, 0.3)' : 'rgba(100, 150, 255, 0.3)';
    }

    return { color, thickness, lineCap: 'round', lineJoin: 'round' };
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.zoom;
    const y = (e.clientY - rect.top) / state.zoom;

    if (state.tool === 'text') {
      setTextPos({ x, y });
      return;
    }

    setIsDrawing(true);
    lastPoint.current = { x, y };
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current || !isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.zoom;
    const y = (e.clientY - rect.top) / state.zoom;

    const brush = getBrushSettings();
    ctx.current.strokeStyle = brush.color;
    ctx.current.lineWidth = brush.thickness;
    ctx.current.lineCap = 'round';
    ctx.current.lineJoin = 'round';

    if (state.tool === 'eraser') {
      ctx.current.clearRect(x - brush.thickness / 2, y - brush.thickness / 2, brush.thickness, brush.thickness);
    } else {
      ctx.current.beginPath();
      ctx.current.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.current.lineTo(x, y);
      ctx.current.stroke();
    }

    lastPoint.current = { x, y };
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  // Handle text input
  const handleAddText = () => {
    if (!textPos || !ctx.current || !textInput.trim()) return;

    ctx.current.fillStyle = state.color;
    ctx.current.font = '16px Poppins, sans-serif';
    ctx.current.fillText(textInput, textPos.x, textPos.y);

    setTextInput('');
    setTextPos(null);
    saveHistory();
  };

  // Add new page
  const handleAddPage = () => {
    setPages((prev) => [...prev, '']);
    setState((prev) => ({ ...prev, currentPage: pages.length + 1 }));
  };

  // Export canvas
  const handleExport = (format: 'png' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `accountify-notes-page-${state.currentPage}.png`;
      link.click();
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    ctx.current.fillStyle = '#ffffff';
    ctx.current.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 p-3 flex-wrap">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 border-r border-border pr-3">
            {[
              { id: 'pencil', icon: Pencil, label: 'Pencil', color: '#000000' },
              { id: 'pen', icon: Pen, label: 'Pen', color: '#000000' },
              { id: 'highlighter', icon: Highlighter, label: 'Highlighter', color: '#FFFF00' },
              { id: 'eraser', icon: Eraser, label: 'Eraser' },
              { id: 'text', icon: Type, label: 'Text', color: '#000000' },
            ].map((tool) => (
              <Button
                key={tool.id}
                size="sm"
                variant={state.tool === tool.id ? 'default' : 'ghost'}
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    tool: tool.id as CanvasState['tool'],
                    color: (tool.color as string) || prev.color,
                  }));
                }}
                title={tool.label}
                className="p-2 h-auto"
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 border-r border-border pr-3 ml-3">
            {['#000000', '#FF0000', '#0066FF', '#FFFF00'].map((color) => (
              <button
                key={color}
                onClick={() => setState((prev) => ({ ...prev, color }))}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  state.color === color ? 'border-foreground ring-2 ring-offset-1 ring-primary' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Thickness */}
          <div className="flex items-center gap-2 border-r border-border pr-3 ml-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState((prev) => ({ ...prev, thickness: Math.max(1, prev.thickness - 1) }))}
              className="p-2 h-auto"
            >
              <MinusIcon className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{state.thickness}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState((prev) => ({ ...prev, thickness: Math.min(20, prev.thickness + 1) }))}
              className="p-2 h-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 border-r border-border pr-3 ml-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState((prev) => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))}
              className="p-2 h-auto"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(state.zoom * 100)}%</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState((prev) => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))}
              className="p-2 h-auto"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Edit Actions */}
          <div className="flex items-center gap-1 border-r border-border pr-3 ml-3">
            <Button size="sm" variant="ghost" onClick={handleUndo} className="p-2 h-auto" title="Undo">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRedo} className="p-2 h-auto" title="Redo">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Clear & Export */}
          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="ghost" onClick={handleClear} className="p-2 h-auto text-red-600 hover:bg-red-50">
              Clear
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleExport('png')}
              className="p-2 h-auto bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-1" />
              Export PNG
            </Button>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {state.tool === 'text' && textPos && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <p className="text-sm text-blue-900 mb-2">Enter text to add:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
              placeholder="Type your text..."
              autoFocus
              className="flex-1 px-3 py-2 border border-blue-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm" onClick={handleAddText} className="bg-primary hover:bg-primary/90">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border border-dashed border-gray-300 bg-white cursor-crosshair"
            style={{
              transform: `scale(${state.zoom})`,
              transformOrigin: 'top left',
              width: '800px',
              height: '1000px',
            }}
          />
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Page {state.currentPage} of {pages.length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleAddPage}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Page
        </Button>
      </div>
    </div>
  );
}
