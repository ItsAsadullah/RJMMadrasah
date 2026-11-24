import { dhakaDate } from './dhakaDate';
it('changes dates at Bangladesh midnight, irrespective of server timezone', () => {
  expect(dhakaDate(new Date('2026-10-23T17:59:59Z'))).toBe('2026-10-23');
  expect(dhakaDate(new Date('2026-10-23T18:00:00Z'))).toBe('2026-10-24');
});
