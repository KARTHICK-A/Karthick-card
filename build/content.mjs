// Long-form content for the project and profile pages.
//
// Every sentence here is the owner's own wording, taken from their published
// portfolio (https://karthick-a.github.io/portfolio/ — project cards, "The
// Engineer" section and the JSON-LD). Nothing on these pages is written by the
// site generator: it only lays the owner's text out. When the portfolio
// changes, change it here too.
//
// Client names are shown because the portfolio shows them. The portfolio's own
// NOTES.md lists "confirm the three client names may be shown publicly" as
// open — if that comes back "no", delete the `client` fields and reword the
// `summary`, `problem` and `outcome` strings that name a client.

const IMG = 'assets/img/work';

// tone drives the status pill colour: delivered | verified | poc | proto | spec
export const projects = [
  {
    ref: 'U1', slug: 'dual-fuel-ecu', featured: true,
    title: 'Dual-Fuel Engine Control Unit', titleNote: '(LPG/CNG)',
    kind: 'Automotive', status: { label: 'Marine-verified', tone: 'verified' },
    summary: 'Verified on a running marine engine under load. Final build shrank to a bare ATtiny3216.',
    problem: 'Converting IC engines to LPG/CNG needs an ECU that senses and doses fuel in real time — imported units cost too much for retrofit markets, targeting marine engines and generator sets.',
    constraints: [
      'Low-cost, customizable architecture',
      'In-house sensor calibration (MAP, EGT, RPM via precision ADC) across multiple firmware versions',
    ],
    outcome: 'V1 verified on a running marine engine under operating load; final build shrank to a bare ATtiny3216 after ATmega/ESP32 pilots.',
    facts: [
      ['Final build', 'ATtiny3216, after ATmega/Arduino and ESP32 pilots'],
      ['Sensing', 'MAP, EGT and RPM through an ADS1115 ADC'],
      ['Fuels', 'LPG / CNG'],
      ['Proof', 'Running marine engine, under operating load'],
    ],
    chips: ['ATtiny3216 (final)', 'ATmega / Arduino', 'ESP32 (pilot)', 'ADS1115', 'MAP / EGT / RPM', 'CAN', 'Embedded C', 'PlatformIO'],
    photos: [
      { file: 'dual-fuel-ecu/field-test', w: 1200, h: 675, sw: 720, sh: 405, tag: 'Field test', alt: 'ECU running on a marine engine at sea' },
      { file: 'dual-fuel-ecu/pcb-render', w: 1200, h: 691, sw: 720, sh: 415, tag: 'PCB design', alt: 'Dual-fuel ECU PCB design render' },
      { file: 'dual-fuel-ecu/product', w: 1200, h: 801, sw: 720, sh: 481, tag: 'Product', alt: 'Dual-fuel ECU V2 enclosure' },
      { file: 'dual-fuel-ecu/bench-test', w: 1200, h: 628, sw: 720, sh: 377, tag: 'Bench test', alt: 'Firmware and RPM/MAP data-logging bench setup' },
      { file: 'shared/scope-test', w: 1200, h: 675, sw: 720, sh: 405, tag: 'Scope', alt: 'Oscilloscope capture of injector drive signal' },
    ],
  },
  {
    ref: 'U2', slug: 'injector-multiplier', featured: true,
    title: 'Injector Multiplier',
    kind: 'Power electronics', status: { label: '4 to 16 channels', tone: 'spec' },
    summary: 'Four injector channels multiplied to sixteen, at 12 V / 8 A peak per channel.',
    problem: 'Affordable ECUs ship with 4 injector channels; large multi-cylinder engines need up to 16.',
    constraints: [
      '12 V / 8 A peak per channel',
      'Inductive loads demand flyback and reverse-polarity protection',
      'Custom PCB',
    ],
    outcome: '4 channels multiplied to 16 — big engines run on a low-channel, low-cost ECU.',
    facts: [
      ['Channels', '4 in, 16 out'],
      ['Rating', '12 V / 8 A peak per channel'],
      ['Protection', 'Flyback and reverse-polarity'],
      ['Hardware', 'Custom PCB'],
    ],
    chips: ['MOSFET drive', 'Flyback protection', 'Reverse-polarity protection', 'Custom PCB'],
    photos: [
      { file: 'injector-multiplier/product', w: 1200, h: 801, sw: 720, sh: 481, tag: 'Product', alt: 'Injector multiplier unit with 4 output harnesses' },
    ],
  },
  {
    ref: 'U3', slug: 'acoustic-vehicle-alerting', featured: false,
    title: 'Acoustic Vehicle Alerting System',
    kind: 'EV safety', status: { label: 'Prototype', tone: 'proto' },
    summary: 'Pedestrian alert for silent EVs, with tone and volume tracking vehicle speed.',
    problem: 'Quiet EVs are a pedestrian hazard; regulation is moving toward mandatory acoustic alerting.',
    constraints: [
      'Tone and volume must track vehicle speed continuously from an analog speed input',
    ],
    outcome: 'Working prototype on ESP32-S3 — engine-sensing work extended into EV safety hardware.',
    facts: [
      ['Controller', 'ESP32-S3'],
      ['Input', 'Analog vehicle-speed signal'],
      ['Output', 'PWM audio — tone and volume follow speed'],
      ['Status', 'Working prototype'],
    ],
    chips: ['ESP32-S3', 'PWM audio', 'Analog speed input', 'C/C++', 'PlatformIO'],
    photos: [],
  },
  {
    ref: 'U4', slug: 'oil-control-unit', featured: false,
    title: 'Oil Control Unit',
    kind: 'Automotive', status: { label: '2 hardware versions', tone: 'verified' },
    summary: 'RPM-based oil regulation protecting LPG-converted marine engines. Two hardware versions built and verified.',
    problem: 'Marine engines converted to LPG run hotter — full gas conversion raises operating temperature and risks seizure without regulated oil delivery.',
    constraints: [
      'Oil delivery must track live engine RPM, not a fixed feed',
      'Compact custom PCB',
      'MOSFET/TIP122 power stage with protection',
    ],
    outcome: 'Two hardware versions designed, manufactured and verified — RPM-based regulation protecting LPG-converted marine engines.',
    facts: [
      ['Controller', 'ESP8266'],
      ['Power stage', 'MOSFET / TIP122, with protection'],
      ['Control', 'Oil delivery tracks live engine RPM'],
      ['Hardware', 'Two versions — designed, manufactured, verified'],
    ],
    chips: ['ESP8266', 'PWM', 'MOSFET / TIP122 stage', 'Custom PCB'],
    photos: [
      { file: 'oil-control-unit/product', w: 1200, h: 801, sw: 720, sh: 481, tag: 'Product', alt: 'Oil Control Unit enclosure' },
      { file: 'shared/scope-test', w: 1200, h: 675, sw: 720, sh: 405, tag: 'Scope test', alt: 'Oscilloscope capture during RPM and injector testing' },
    ],
  },
  {
    ref: 'U5', slug: 'compressor-monitoring', featured: false,
    title: 'Compressor Health & Power Monitoring',
    client: 'Indo Tech Transformers', status: { label: 'POC done', tone: 'poc' },
    summary: 'Live compressor health off the factory floor. POC validated on-site at Indo Tech Transformers.',
    problem: 'Indo Tech Transformers needed live compressor health data — temperature, filter condition, pressure, current and voltage — off the factory floor.',
    constraints: [
      'Instrumentation-grade sensors with signal conditioning and calibration',
      'RTC-timestamped local storage',
      'Cloud sync over HTTP/JSON',
      'P10 LED for on-site readout',
    ],
    outcome: 'POC completed for Indo Tech Transformers with on-site validation.',
    facts: [
      ['Client', 'Indo Tech Transformers'],
      ['Sensors', 'PT100, ZMPT101B, SCT013'],
      ['Logging', 'RTC-timestamped local storage on SD'],
      ['Sync', 'Cloud, over HTTP/JSON'],
      ['On-site readout', 'P10 LED'],
    ],
    chips: ['ESP', 'PT100', 'ZMPT101B', 'SCT013', 'RTC', 'SD log', 'HTTP/JSON', 'P10 LED'],
    photos: [
      { file: 'compressor-monitoring/deployed', w: 1200, h: 675, sw: 720, sh: 405, tag: 'Deployed', alt: 'Compressor monitoring unit deployed in an Indo Tech Transformers panel' },
      { file: 'compressor-monitoring/onsite', w: 1059, h: 473, sw: 720, sh: 322, tag: 'On-site', alt: 'On-site validation at Indo Tech Transformers' },
    ],
  },
  {
    ref: 'U6', slug: 'cold-chamber-logger', featured: true,
    title: 'Cold Chamber Data Logging System',
    client: 'Delphi TVS', status: { label: 'Delivered', tone: 'delivered' },
    summary: 'Three distributed nodes proving the −20 °C soak is reached, not assumed. Delivered to Delphi TVS.',
    problem: 'Cold-start engine testing assumed the −20 °C soak was reached — it needed to be measured, from 3 distributed nodes across the chamber.',
    constraints: [
      'Lossy RF links — command/ACK protocol with 3-retry logic',
      'Dual-mode operation (live transmit / silent store)',
      'Sessions survive power cycles',
    ],
    outcome: 'Delivered to Delphi TVS; true temperature saturation now measured, not assumed, before cold-start testing.',
    facts: [
      ['Client', 'Delphi TVS'],
      ['Nodes', '3, distributed across the chamber'],
      ['Span', '+50 °C to −20 °C'],
      ['Links', 'LoRa E32 (~200 m), RS485 half-duplex'],
      ['Storage', 'SPIFFS flash log, with a Python PC tool'],
    ],
    chips: ['ESP32', 'RS485 half-duplex', 'LoRa E32 (~200 m)', 'SPIFFS flash log', 'Python PC tool'],
    photos: [],
  },
  {
    ref: 'U7', slug: 'production-quantity-monitoring', featured: false,
    title: 'Production Quantity Monitoring System',
    client: 'FI Auto Components', status: { label: 'POC done', tone: 'poc' },
    summary: 'Live component count retrofitted onto existing machines. POC completed for FI Auto Components.',
    problem: 'A shop floor had no live count of produced components — output tracking was manual and after the fact.',
    constraints: [
      'Retrofit onto existing machines',
      'ESP module with sensor input',
      'Live dashboard, not a batch report',
    ],
    outcome: 'POC completed for FI Auto Components; under evaluation for plant-wide rollout.',
    facts: [
      ['Client', 'FI Auto Components'],
      ['Hardware', 'ESP module and microcontroller, with sensor input'],
      ['Output', 'Live dashboard over HTTP/JSON'],
      ['Install', 'Retrofit onto existing machines'],
    ],
    chips: ['ESP + microcontroller', 'Sensor input', 'HTTP/JSON dashboard'],
    photos: [],
  },
];

