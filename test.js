// Quick check of the 3 twist tests. Run the server first (npm start), then: npm test
const base = process.env.BASE || 'http://localhost:3000';

async function call(method, path) {
  const res = await fetch(base + path, { method });
  return { status: res.status, body: await res.json() };
}

(async () => {
  let failed = 0;
  const check = (name, got, want) => {
    const ok = got === want;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${got}, expected ${want})`);
  };

  const t1 = await call('POST', '/bookings/1/return');
  check('Test 1: return a booking', t1.status, 200);

  const t2 = await call('POST', '/bookings/1/return');
  check('Test 2: return it again', t2.status, 409);
  check('Test 2: message', t2.body.error, 'Already returned');

  const t3 = await call('GET', '/students/1/history');
  check('Test 3: GET /students/1/history', t3.status, 200);
  check('Test 3: booking 1 is listed', Array.isArray(t3.body) && t3.body.some((b) => b.id === 1), true);

  process.exit(failed ? 1 : 0);
})();
