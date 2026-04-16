export const RENTAL_REAL_ESTATE_SUBCATEGORIES = ['apartment-rent', 'house-rent', 'room-rent'] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateOnlyInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function calculateNights(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
}

export function overlapQuery(startDate: Date, endDate: Date) {
  return {
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
}

export function formatReservationRequestContent(input: {
  reservationId: string;
  startDate: Date;
  endDate: Date;
  nights: number;
  nightlyPrice: number;
  totalPrice: number;
}) {
  const start = input.startDate.toISOString().slice(0, 10);
  const end = input.endDate.toISOString().slice(0, 10);
  return `🏠 درخواست رزرو\nاز ${start} تا ${end}\nتعداد شب: ${input.nights}\nقیمت هر شب: €${input.nightlyPrice}\nمجموع: €${input.totalPrice}\n\n[reservation:${input.reservationId}]`;
}

export function parseReservationToken(content?: string | null): string | null {
  if (!content) return null;
  const match = content.match(/\[reservation:([a-fA-F0-9]{24})\]/);
  return match?.[1] || null;
}
