// physics.js — shared physics-utils library for the mechatronics/study visuals.
//
// Phase D.2 SKELETON. NOT YET IN USE. Roadmap: docs/accuracy-tooling-roadmap.md.
//
// This file lives in docs/_shared/ so that the _publish.js mirror script
// can copy it to visuals-spa/_shared/ alongside the published visuals.
// Each migrated visual imports from this file via:
//
//     <script type="module">
//       import { deg2rad, rcTau, fRes } from '../../_shared/physics.js';
//       // ... visual JS ...
//     </script>
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
export const deg2rad = (deg) => deg * Math.PI / 180;

/**
 * Convert radians to degrees.
 * @param {number} rad Angle in radians.
 * @returns {number} Angle in degrees.
 */
export const rad2deg = (rad) => rad * 180 / Math.PI;

/**
 * Log-scale slider helper: `Math.pow(10, x)`.
 * Replaces the expression that appears in 19+ visuals where a slider
 * value (e.g. -9 to -3) is mapped to a frequency/value range
 * (e.g. 1 nH to 1 mH).
 * @param {number} x Log-scaled slider value.
 * @returns {number} `10 ** x`.
 */
export const fromLog = (x) => Math.pow(10, x);

/**
 * Inverse of fromLog: take a value, return its log10.
 * @param {number} v Linear value.
 * @returns {number} log10(v).
 */
export const toLog = (v) => Math.log10(v);

// ─────────────────────────────────────────────────────────────────────
// Electrical: time constants, reactances, resonance
// ─────────────────────────────────────────────────────────────────────

/**
 * RC time constant.
 * @param {number} R Resistance in Ω.
 * @param {number} C Capacitance in F.
 * @returns {number} Time constant τ in s.
 */
export const rcTau = (R, C) => R * C;

/**
 * RL time constant.
 * @param {number} L Inductance in H.
 * @param {number} R Resistance in Ω.
 * @returns {number} Time constant τ = L/R in s.
 */
export const rlTau = (L, R) => L / R;

/**
 * Angular frequency from cyclic frequency.
 * @param {number} f Frequency in Hz.
 * @returns {number} ω in rad/s.
 */
export const omega = (f) => 2 * Math.PI * f;

/**
 * Cyclic frequency from angular frequency.
 * @param {number} w ω in rad/s.
 * @returns {number} f in Hz.
 */
export const freqFromOmega = (w) => w / (2 * Math.PI);

/**
 * Inductor reactance X_L = ωL.
 * @param {number} f Frequency in Hz.
 * @param {number} L Inductance in H.
 * @returns {number} Reactance X_L in Ω.
 */
export const xL = (f, L) => 2 * Math.PI * f * L;

/**
 * Capacitor reactance X_C = 1/(ωC).
 * @param {number} f Frequency in Hz.
 * @param {number} C Capacitance in F.
 * @returns {number} Reactance X_C in Ω.
 */
export const xC = (f, C) => 1 / (2 * Math.PI * f * C);

/**
 * LC resonant frequency f₀ = 1/(2π√(LC)).
 * @param {number} L Inductance in H.
 * @param {number} C Capacitance in F.
 * @returns {number} f₀ in Hz.
 */
export const fRes = (L, C) => 1 / (2 * Math.PI * Math.sqrt(L * C));

/**
 * Q factor for a series RLC at resonance.
 * Series: Q = (1/R)·√(L/C).
 * @param {number} R Resistance in Ω.
 * @param {number} L Inductance in H.
 * @param {number} C Capacitance in F.
 * @returns {number} Quality factor (dimensionless).
 */
export const qSeries = (R, L, C) => (1 / R) * Math.sqrt(L / C);

// ─────────────────────────────────────────────────────────────────────
// Electrical: combination rules
// ─────────────────────────────────────────────────────────────────────

