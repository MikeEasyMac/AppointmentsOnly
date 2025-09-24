cat > app.js <<'EOF'
const http = require('http');
const url  = require('url');

const availableTimes = {
  Monday:    ['1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30'],
  Tuesday:   ['1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30'],
  Wednesday: ['1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30'],
  Thursday:  ['1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30'],
  Friday:    ['1:30','2:00','2:30','3:00','3:30','4:00','4:30']
};

const appointments = [];

function sendText(res, code, text) {
  res.writeHead(code, { 'content-type': 'text/plain' });
  res.write(text);
  res.end();
}

function isValidDay(day) {
  return Object.prototype.hasOwnProperty.call(availableTimes, day);
}

function normalize(q) {
  return { name: (q.name||'').trim(), day: (q.day||'').trim(), time: (q.time||'').trim() };
}

function findAppointmentIndex(n, d, t) {
  return appointments.findIndex(a => a.name===n && a.day===d && a.time===t);
}

function schedule(queryObj, res) {
  const { name, day, time } = normalize(queryObj);
  if (!name || !day || !time) return sendText(res, 400, 'Bad Request: name, day, and time are required');
  if (!isValidDay(day))       return sendText(res, 400, 'Bad Request: invalid day');

  const list = availableTimes[day];
  const idx  = list.indexOf(time);

  if (idx !== -1) {
    list.splice(idx, 1);
    appointments.push({ name, day, time });
    return sendText(res, 200, 'reserved');
  }
  return sendText(res, 200, 'not available');
}

function cancel(queryObj, res) {
  const { name, day, time } = normalize(queryObj);
  if (!name || !day || !time) return sendText(res, 400, 'Bad Request: name, day, and time are required');
  if (!isValidDay(day))       return sendText(res, 400, 'Bad Request: invalid day');

  const i = findAppointmentIndex(name, day, time);
  if (i !== -1) {
    appointments.splice(i, 1);
    if (!availableTimes[day].includes(time)) {
      availableTimes[day].push(time);
      availableTimes[day].sort();
    }
    return sendText(res, 200, 'Appointment has been canceled');
  }
  return sendText(res, 404, 'Appointment not found');
}

function check(queryObj, res) {
  const { day, time } = normalize(queryObj);
  if (!day || !time)   return sendText(res, 400, 'Bad Request: day and time are required');
  if (!isValidDay(day)) return sendText(res, 400, 'Bad Request: invalid day');

  const ok = availableTimes[day].includes(time);
  return sendText(res, 200, ok ? 'available' : 'not available');
}

function error(status, message, res) {
  return sendText(res, status, message);
}

let serverObj = http.createServer(function(req, res){
  let urlObj = url.parse(req.url, true);
  switch (urlObj.pathname) {
    case '/schedule':
      schedule(urlObj.query, res);
      break;
    case '/cancel':
      cancel(urlObj.query, res);
      break;
    case '/check':
      check(urlObj.query, res);
      break;
    default:
      error(404, 'pathname not found', res);
  }
});

const PORT = process.env.PORT || 3000;
serverObj.listen(PORT, function(){ console.log(`listening on port ${PORT}`); });
EOF
