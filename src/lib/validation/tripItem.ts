/**
 * Trip item (plan) form schema (#34). Shared by the add and edit screens.
 * Error messages are translation keys; the form translates them with t().
 */
import { z } from 'zod';
import { combineDayAndTime, formatTime } from '@/lib/date';

/** Must match the CHECK constraint on trip_items.type. */
export const ITEM_TYPES = [
  'place',
  'restaurant',
  'accommodation',
  'transport',
  'flight',
  'train',
  'bus',
  'car',
  'activity',
  'note',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** '' → null; accepts "12,50" or "12.50". NaN for anything else. */
export function parseCost(cost: string): number | null {
  const trimmed = cost.trim();
  if (!trimmed) return null;
  return /^\d+([.,]\d{1,2})?$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : NaN;
}

export const tripItemFormSchema = z
  .object({
    type: z.enum(ITEM_TYPES),
    title: z.string().trim().min(2, 'item.titleTooShort').max(120, 'item.titleTooShort'),
    notes: z.string().trim(),
    cost: z.string().refine((v) => !Number.isNaN(parseCost(v)), 'item.negativeCost'),
    currency: z.string().nullable(),
    startTime: z.string().regex(TIME_REGEX, 'item.invalidTime').nullable(),
    endTime: z.string().regex(TIME_REGEX, 'item.invalidTime').nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    // Set when the location came from a place search (#14); stored in details.place
    placeName: z.string().nullable(),
    placeAddress: z.string().nullable(),
  })
  .superRefine((v, ctx) => {
    const cost = parseCost(v.cost);
    if (cost !== null && cost > 0 && !v.currency) {
      ctx.addIssue({ code: 'custom', path: ['currency'], message: 'item.currencyRequired' });
    }
    if (v.endTime && !v.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'item.endTimeRequiresStart' });
    }
    // `HH:mm` strings compare correctly as text
    if (v.startTime && v.endTime && v.endTime < v.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'item.endTimeBeforeStart' });
    }
  });

export type TripItemFormValues = z.input<typeof tripItemFormSchema>;
export type TripItemFormOutput = z.output<typeof tripItemFormSchema>;

export const emptyTripItemForm: TripItemFormValues = {
  type: 'place',
  title: '',
  notes: '',
  cost: '',
  currency: null,
  startTime: null,
  endTime: null,
  latitude: null,
  longitude: null,
  placeName: null,
  placeAddress: null,
};

interface TripItemRowLike {
  type: string;
  title: string;
  notes: string | null;
  cost: number | null;
  currency: string | null;
  start_at: string | null;
  end_at: string | null;
  latitude: number | null;
  longitude: number | null;
  details: unknown;
}

/** `trip_items.details.place` written by the place search. */
export function readPlace(details: unknown): { name: string; address: string | null } | null {
  if (!details || typeof details !== "object") return null;
  const place = (details as { place?: { name?: unknown; address?: unknown } }).place;
  if (!place || typeof place.name !== "string") return null;
  return { name: place.name, address: typeof place.address === "string" ? place.address : null };
}

/** Database row → form values (for the edit screen). */
export function tripItemRowToForm(row: TripItemRowLike): TripItemFormValues {
  return {
    type: (ITEM_TYPES as readonly string[]).includes(row.type) ? (row.type as ItemType) : 'place',
    title: row.title,
    notes: row.notes ?? '',
    cost: row.cost !== null ? String(row.cost) : '',
    currency: row.currency,
    startTime: formatTime(row.start_at) || null,
    endTime: formatTime(row.end_at) || null,
    latitude: row.latitude,
    longitude: row.longitude,
    placeName: readPlace(row.details)?.name ?? null,
    placeAddress: readPlace(row.details)?.address ?? null,
  };
}

/** Validated form values + the day's date → `trip_items` columns. */
export function toTripItemColumns(values: TripItemFormOutput, dayDate: string) {
  const cost = parseCost(values.cost);
  return {
    type: values.type,
    title: values.title,
    notes: values.notes || null,
    cost,
    // A currency only makes sense with a positive amount
    currency: cost !== null && cost > 0 ? values.currency : null,
    start_at: values.startTime ? combineDayAndTime(dayDate, values.startTime) : null,
    end_at: values.endTime ? combineDayAndTime(dayDate, values.endTime) : null,
    latitude: values.latitude,
    longitude: values.longitude,
    details: values.placeName ? { place: { name: values.placeName, address: values.placeAddress } } : {},
  };
}
