import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

const schema = contentSchema({
  title: { type: localized(true), required: true },
  description: { type: localized(false) },
});

export const Faq = mongoose.model('Faq', schema);
export default Faq;