/**
 * Parallel combination of two resistors.
 * @param {number} R1 First resistance.
 * @param {number} R2 Second resistance.
 * @returns {number} R1·R2/(R1+R2) (same unit as inputs).
 */
export const parallelR = (R1, R2) => (R1 * R2) / (R1 + R2);

/**
 * Parallel combination of N resistors via conductance sum.
 * @param {...number} Rs Resistances.
 * @returns {number} 1/Σ(1/Ri).
 */
export const parallelNR = (...Rs) => 1 / Rs.reduce((s, r) => s + 1 / r, 0);

/**
 * Voltage divider (no load).
 * Output is taken at the node between R1 (top) and R2 (bottom to GND).
 * @param {number} Vin Input voltage.
 * @param {number} R1 Top resistor.
 * @param {number} R2 Bottom resistor.
 * @returns {number} V_out = Vin · R2/(R1+R2).
 */
export const vDivider = (Vin, R1, R2) => Vin * R2 / (R1 + R2);

// ─────────────────────────────────────────────────────────────────────
// dB conversions
// ─────────────────────────────────────────────────────────────────────

/**
 * Linear ratio to dB (power).
 * @param {number} ratio Linear power ratio.
 * @returns {number} 10·log10(ratio).
 */
export const dB = (ratio) => 10 * Math.log10(ratio);

/**
 * Linear ratio to dB (voltage / amplitude).
 * @param {number} ratio Linear voltage ratio.
 * @returns {number} 20·log10(ratio).
 */
export const dBv = (ratio) => 20 * Math.log10(ratio);

/**
 * Power in watts to dBm.
 * @param {number} pWatts Power in W.
 * @returns {number} Power in dBm.
 */
export const wToDBm = (pWatts) => 10 * Math.log10(pWatts * 1000);

/**
 * Power in dBm to watts.
 * @param {number} dBm Power in dBm.
 * @returns {number} Power in W.
 */
export const dBmToW = (dBm) => Math.pow(10, dBm / 10) / 1000;

// ─────────────────────────────────────────────────────────────────────
// Mechanical: stress, strain, beam bending
// ─────────────────────────────────────────────────────────────────────

/**
 * Axial stress σ = F/A.
 * @param {number} F Force in N.
 * @param {number} A Area in m².
 * @returns {number} Stress in Pa.
 */
export const stress = (F, A) => F / A;

/**
 * Axial strain ε = ΔL/L.
 * @param {number} dL Change in length.
 * @param {number} L0 Original length.
 * @returns {number} Strain (dimensionless).
 */
export const strain = (dL, L0) => dL / L0;

/**
 * Hooke's law σ = E·ε (linear-elastic regime only).
 * @param {number} E Young's modulus in Pa.
 * @param {number} eps Strain (dimensionless).
 * @returns {number} Stress in Pa.
 */
export const hookeStress = (E, eps) => E * eps;

/**
 * Bending stress σ = Mc/I for a beam (linear-elastic, small-deflection).
 * @param {number} M Bending moment in N·m.
 * @param {number} c Distance from neutral axis in m.
 * @param {number} I Second moment of area in m⁴.
 * @returns {number} Bending stress in Pa.
 */
export const bendingStress = (M, c, I) => (M * c) / I;

/**
 * Torsional shear stress τ = T·r/J.
 * @param {number} T Torque in N·m.
 * @param {number} r Radial distance from axis in m.
 * @param {number} J Polar second moment in m⁴.
 * @returns {number} Shear stress in Pa.
 */
export const torsionalStress = (T, r, J) => (T * r) / J;

/**
 * Polar second moment for solid circular shaft.
 * @param {number} d Diameter in m.
 * @returns {number} J = π·d⁴/32 in m⁴.
 */
export const jSolid = (d) => Math.PI * Math.pow(d, 4) / 32;

/**
 * Polar second moment for hollow circular shaft.
 * @param {number} dOuter Outer diameter in m.
 * @param {number} dInner Inner diameter in m.
 * @returns {number} J in m⁴.
 */
