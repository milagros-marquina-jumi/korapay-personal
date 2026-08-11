import { buildContractSchedule } from '../src/modules/catalog/contract-schedule';

const canvia = buildContractSchedule({
  startDate: new Date('2022-08-29T00:00:00Z'),
  endDate: new Date('2023-03-31T00:00:00Z'),
  grossSalary: '4200',
  netSalary: '3706.92',
});
console.log(`CANVIA genera ${canvia.length} sueldos (reales en la BD: 7)`);
for (const x of canvia) {
  console.log(`  ${x.date.toISOString().slice(0, 10)}  neto=${x.amountBase}  bruto=${x.amountGross}`);
}

const abierto = buildContractSchedule({
  startDate: new Date('2026-08-01T00:00:00Z'),
  endDate: null,
  grossSalary: null,
  netSalary: '5000',
});
console.log(
  `\nsin fecha de fin: ${abierto.length} cuotas | ${abierto[0]?.date.toISOString().slice(0, 10)} -> ${abierto
    .at(-1)
    ?.date.toISOString()
    .slice(0, 10)}`,
);

const sinSalario = buildContractSchedule({
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: null,
  grossSalary: null,
  netSalary: null,
});
console.log(`\nsin salario: ${sinSalario.length} cuotas (esperado 0)`);

const diaLargo = buildContractSchedule({
  startDate: new Date('2026-01-15T00:00:00Z'),
  endDate: new Date('2026-03-31T00:00:00Z'),
  grossSalary: null,
  netSalary: '1000',
  payDay: 31,
});
console.log('\ndia de pago 31 (febrero es corto):');
for (const x of diaLargo) console.log(`  ${x.date.toISOString().slice(0, 10)}`);
