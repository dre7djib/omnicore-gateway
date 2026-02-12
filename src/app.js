const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttpMiddleware = require('./middlewares/pino-http');
const { correlationId, attachCorrelationId } = require('./middlewares/correlation');
const { globalLimiter } = require('./middlewares/rate-limit');
const errorHandler = require('./middlewares/error-handler');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(correlationId());
app.use(attachCorrelationId);
app.use(pinoHttpMiddleware);
app.use(globalLimiter);

// NOTE: express.json() is NOT applied globally.
// Proxied routes need the raw body (e.g. for file uploads).
// JSON parsing is applied only on gateway-local routes (roles).

app.use(routes);

app.use(errorHandler);

module.exports = app;
