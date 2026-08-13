import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import TextField from '../fields/TextField';
import NumberField from '../fields/NumberField';
import Toggle from '../fields/Toggle';
import LocalizedInput from '../fields/LocalizedInput';
import RelationSelect from '../fields/RelationSelect';
import type { RelationOption } from '../../lib/useRelationOptions';

interface VerseCommonFieldsProps {
  register: UseFormRegister<any>;
  // See Toggle.tsx — Control<any> doesn't structurally accept concrete Control<T>.
  control: any;
  errors: FieldErrors;
  audioOptions: RelationOption[];
  audioLoading: boolean;
}

/** Shared by the Tawaf-dua and Sa'i-dua forms — everything except the round/leg identifier. */
export default function VerseCommonFields({ register, control, errors, audioOptions, audioLoading }: VerseCommonFieldsProps) {
  return (
    <>
      <LocalizedInput label="Label" name="label" register={register} errors={errors} required={false} />
      <TextField label="Arabic text" name="arabicText" register={register} error={errors.arabicText as any} dir="rtl" textarea />
      <LocalizedInput label="Transliteration" name="transliteration" register={register} errors={errors} required={false} />
      <LocalizedInput label="Meaning" name="meaning" register={register} errors={errors} textarea required={false} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RelationSelect label="Audio" name="audioId" control={control} options={audioOptions} loading={audioLoading} />
        <NumberField label="Order" name="order" register={register} />
      </div>

      <Toggle label="Published" name="isPublished" control={control} />
    </>
  );
}
