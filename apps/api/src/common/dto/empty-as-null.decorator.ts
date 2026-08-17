import { ValidateIf } from 'class-validator';

export function VacioComoNulo() {
  return ValidateIf((_obj, value) => value !== '' && value !== null);
}
