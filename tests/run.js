'use strict';

// Node runner: node tests/run.js
global.window = global;
require('../data/models.js');
global.CopilotCalc = require('../assets/calc.js');
require('./calc.test.js');

if (global.__testReport && global.__testReport.failures > 0) {
  process.exitCode = 1;
}
