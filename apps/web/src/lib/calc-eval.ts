/**
 * Evalua una expresion aritmetica simple sin usar eval: recorre la cadena con un
 * parser de precedencia para que la entrada del usuario nunca se ejecute como codigo.
 */
export function evaluarExpresion(entrada: string): number | null {
  const texto = (entrada ?? '').replaceAll(',', '').replaceAll('×', '*').replaceAll('÷', '/').trim();
  if (!texto) return null;
  if (!/^[\d\s.+\-*/()%]+$/.test(texto)) return null;

  let i = 0;
  const espacios = () => {
    while (i < texto.length && texto[i] === ' ') i++;
  };

  const numero = (): number | null => {
    espacios();
    if (texto[i] === '(') {
      i++;
      const v = suma();
      espacios();
      if (texto[i] !== ')') return null;
      i++;
      return v;
    }
    if (texto[i] === '-') {
      i++;
      const v = numero();
      return v === null ? null : -v;
    }
    const inicio = i;
    while (i < texto.length && /[\d.]/.test(texto[i] as string)) i++;
    if (i === inicio) return null;
    const v = Number(texto.slice(inicio, i));
    if (!Number.isFinite(v)) return null;
    if (texto[i] === '%') {
      i++;
      return v / 100;
    }
    return v;
  };

  const producto = (): number | null => {
    let izq: number | null = numero();
    if (izq === null) return null;
    for (;;) {
      espacios();
      const op = texto[i];
      if (op !== '*' && op !== '/') return izq;
      i++;
      const der = numero();
      if (der === null || izq === null) return null;
      if (op === '*') izq *= der;
      else {
        if (der === 0) return null;
        izq /= der;
      }
    }
  };

  const suma = (): number | null => {
    let izq: number | null = producto();
    if (izq === null) return null;
    for (;;) {
      espacios();
      const op = texto[i];
      if (op !== '+' && op !== '-') return izq;
      i++;
      const marca = i;
      const der = producto();
      if (der === null || izq === null) return null;
      const esPorcentaje = texto.slice(marca, i).includes('%');
      const monto: number = esPorcentaje ? izq * der : der;
      izq = op === '+' ? izq + monto : izq - monto;
    }
  };

  const total = suma();
  espacios();
  if (i !== texto.length || total === null || !Number.isFinite(total)) return null;
  return Math.round(total * 100) / 100;
}
