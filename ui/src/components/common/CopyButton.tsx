import { Check, Copy } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useClipboard } from '@/lib/hooks/useClipboard';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children' | 'value'> {
  /** Text to copy, or a getter for lazy evaluation. */
  value: string | (() => string);
  label?: string;
  /** Hide the text label, show only the icon. */
  iconOnly?: boolean;
}

/** A button that copies text to the clipboard with success feedback. */
export function CopyButton({
  value,
  label = 'Copy',
  iconOnly = false,
  variant = 'outline',
  size,
  className,
  ...props
}: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  const handleCopy = async () => {
    const text = typeof value === 'function' ? value() : value;
    const ok = await copy(text);
    if (ok) toast.success('Copied to clipboard');
    else toast.error('Could not copy to clipboard');
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (iconOnly ? 'icon' : 'sm')}
      onClick={handleCopy}
      className={cn(className)}
      {...props}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {!iconOnly && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}
