import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import isEmail from 'validator/es/lib/isEmail';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast, errorMessage } from '../../lib/toast';
import { useAuth } from '../../lib/auth';
import type { AdminUser } from '../../lib/types';
import Spinner from '../../components/Spinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import TextField from '../../components/fields/TextField';
import SelectField from '../../components/fields/SelectField';

const createSchema = z
  .object({
    email: z.string().refine((v) => isEmail(v), 'Enter a valid email address'),
    name: z.string().trim().min(2),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['superadmin', 'editor']),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const editSchema = z.object({
  name: z.string().trim().min(2),
  role: z.enum(['superadmin', 'editor']),
  password: z.string().min(6, 'At least 6 characters'),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

function AdminModal({ admin, onClose }: { admin: AdminUser | null; onClose: () => void }) {
  const isNew = !admin;
  const queryClient = useQueryClient();
  const { push } = useToast();

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: '', name: '', password: '', confirmPassword: '', role: 'editor' },
  });
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: admin?.name || '', role: admin?.role || 'editor', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateValues | EditValues) => {
      if (isNew) {
        const { confirmPassword, ...rest } = values as CreateValues;
        return api.post('/api/admin/admins', rest);
      }
      return api.patch(`/api/admin/admins/${admin!.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      push(isNew ? 'Admin created' : 'Admin updated');
      onClose();
    },
    onError: (err) => push(errorMessage(err), 'error'),
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-5 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">{isNew ? 'New Admin' : `Edit ${admin.name}`}</h3>

        {isNew ? (
          <form onSubmit={createForm.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
            <TextField label="Email" name="email" register={createForm.register} error={createForm.formState.errors.email} />
            <TextField label="Name" name="name" register={createForm.register} error={createForm.formState.errors.name} />
            <TextField
              label="Password"
              name="password"
              register={createForm.register}
              error={createForm.formState.errors.password}
            />
            <TextField
              label="Confirm password"
              name="confirmPassword"
              register={createForm.register}
              error={createForm.formState.errors.confirmPassword}
            />
            <SelectField
              label="Role"
              name="role"
              register={createForm.register}
              options={[
                { value: 'editor', label: 'Editor' },
                { value: 'superadmin', label: 'Superadmin' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={editForm.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
            <TextField label="Name" name="name" register={editForm.register} error={editForm.formState.errors.name} />
            <SelectField
              label="Role"
              name="role"
              register={editForm.register}
              options={[
                { value: 'editor', label: 'Editor' },
                { value: 'superadmin', label: 'Superadmin' },
              ]}
            />
            <TextField
              label="New password"
              name="password"
              register={editForm.register}
              error={editForm.formState.errors.password}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminsPage() {
  const { admin: me } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [modalAdmin, setModalAdmin] = useState<AdminUser | 'new' | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminUser | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const query = useQuery({
    queryKey: ['admins'],
    queryFn: async () => (await api.get<AdminUser[]>('/api/admin/admins')).data,
  });

  const deactivateMutation = useMutation({
    mutationFn: (a: AdminUser) => api.delete(`/api/admin/admins/${a.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      push('Admin deactivated');
      setPendingDeactivate(null);
    },
    onError: (err) => {
      push(errorMessage(err), 'error');
      setPendingDeactivate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (a: AdminUser) => api.delete(`/api/admin/admins/${a.id}`, { hard: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      push('Admin deleted');
      setPendingDelete(null);
    },
    onError: (err) => {
      push(errorMessage(err), 'error');
      setPendingDelete(null);
    },
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Admins</h1>
        <button className="btn-primary" onClick={() => setModalAdmin('new')}>
          + New Admin
        </button>
      </div>

      <div className="card overflow-hidden">
        {query.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
              <tr>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {query.data?.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {a.name} {a.id === me?.id && <span className="text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{a.email}</td>
                  <td className="px-3 py-2.5">
                    <span className="badge bg-slate-100 text-slate-600">{a.role}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {a.isActive ? (
                      <span className="badge bg-brand-100 text-brand-700">Active</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-ghost" onClick={() => setModalAdmin(a)}>
                        Edit
                      </button>
                      {a.isActive && a.id !== me?.id && (
                        <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setPendingDeactivate(a)}>
                          Deactivate
                        </button>
                      )}
                      {a.id !== me?.id && (
                        <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setPendingDelete(a)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modalAdmin && (
        <AdminModal admin={modalAdmin === 'new' ? null : modalAdmin} onClose={() => setModalAdmin(null)} />
      )}

      <ConfirmDialog
        open={Boolean(pendingDeactivate)}
        title={`Deactivate ${pendingDeactivate?.name}?`}
        description="They will no longer be able to sign in to the admin panel."
        confirmLabel="Deactivate"
        danger
        onConfirm={() => deactivateMutation.mutate(pendingDeactivate!)}
        onCancel={() => setPendingDeactivate(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name}?`}
        description="This permanently removes their credentials. This cannot be undone."
        confirmLabel="Delete forever"
        danger
        onConfirm={() => deleteMutation.mutate(pendingDelete!)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
