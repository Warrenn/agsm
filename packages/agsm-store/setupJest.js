"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var customGlobal = global;
customGlobal.fetch = require('jest-fetch-mock');
customGlobal.fetchMock = customGlobal.fetch;
