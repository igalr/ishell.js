// obfuscator.config.js
module.exports = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  deadCodeInjection: false,      // keep false unless you need strong protection (bloats size)
  selfDefending: true,           // makes code resist reformatting
  debugProtection: false,        // set true to block devtools (aggressive)
}