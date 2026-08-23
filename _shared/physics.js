// physics.js — shared physics-utils library for the mechatronics/study visuals.
//
// Phase D.2 SKELETON. NOT YET IN USE. Roadmap: docs/accuracy-tooling-roadmap.md.
//
// This file lives in docs/_shared/ so that the _publish.js mirror script
// can copy it to visuals-spa/_shared/ alongside the published visuals.
// Each visual pulls it in as an ordinary classic script, BEFORE its own:
//
//     <script src="../../_shared/physics.js"></script>
//     <script>
//       document.addEventListener('DOMContentLoaded', function () {
//         // ... visual JS, free to use deg2rad, rcTau, fRes, ...
//       });
//     </script>
//
// It used to be an ES module that visuals imported from. That broke every
// importing page when opened from file:// — module scripts are fetched under
// CORS rules and a local file has no origin to satisfy them, so the page
// rendered but sat completely inert. Classic scripts have no such limit, so
// the visuals now work by double-click as well as over http.
//
// The helpers are attached to the global object rather than declared at
// script top level, so a visual that declares its own `omega` or `EPS0`
// shadows the shared one harmlessly instead of colliding with it.
//
// All functions use SI base units unless explicitly noted. Each function
// declares its regime, units, and the literature source where applicable.
//
// Authoring conventions:
//   1. SI base units throughout. Convert at the UI boundary, not inside.
//   2. JSDoc every function with @param/@returns including units.
//   3. State the regime where it matters (small-signal, thin-wall, CCM, ...).
//   4. Pure functions. No side effects. No DOM access.
//   5. If a function has multiple sign conventions in the literature,
//      pick one explicitly and state it in the docstring.

