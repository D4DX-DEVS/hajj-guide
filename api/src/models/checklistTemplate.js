import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

/**
 * One document per category. `items[].key` is the stable identifier that
 * `userChecklist.checkedKeys` references — renaming a key silently unticks the
 * item for every pilgrim, so the admin panel warns before allowing it.
 */
const itemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: localized(true), required: true },
    note: { type: localized(false) },
    iconEmoji: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const schema = contentSchema({
  categoryKey: { type: String, required: true, trim: true },
  name: { type: localized(true), required: true },
  iconEmoji: { type: String, trim: true },
  items: { type: [itemSchema], default: [] },
});

schema.index({ categoryKey: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

schema.pre('validate', function validateUniqueKeys(next) {
  const keys = this.items.map((i) => i.key);
  if (new Set(keys).size !== keys.length) {
    return next(new Error('Checklist item keys must be unique within a category'));
  }
  return next();
});

export const ChecklistTemplate = mongoose.model('ChecklistTemplate', schema);
export default ChecklistTemplate;
