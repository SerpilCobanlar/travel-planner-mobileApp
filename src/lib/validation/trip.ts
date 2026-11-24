/**
 * Trip form schema (#34). Shared by the create and edit screens.
 * Error messages are translation keys; the form translates them with t().
 */
import { z } from 'zod';

export const tripFormSchema = z
  .object({
    title: z.string().trim().min(2, 'trip.titleTooShort').max(100, 'trip.titleTooShort'),
    description: z.string().trim(),
    // `YYYY-MM-DD` from DatePickerField, '' when not picked yet
    startDate: z.string().min(1, 'trip.invalidDate'),
    endDate: z.string().min(1, 'trip.invalidDate'),
    isPublic: z.boolean(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'trip.endDateBeforeStart',
  });

/** Raw form state (what the inputs hold). */
export type TripFormValues = z.input<typeof tripFormSchema>;
/** Validated, trimmed values. */
export type TripFormOutput = z.output<typeof tripFormSchema>;

export const emptyTripForm: TripFormValues = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  isPublic: false,
};

/** Validated form values → `trips` table columns. */
export function toTripColumns(values: TripFormOutput) {
  return {
    title: values.title,
    description: values.description || null,
    start_date: values.startDate,
    end_date: values.endDate,
    is_public: values.isPublic,
  };
}