(function (global) {
'use strict';

// ─────────────────────────────────────────────────────────────────────
// Geometry / trig helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Convert degrees to radians.
 * Replaces the `X * Math.PI / 180` expression that appears in 20+ visuals
 * (phasor-rotation, hall-effect, foc-overview, ackermann, jacobian,
 * forward-kinematics, mohrs-circle, pressure-vessel, friction, cams,
 * four-bar-grashof, leadscrew-efficiency, anisotropic-fdm, composites,
 * frames-machines, bend-allowance, sheet-metal, section-views,
 * antenna-fundamentals, camera-calibration-aruco).
 * @param {number} deg Angle in degrees.
 * @returns {number} Angle in radians.
 */
const deg2rad = (deg) => deg * Math.PI / 180;

/**
 * Convert radians to degrees.
 * @param {number} rad Angle in radians.
 * @returns {number} Angle in degrees.
 */
const rad2deg = (rad) => rad * 180 / Math.PI;

/**
 * Log-scale slider helper: `Math.pow(10, x)`.
 * Replaces the expression that appears in 19+ visuals where a slider
 * value (e.g. -9 to -3) is mapped to a frequency/value range
 * (e.g. 1 nH to 1 mH).
 * @param {number} x Log-scaled slider value.
 * @returns {number} `10 ** x`.
 */
const fromLog = (x) => Math.pow(10, x);

/**
 * Inverse of fromLog: take a value, return its log10.
 * @param {number} v Linear value.
 * @returns {number} log10(v).
 */
const toLog = (v) => Math.log10(v);

// ─────────────────────────────────────────────────────────────────────
// Electrical: time constants, reactances, resonance
// ─────────────────────────────────────────────────────────────────────

/**
 * RC time constant.
 * @param {number} R Resistance in Ω.
 * @param {number} C Capacitance in F.
 * @returns {number} Time constant τ in s.
 */
const rcTau = (R, C) => R * C;

/**
 * RL time constant.
 * @param {number} L Inductance in H.
 * @param {number} R Resistance in Ω.
 * @returns {number} Time constant τ = L/R in s.
 */
const rlTau = (L, R) => L / R;

/**
 * Angular frequency from cyclic frequency.
 * @param {number} f Frequency in Hz.
 * @returns {number} ω in rad/s.
 */
const omega = (f) => 2 * Math.PI * f;

/**
 * Cyclic frequency from angular frequency.
 * @param {number} w ω in rad/s.
 * @returns {number} f in Hz.
 */
const freqFromOmega = (w) => w / (2 * Math.PI);

/**
 * Inductor reactance X_L = ωL.
 * @param {number} f Frequency in Hz.
 * @param {number} L Inductance in H.
 * @returns {number} Reactance X_L in Ω.
 */
const xL = (f, L) => 2 * Math.PI * f * L;

/**
 * Capacitor reactance X_C = 1/(ωC).
 * @param {number} f Frequency in Hz.
 * @param {number} C Capacitance in F.
 * @returns {number} Reactance X_C in Ω.
 */
const xC = (f, C) => 1 / (2 * Math.PI * f * C);

/**
 * LC resonant frequency f₀ = 1/(2π√(LC)).
 * @param {number} L Inductance in H.
 * @param {number} C Capacitance in F.
 * @returns {number} f₀ in Hz.
 */
const fRes = (L, C) => 1 / (2 * Math.PI * Math.sqrt(L * C));

/**
 * Q factor for a series RLC at resonance.
 * Series: Q = (1/R)·√(L/C).
 * @param {number} R Resistance in Ω.
 * @param {number} L Inductance in H.
 * @param {number} C Capacitance in F.
 * @returns {number} Quality factor (dimensionless).
 */
const qSeries = (R, L, C) => (1 / R) * Math.sqrt(L / C);

// ─────────────────────────────────────────────────────────────────────
// Electrical: combination rules
// ─────────────────────────────────────────────────────────────────────

/**
 * Parallel combination of two resistors.
 * @param {number} R1 First resistance.
 * @param {number} R2 Second resistance.
 * @returns {number} R1·R2/(R1+R2) (same unit as inputs).
 */
const parallelR = (R1, R2) => (R1 * R2) / (R1 + R2);

/**
 * Parallel combination of N resistors via conductance sum.
 * @param {...number} Rs Resistances.
 * @returns {number} 1/Σ(1/Ri).
 */
const parallelNR = (...Rs) => 1 / Rs.reduce((s, r) => s + 1 / r, 0);

/**
 * Voltage divider (no load).
 * Output is taken at the node between R1 (top) and R2 (bottom to GND).
 * @param {number} Vin Input voltage.
 * @param {number} R1 Top resistor.
 * @param {number} R2 Bottom resistor.
 * @returns {number} V_out = Vin · R2/(R1+R2).
 */
const vDivider = (Vin, R1, R2) => Vin * R2 / (R1 + R2);

// ─────────────────────────────────────────────────────────────────────
// Ohm's law (explicit forms — pick the rearrangement you want)
// ─────────────────────────────────────────────────────────────────────

/** V = I·R. @param {number} I Current in A. @param {number} R Resistance in Ω. @returns {number} V in V. */
const vFromIR = (I, R) => I * R;
/** I = V/R. @param {number} V Voltage in V. @param {number} R Resistance in Ω. @returns {number} I in A. */
const iFromVR = (V, R) => V / R;
/** R = V/I. @param {number} V Voltage in V. @param {number} I Current in A. @returns {number} R in Ω. */
const rFromVI = (V, I) => V / I;

// ─────────────────────────────────────────────────────────────────────
// Electrical power (three rearrangements of P = V·I)
// ─────────────────────────────────────────────────────────────────────

/** P = V·I. @param {number} V Voltage in V. @param {number} I Current in A. @returns {number} Power in W. */
const powerVI = (V, I) => V * I;
/** P = V²/R. @param {number} V Voltage in V. @param {number} R Resistance in Ω. @returns {number} Power in W. */
const powerVR = (V, R) => (V * V) / R;
/** P = I²·R. @param {number} I Current in A. @param {number} R Resistance in Ω. @returns {number} Power in W. */
const powerIR = (I, R) => I * I * R;

// ─────────────────────────────────────────────────────────────────────
// ADC conversions
// ─────────────────────────────────────────────────────────────────────

/**
 * ADC code from an input voltage and reference, for an N-bit unipolar
 * straight-binary converter. Result is clamped to [0, 2^N − 1].
 * @param {number} Vin Input voltage.
 * @param {number} Vref Reference voltage (full scale).
 * @param {number} bits Resolution in bits.
 * @returns {number} ADC count (integer).
 */
const adcCount = (Vin, Vref, bits) => {
  const full = Math.pow(2, bits) - 1;
  return Math.min(full, Math.max(0, Math.round((Vin / Vref) * full)));
};

/**
 * Voltage per LSB for an N-bit ADC.
 * @param {number} Vref Reference voltage.
 * @param {number} bits Resolution in bits.
 * @returns {number} Voltage per LSB in V.
 */
const adcVLsb = (Vref, bits) => Vref / Math.pow(2, bits);

/**
 * Ideal SNR ceiling for an N-bit ADC (full-scale sine, quantization
 * noise only): SNR = 6.02·N + 1.76 dB.
 * @param {number} bits Resolution in bits.
 * @returns {number} SNR in dB.
 */
const adcSnrIdeal = (bits) => 6.02 * bits + 1.76;

/**
 * Effective number of bits from a measured SINAD.
 * ENOB = (SINAD − 1.76) / 6.02.
 * @param {number} sinadDB Measured SINAD in dB.
 * @returns {number} ENOB in bits.
 */
const enob = (sinadDB) => (sinadDB - 1.76) / 6.02;

// ─────────────────────────────────────────────────────────────────────
// Damped second-order systems (RLC, mass-spring-damper)
// ─────────────────────────────────────────────────────────────────────

/**
 * Natural angular frequency ω_n = √(k/m) — mass-spring or LC.
 * @param {number} k Stiffness (or 1/L·C product).
 * @param {number} m Mass (or L·C product, depending on system).
 * @returns {number} ω_n in rad/s.
 */
const omegaN = (k, m) => Math.sqrt(k / m);

/**
 * Damping ratio for a series RLC: ζ = (R/2)·√(C/L).
 * @param {number} R Resistance in Ω.
 * @param {number} L Inductance in H.
 * @param {number} C Capacitance in F.
 * @returns {number} ζ (dimensionless).
 */
const zetaSeries = (R, L, C) => (R / 2) * Math.sqrt(C / L);

/**
 * Damping ratio for a mechanical mass-spring-damper: ζ = c / (2√(km)).
 * @param {number} c Damping coefficient in N·s/m.
 * @param {number} k Stiffness in N/m.
 * @param {number} m Mass in kg.
 * @returns {number} ζ (dimensionless).
 */
const zetaMass = (c, k, m) => c / (2 * Math.sqrt(k * m));

/**
 * Damped natural frequency ω_d = ω_n · √(1 − ζ²). Valid only for
 * underdamped systems (ζ < 1); returns NaN otherwise.
 * @param {number} wn Natural angular frequency in rad/s.
 * @param {number} zeta Damping ratio (dimensionless).
 * @returns {number} ω_d in rad/s.
 */
const omegaD = (wn, zeta) => zeta < 1 ? wn * Math.sqrt(1 - zeta * zeta) : NaN;

// ─────────────────────────────────────────────────────────────────────
// dB conversions
// ─────────────────────────────────────────────────────────────────────

/**
 * Linear ratio to dB (power).
 * @param {number} ratio Linear power ratio.
 * @returns {number} 10·log10(ratio).
 */
const dB = (ratio) => 10 * Math.log10(ratio);

/**
 * Linear ratio to dB (voltage / amplitude).
 * @param {number} ratio Linear voltage ratio.
 * @returns {number} 20·log10(ratio).
 */
const dBv = (ratio) => 20 * Math.log10(ratio);

/**
 * Power in watts to dBm.
 * @param {number} pWatts Power in W.
 * @returns {number} Power in dBm.
 */
const wToDBm = (pWatts) => 10 * Math.log10(pWatts * 1000);

/**
 * Power in dBm to watts.
 * @param {number} dBm Power in dBm.
 * @returns {number} Power in W.
 */
const dBmToW = (dBm) => Math.pow(10, dBm / 10) / 1000;

// ─────────────────────────────────────────────────────────────────────
// Mechanical: stress, strain, beam bending
// ─────────────────────────────────────────────────────────────────────

/**
 * Axial stress σ = F/A.
 * @param {number} F Force in N.
 * @param {number} A Area in m².
 * @returns {number} Stress in Pa.
 */
const stress = (F, A) => F / A;

/**
 * Axial strain ε = ΔL/L.
 * @param {number} dL Change in length.
 * @param {number} L0 Original length.
 * @returns {number} Strain (dimensionless).
 */
const strain = (dL, L0) => dL / L0;

/**
 * Hooke's law σ = E·ε (linear-elastic regime only).
 * @param {number} E Young's modulus in Pa.
 * @param {number} eps Strain (dimensionless).
 * @returns {number} Stress in Pa.
 */
const hookeStress = (E, eps) => E * eps;

/**
 * Bending stress σ = Mc/I for a beam (linear-elastic, small-deflection).
 * @param {number} M Bending moment in N·m.
 * @param {number} c Distance from neutral axis in m.
 * @param {number} I Second moment of area in m⁴.
 * @returns {number} Bending stress in Pa.
 */
const bendingStress = (M, c, I) => (M * c) / I;

/**
 * Torsional shear stress τ = T·r/J.
 * @param {number} T Torque in N·m.
 * @param {number} r Radial distance from axis in m.
 * @param {number} J Polar second moment in m⁴.
 * @returns {number} Shear stress in Pa.
 */
const torsionalStress = (T, r, J) => (T * r) / J;

/**
 * Polar second moment for solid circular shaft.
 * @param {number} d Diameter in m.
 * @returns {number} J = π·d⁴/32 in m⁴.
 */
const jSolid = (d) => Math.PI * Math.pow(d, 4) / 32;

/**
 * Polar second moment for hollow circular shaft.
 * @param {number} dOuter Outer diameter in m.
 * @param {number} dInner Inner diameter in m.
 * @returns {number} J in m⁴.
 */
const jHollow = (dOuter, dInner) =>
  Math.PI * (Math.pow(dOuter, 4) - Math.pow(dInner, 4)) / 32;

/**
 * Rectangular cross-section second moment about horizontal centroid axis.
 * @param {number} b Base width in m.
 * @param {number} h Height in m.
 * @returns {number} I = b·h³/12 in m⁴.
 */
const iRect = (b, h) => b * Math.pow(h, 3) / 12;

/**
 * Thin-walled cylindrical pressure vessel hoop stress.
 * Regime: r/t ≥ 10.
 * @param {number} P Internal pressure in Pa.
 * @param {number} r Radius in m.
 * @param {number} t Wall thickness in m.
 * @returns {number} Hoop stress σ_h = P·r/t in Pa.
 */
const hoopStress = (P, r, t) => (P * r) / t;

/**
 * Thin-walled cylindrical pressure vessel longitudinal stress.
 * Regime: r/t ≥ 10.
 * @param {number} P Internal pressure in Pa.
 * @param {number} r Radius in m.
 * @param {number} t Wall thickness in m.
 * @returns {number} Longitudinal stress σ_L = P·r/(2t) in Pa.
 */
const longStress = (P, r, t) => (P * r) / (2 * t);

// ─────────────────────────────────────────────────────────────────────
// Thermal
// ─────────────────────────────────────────────────────────────────────

/**
 * Newton's law of cooling.
 * @param {number} h Convective coefficient in W/(m²·K).
 * @param {number} A Area in m².
 * @param {number} dT Temperature difference T_surface − T_∞ in K.
 * @returns {number} Heat flow q in W.
 */
const newtonCooling = (h, A, dT) => h * A * dT;

/**
 * Biot number (lumped-capacitance criterion: Bi < 0.1).
 * @param {number} h Convective coefficient W/(m²·K).
 * @param {number} Lc Characteristic length (V/A_s) in m.
 * @param {number} k Thermal conductivity W/(m·K).
 * @returns {number} Bi (dimensionless).
 */
const biot = (h, Lc, k) => (h * Lc) / k;

/**
 * Stefan-Boltzmann radiation. Both temperatures MUST be in K.
 * @param {number} eps Emissivity (0..1).
 * @param {number} A Area in m².
 * @param {number} T1 Surface temperature in K.
 * @param {number} Tinf Ambient temperature in K.
 * @returns {number} Net radiative heat flow in W.
 */
const radiation = (eps, A, T1, Tinf) => {
  const SIGMA_SB = 5.670374419e-8; // W/(m²·K⁴)
  return eps * SIGMA_SB * A * (Math.pow(T1, 4) - Math.pow(Tinf, 4));
};

// ─────────────────────────────────────────────────────────────────────
// Physical constants (single source of truth)
// ─────────────────────────────────────────────────────────────────────

const C0 = 299792458;             // m/s, speed of light, SI definition
const EPS0 = 8.8541878128e-12;    // F/m, CODATA
const MU0 = 1.25663706212e-6;     // H/m, CODATA
const K_B = 1.380649e-23;         // J/K, SI definition
const Q_E = 1.602176634e-19;      // C, SI definition
const H_PLANCK = 6.62607015e-34;  // J·s, SI definition
const SIGMA_SB = 5.670374419e-8;  // W/(m²·K⁴), CODATA
const G_STD = 9.80665;            // m/s², ISO 80000-3
const R_GAS = 8.314462618;        // J/(mol·K), CODATA
const N_A = 6.02214076e23;        // /mol, SI definition
const Z0_VAC = 376.730313;        // Ω, μ₀·c
const V_T_300K = 0.025852;        // V, k_B·T/q at 300.15 K

// Common material properties (most-cited in the curriculum)
const SIGMA_CU = 5.96e7;          // S/m, copper conductivity at 20 °C
const RHO_CU = 1.68e-8;           // Ω·m, copper resistivity at 20 °C
const K_CU = 401;                 // W/(m·K), copper thermal conductivity
const RHO_WATER = 1000;           // kg/m³ at 4 °C
const K_AIR_25C = 0.0263;         // W/(m·K) at 25 °C

// ─────────────────────────────────────────────────────────────────────
// Classic-script surface
// ─────────────────────────────────────────────────────────────────────
// These were ES-module named exports. They are now attached to the global
// object, which is what makes the file usable from a plain <script src>.

Object.assign(global, {
  deg2rad, rad2deg, fromLog, toLog, rcTau, rlTau,
  omega, freqFromOmega, xL, xC, fRes, qSeries,
  parallelR, parallelNR, vDivider, vFromIR, iFromVR, rFromVI,
  powerVI, powerVR, powerIR, adcCount, adcVLsb, adcSnrIdeal,
  enob, omegaN, zetaSeries, zetaMass, omegaD, dB,
  dBv, wToDBm, dBmToW, stress, strain, hookeStress,
  bendingStress, torsionalStress, jSolid, jHollow, iRect, hoopStress,
  longStress, newtonCooling, biot, radiation, C0, EPS0,
  MU0, K_B, Q_E, H_PLANCK, SIGMA_SB, G_STD,
  R_GAS, N_A, Z0_VAC, V_T_300K, SIGMA_CU, RHO_CU,
  K_CU, RHO_WATER, K_AIR_25C,
});

})(typeof window !== 'undefined' ? window : globalThis);
