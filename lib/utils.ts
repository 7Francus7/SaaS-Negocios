/**
 * Utility to safe-serialize Prisma objects for Next.js Server Actions.
 * Handles Decimals (converts to Number) and ensures plain JS objects.
 */
export function safeSerialize<T>(data: T): T {
       if (data === null || data === undefined) return data;

       return JSON.parse(JSON.stringify(data, (key, value) => {
              // Handle Prisma Decimal objects
              if (value && typeof value === 'object' && value.d && value.s && value.e) {
                     return Number(value);
              }
              // Handle other possible non-serializable objects (like potential BigInts)
              if (typeof value === 'bigint') {
                     return value.toString();
              }
              return value;
       })) as T;
}
