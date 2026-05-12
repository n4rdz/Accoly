# Accoly - PDF Annotation Tool

A complete, production-ready PDF annotation tool built as a single HTML file using pure HTML, CSS, and Vanilla JavaScript with PDF.js.

## Features

### 🎨 Professional Dark UI
- Minimalist dark theme with subtle shadows and smooth transitions
- Top toolbar with all tools and controls
- Left sidebar with page thumbnails for navigation
- Main canvas area with responsive layout
- Status bar showing current page and file info

### ✏️ Annotation Tools

#### **Pen Tool (P)**
- 100% opacity, sharp smooth strokes
- 2px default width
- Clean ballpoint pen feel
- Adjustable stroke width and color

#### **Pencil Tool (C)**
- ~70% opacity for semi-transparent strokes
- Grainy/rough texture with subtle random offsets
- ~3px width for sketchy, hand-drawn appearance
- Adjustable width and color

#### **Highlighter (H)**
- ~40% opacity, wide flat strokes (18-24px)
- Multiply blend mode for realistic highlighting
- Default yellow color (customizable)
- Perfect for marking important text

#### **Eraser (E)**
- **Pixel Mode** (default): Drag to erase pixels under cursor
- **Stroke Mode**: Click to delete entire strokes
- Toggle between modes with the pill switch
- Adjustable eraser size via stroke width control

#### **Sticky Notes (S)**
- Click canvas to place draggable yellow notes
- Contenteditable text area
- Drag to reposition
- Delete button (✕)
- Saves with annotations

#### **Textbox Tool (T)**
- Click to create editable text boxes
- Double-click to edit text
- Drag to move, resize with corner/edge handles
- Full formatting toolbar:
  - Font family selection
  - Font size adjustment (8-72px)
  - Bold, Italic, Underline toggles
  - Text color picker

### 📦 Advanced Features

#### **Coordinate System**
- Uses normalized (0-1) coordinates for pixel-perfect positioning
- Automatically handles zoom, scroll, and window resize
- Consistent positioning across save/restore cycles
- No offset issues regardless of DPI or zoom level

#### **Undo/Redo**
- Full history stack (Ctrl+Z, Ctrl+Y or buttons)
- Works with all annotation types
- Keyboard shortcuts supported

#### **Save & Restore**
- Auto-saves to localStorage every 500ms after changes
- Saves keyed by PDF filename
- Restore all annotations on reopening same PDF
- Manual save button for explicit saves

#### **Export/Import**
- Export all annotations as JSON
- Import annotations from JSON
- Preserves all formatting and positioning
- Share annotations between files

#### **Zoom Controls**
- Zoom in/out with +/- buttons
- Fit page to window with "Fit" button
- Zoom display showing current percentage
- Keyboard shortcuts: Scroll to zoom

#### **Page Navigation**
- Click thumbnails in left sidebar to navigate
- Page info display in status bar
- Supports multi-page PDFs

## Usage

### Opening a PDF
1. Click the **📂 Open** button
2. Select a PDF file from your computer
3. Annotations automatically load if previously saved

### Drawing Annotations
1. Select a tool from the toolbar (Pen, Pencil, Highlighter, Eraser)
2. Choose stroke width and color
3. Draw on the canvas
4. Use Undo/Redo as needed

### Creating Textboxes
1. Click the **📝 Text** button
2. Click on the canvas where you want the textbox
3. Single-click to select, double-click to edit
4. Use the formatting toolbar to style text:
   - Font family
   - Font size
   - Bold, Italic, Underline
   - Text color
5. Drag to move, resize with handles

### Erasing
- **Pixel Mode**: Select eraser, drag to erase pixels
- **Stroke Mode**: Select eraser, click stroke to delete entire line
- Toggle modes with the pill switch

### Sticky Notes
1. Click the **📌 Note** button
2. Click anywhere on the canvas
3. Type in the yellow note
4. Drag to move
5. Click ✕ to delete

### Keyboard Shortcuts
- **P** - Pen tool
- **C** - Pencil tool
- **H** - Highlighter
- **E** - Eraser
- **T** - Textbox
- **S** - Sticky note
- **Ctrl+Z** / **Cmd+Z** - Undo
- **Ctrl+Y** / **Cmd+Y** - Redo

## File Structure

The tool is a **single HTML file** with:
- Pure HTML structure
- CSS styling (no external stylesheets)
- Vanilla JavaScript (no frameworks)
- PDF.js CDN for PDF rendering

## Data Storage

### localStorage
- Key format: `accoly_[pdf-filename]`
- Stores: All annotations with normalized coordinates
- Automatically saves after changes

### Export Format
```json
{
  "pdfName": "document.pdf",
  "totalPages": 42,
  "exportedAt": "2026-05-11T10:30:00.000Z",
  "annotations": {
    "1": {
      "strokes": [...],
      "textboxes": [...],
      "stickyNotes": [...]
    }
  }
}
```

## Textbox Data Structure

```json
{
  "id": "uuid",
  "page": 1,
  "x": 0.25,
  "y": 0.40,
  "width": 0.30,
  "height": 0.08,
  "text": "Hello",
  "color": "#000000",
  "fontSize": 14,
  "fontFamily": "Helvetica",
  "bold": false,
  "italic": false,
  "underline": false,
  "rotation": 0,
  "createdAt": "2026-05-11T10:30:00.000Z"
}
```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Only redraws affected regions when possible
- Debounced saving (500ms)
- Virtualized page rendering (visible pages only)
- No flicker or lag during typing/zooming
- Touch event support for tablets

## Tips & Tricks

1. **Precise Textbox Placement**: Zoom to 100% for pixel-perfect textbox placement
2. **Large Highlights**: Use highlighter with increased stroke width for large areas
3. **Batch Editing**: Select eraser stroke mode to remove multiple strokes quickly
4. **Backup Annotations**: Export to JSON as backup before making major changes
5. **Dark Environment**: Perfect for low-light reading and annotation sessions

## Troubleshooting

### Annotations Not Saving?
- Check browser's localStorage is enabled
- Ensure you have storage space available
- Use Export to save as JSON backup

### Textbox Text Overlapping?
- Increase textbox height using corner handles
- Use smaller font size if needed
- Wrap text by narrowing textbox width

### PDF Not Loading?
- Ensure it's a valid PDF file
- Try opening a different PDF
- Check browser console for errors

### Zoom Issues?
- Use "Fit" button to reset zoom
- Zoom percentage shown in toolbar
- Annotations positioned correctly at any zoom level

## License

Free to use, modify, and distribute.
