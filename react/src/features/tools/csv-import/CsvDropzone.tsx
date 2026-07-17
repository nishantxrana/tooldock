import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CsvDropzoneProps {
  onFile: (text: string, filename: string) => void;
}

/** Drag-and-drop / click-to-upload zone for a CSV file. */
export function CsvDropzone({ onFile }: CsvDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onFile(String(reader.result ?? ''), file.name);
    reader.readAsText(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
        dragging ? 'border-primary bg-accent' : 'border-border hover:border-primary/50',
      )}
    >
      <FileUp className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
      <p className="text-xs text-muted-foreground">
        Format: <code className="font-mono">Key,Value</code> (a header row is optional)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