for (const p of projects) {
  p.path = `work/${p.slug}.html`;
  for (const ph of p.photos) {
    ph.src = `${IMG}/${ph.file}.webp`;
    ph.srcSm = `${IMG}/${ph.file}-sm.webp`;
  }
}

export const featured = projects.filter((p) => p.featured);

export const profile = {
  lead: 'Co-founder at <strong>Spark Invotech</strong>, a DPIIT-recognized embedded systems company.',
  ownership: 'I own hardware end-to-end:',
  intro: [
    'My boards run on real machines — a dual-fuel ECU verified on a running marine engine, and industrial monitoring electronics commissioned on-site for <strong>Delphi TVS</strong>, <strong>Indo Tech Transformers</strong> and <strong>FI Auto Components</strong>.',
  ],
  // "requirements → architecture → … → customer deployment", as steps
  pipeline: ['Requirements', 'Architecture', 'Schematic', 'PCB layout', 'Firmware', 'Bring-up', 'Validation', 'Customer deployment'],
  figures: [
    ['7', 'products designed', 'prototype to delivered'],
    ['3', 'client engagements', '1 delivered · 2 POC'],
    ['16', 'injector channels', 'driven from 4'],
    ['70 °C', 'validated span', '+50 to −20 °C'],
    ['1', 'marine engine', 'running on my ECU'],
  ],
  capabilities: [
    ['L1', 'ECU & engine electronics', 'dual-fuel control · injector drivers · MAP/EGT/RPM sensing · CAN'],
    ['L2', 'Hardware & PCB', 'MOSFET stages · buck/linear supplies · flyback protection · Altium · KiCad'],
    ['L3', 'Firmware', 'embedded C/C++ · interrupt-driven · state machines · STM32 / ESP32 / ATtiny'],
    ['L4', 'Protocols & IoT', 'CAN · RS485 · LoRa · SPI/I2C/UART · HTTP/JSON · SD & SPIFFS logging'],
    ['L5', 'Test & debug', 'oscilloscope · ST-Link SWD · UPDI · custom UART capture tooling'],
  ],
  background: [
    ['Education', ['M.E. Embedded System Technologies · B.E. EEE (First Class) — Sri Sai Ram Engg.']],
    ['Experience', ['Embedded Product Engineer — Spark Invotech', 'R&D Intern — AbhiVijay Technologies']],
    ['Recognition', ['Youth Co:Lab (UNDP) Top-20', 'SIH Mentor', 'DPIIT Startup', 'IVP Grant', 'Coimbatore Startup Summit']],
    ['Certifications', ['IIT Bombay', 'IIRS/ISRO ×5', 'IEEE ×3', 'NPTEL ×2']],
    ['Languages', ['English (professional)', 'Tamil (native)']],
  ],
  alsoBuilt: [
    ['Portable Biogas Plant', 'automated stirring, water-scrubbing, MDEA gas purification'],
    ['Cloud Fusion Logger', 'predictive-maintenance IoT'],
    ['Mars Rover science subsystem', 'automated sample & test sequencing'],
  ],
};