export const jHollow = (dOuter, dInner) =>
  Math.PI * (Math.pow(dOuter, 4) - Math.pow(dInner, 4)) / 32;

/**
 * Rectangular cross-section second moment about horizontal centroid axis.
 * @param {number} b Base width in m.
 * @param {number} h Height in m.
 * @returns {number} I = b·h³/12 in m⁴.
 */
export const iRect = (b, h) => b * Math.pow(h, 3) / 12;

/**
 * Thin-walled cylindrical pressure vessel hoop stress.
 * Regime: r/t ≥ 10.
 * @param {number} P Internal pressure in Pa.
 * @param {number} r Radius in m.
 * @param {number} t Wall thickness in m.
 * @returns {number} Hoop stress σ_h = P·r/t in Pa.
 */
export const hoopStress = (P, r, t) => (P * r) / t;

/**
 * Thin-walled cylindrical pressure vessel longitudinal stress.
 * Regime: r/t ≥ 10.
 * @param {number} P Internal pressure in Pa.
 * @param {number} r Radius in m.
 * @param {number} t Wall thickness in m.
 * @returns {number} Longitudinal stress σ_L = P·r/(2t) in Pa.
 */
export const longStress = (P, r, t) => (P * r) / (2 * t);

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
export const newtonCooling = (h, A, dT) => h * A * dT;

/**
 * Biot number (lumped-capacitance criterion: Bi < 0.1).
 * @param {number} h Convective coefficient W/(m²·K).
 * @param {number} Lc Characteristic length (V/A_s) in m.
 * @param {number} k Thermal conductivity W/(m·K).
 * @returns {number} Bi (dimensionless).
 */
export const biot = (h, Lc, k) => (h * Lc) / k;

/**
 * Stefan-Boltzmann radiation. Both temperatures MUST be in K.
 * @param {number} eps Emissivity (0..1).
 * @param {number} A Area in m².
 * @param {number} T1 Surface temperature in K.
 * @param {number} Tinf Ambient temperature in K.
 * @returns {number} Net radiative heat flow in W.
 */
export const radiation = (eps, A, T1, Tinf) => {
  const SIGMA_SB = 5.670374419e-8; // W/(m²·K⁴)
  return eps * SIGMA_SB * A * (Math.pow(T1, 4) - Math.pow(Tinf, 4));
};

// ─────────────────────────────────────────────────────────────────────
// Physical constants (single source of truth)
// ─────────────────────────────────────────────────────────────────────

export const C0 = 299792458;             // m/s, speed of light, SI definition
export const EPS0 = 8.8541878128e-12;    // F/m, CODATA
export const MU0 = 1.25663706212e-6;     // H/m, CODATA
export const K_B = 1.380649e-23;         // J/K, SI definition
export const Q_E = 1.602176634e-19;      // C, SI definition
export const H_PLANCK = 6.62607015e-34;  // J·s, SI definition
export const SIGMA_SB = 5.670374419e-8;  // W/(m²·K⁴), CODATA
export const G_STD = 9.80665;            // m/s², ISO 80000-3
export const R_GAS = 8.314462618;        // J/(mol·K), CODATA
export const N_A = 6.02214076e23;        // /mol, SI definition
export const Z0_VAC = 376.730313;        // Ω, μ₀·c
export const V_T_300K = 0.025852;        // V, k_B·T/q at 300.15 K

// Common material properties (most-cited in the curriculum)
export const SIGMA_CU = 5.96e7;          // S/m, copper conductivity at 20 °C
export const RHO_CU = 1.68e-8;           // Ω·m, copper resistivity at 20 °C
export const K_CU = 401;                 // W/(m·K), copper thermal conductivity
export const RHO_WATER = 1000;           // kg/m³ at 4 °C
export const K_AIR_25C = 0.0263;         // W/(m·K) at 25 °C
