const fs = require('fs');
const file = 'app/dashboard/customers/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'const totalDebt = (customer.closedBalance || 0) + (customer.currentBalance || 0);',
    'const totalPrev = startBalance !== undefined ? startBalance : (customer.closedBalance || 0);\n               const totalCurrent = startBalance !== undefined ? movements.reduce((s:number,m:any)=>s+m.amount,0) : (customer.currentBalance || 0);\n               const totalDebt = totalPrev + totalCurrent;'
);
content = content.replace(
    /drawSummaryCard\(PAD, 'MESES ANTERIORES', fmtCurrency\(customer\.closedBalance \|\| 0\)/,
    "drawSummaryCard(PAD, 'MESES ANTERIORES', fmtCurrency(totalPrev)"
);
content = content.replace(
    /drawSummaryCard\(PAD \+ cardW \+ 6, 'DEUDA DEL MES', fmtCurrency\(customer\.currentBalance \|\| 0\)/,
    "drawSummaryCard(PAD + cardW + 6, 'DEUDA DEL MES', fmtCurrency(totalCurrent)"
);
content = content.replace(
    /let runningBalance = 0;/,
    "let runningBalance = startBalance !== undefined ? startBalance : 0;"
);

content = content.replace(
    '// Start from 0 because MONTH_CLOSE movements already carry over',
    '// Start from startBalance so we compute running logic perfectly bounds to the pdf view'
);
content = content.replace(
    "// the old balance. Starting from closedBalance would double-count.",
    ""
);

fs.writeFileSync(file, content, 'utf8');
console.log('Modifications applied via script.');
