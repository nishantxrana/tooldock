import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CsvDropzoneProps {
  onFile: (text: string, filename: string) => void;
}

/** Drag-and-drop / click-to-upload zone for a CSV file, with paste fallback. */
export function CsvDropzone({ onFile }: CsvDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setTypeError(true);
      return;
    }
    setTypeError(false);
    const reader = new FileReader();
    reader.onload = () => onFile(String(reader.result ?? ''), file.name);
    reader.readAsText(file);
  };

  const submitPaste = () => {
    if (pasteText.trim()) {
      onFile(pasteText, 'pasted.csv');
    }
  };

  if (pasteMode) {
    return (
      <div className="space-y-2">
        <textarea
          autoFocus
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'Key,Value\nNODE_ENV,production\nAPI_URL,https://…'}
          className="h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={submitPaste}
            disabled={!pasteText.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Use this CSV
          </button>
          <button
            onClick={() => {
              setPasteMode(false);
              setPasteText('');
            }}
            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
          setTypeError(false);
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
          typeError && 'border-destructive/50 bg-destructive/5',
        )}
      >
        <FileUp
          className={cn('h-8 w-8', typeError ? 'text-destructive' : 'text-muted-foreground')}
        />
        {typeError ? (
          <>
            <p className="text-sm font-medium text-destructive">Only .csv files are supported</p>
            <p className="text-xs text-muted-foreground">
              Drop a .csv file, or click to browse again
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Format: <code className="font-mono">Key,Value</code> (a header row is optional)
            </p>
          </>
        )}
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
      <p className="text-center text-xs text-muted-foreground">
        or{' '}
        <button
          onClick={() => setPasteMode(true)}
          className="text-primary underline-offset-2 hover:underline"
        >
          paste CSV text directly
        </button>
      </p>
    </div>
  );
}
