export default function PublishBadge({ isPublished, deletedAt }: { isPublished: boolean; deletedAt?: string | null }) {
  if (deletedAt) return <span className="badge bg-red-100 text-red-700">Deleted</span>;
  return isPublished ? (
    <span className="badge bg-brand-100 text-brand-700">Published</span>
  ) : (
    <span className="badge bg-amber-100 text-amber-700">Draft</span>
  );
}
