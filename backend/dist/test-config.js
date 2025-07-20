"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/test-config.ts - TypeScript test for configuration
const index_1 = __importDefault(require("./config/index"));
console.log('🧪 Testing TypeScript Configuration...\n');
console.log('=== OBP Configuration ===');
console.log('Consumer Key:', index_1.default.openBank.consumerKey ? 'SET ✓' : 'MISSING ✗');
console.log('Consumer Secret:', index_1.default.openBank.consumerSecret ? 'SET ✓' : 'MISSING ✗');
console.log('Base URL:', index_1.default.openBank.baseUrl);
console.log('Callback URL:', index_1.default.openBank.callbackUrl);
console.log('========================\n');
// Check if callback URL matches OBP registration
const expectedCallbackUrl = 'http://localhost:3000/api/bank/callback';
const actualCallbackUrl = index_1.default.openBank.callbackUrl;
if (actualCallbackUrl === expectedCallbackUrl) {
    console.log('✅ Callback URL matches OBP registration!');
    console.log('✅ OAuth flow should work now!');
}
else {
    console.log('❌ Callback URL mismatch!');
    console.log('Expected:', expectedCallbackUrl);
    console.log('Actual:', actualCallbackUrl);
}
//# sourceMappingURL=test-config.js.map