import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Spinner from '../Spinner';

interface FormShellProps {
  title: string;
  backHref: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  loading?: boolean;
  children: ReactNode;
  extraActions?: ReactNode;
}

export default function FormShell({ title, backHref, onSubmit, submitting, loading, children, extraActions }: FormShellProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Link to={backHref} className="text-xs text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">{title}</h1>
        </div>
        {extraActions}
      </div>

      <form onSubmit={onSubmit} className="card space-y-5 p-5">
        {children}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link to={backHref} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
