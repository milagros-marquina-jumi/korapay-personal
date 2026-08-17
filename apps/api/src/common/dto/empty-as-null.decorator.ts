import { Transform } from 'class-transformer';

export function VacioComoNulo() {
  return Transform(({ value }) => (value === '' || value === null ? undefined : value));
}
