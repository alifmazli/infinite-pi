import { Injectable } from '@nestjs/common';
// npm i decimal.js
import Decimal from 'decimal.js';
import { PiComputationConfigService } from './pi-computation.config';

@Injectable()
export class PiCalculatorService {
  constructor(
    private readonly config: PiComputationConfigService,
  ) {}

  calculatePi(precision: number): string {
    if (precision <= 0) return '3';

    // Use JavaScript Chudnovsky implementation
    // For low precision, use sync version (fast enough)
    if (precision < 1000) {
      return this.calculatePiChudnovsky(precision);
    }
    
    // For high precision, throw error - should use async version
    throw new Error('High precision requires async calculation');
  }

  // Async version that yields to event loop
  async calculatePiAsync(precision: number): Promise<string> {
    if (precision <= 0) return '3';

    return this.calculatePiChudnovskyAsync(precision);
  }

  // ~14.181647 digits per term
  private async calculatePiChudnovskyAsync(precision: number): Promise<string> {
    const guard = 30; // extra working digits
    Decimal.set({
      precision: precision + guard,
      rounding: Decimal.ROUND_HALF_UP,
    });

    // Pre-compute constants once
    const C = new Decimal(640320);
    const C3 = C.pow(3);
    const CONST_426880 = new Decimal(426880);
    const CONST_10005_SQRT = new Decimal(10005).sqrt();
    const CONST_13591409 = new Decimal(13591409);
    const CONST_545140134 = new Decimal(545140134);

    let M = new Decimal(1); // multinomial term
    let S = new Decimal(0); // series sum
    let C3Power = new Decimal(1); // Cache C3^k to avoid recalculating

    const terms = Math.max(1, Math.ceil(precision / 14.1816474627));
    // Yield VERY frequently to prevent blocking - every 5 iterations
    // This is critical for high precision calculations that can take seconds
    // Without frequent yields, Decimal.js operations block the entire event loop
    const YIELD_INTERVAL = 5;

    for (let k = 0; k < terms; k++) {
      // Optimize Ak calculation - Decimal.mul accepts numbers directly
      const Ak = CONST_13591409.plus(CONST_545140134.mul(k));

      let term = M.mul(Ak).div(C3Power);
      if (k & 1) term = term.neg();
      S = S.plus(term);

      // Optimize M update - calculate numerator and denominator more efficiently
      // M_{k+1} / M_k = ((6k+1)...(6k+6)) / ((k+1)^3 (3k+1)(3k+2)(3k+3))
      const k1 = k + 1;
      const sixk1 = 6 * k + 1;
      const sixk2 = 6 * k + 2;
      const sixk3 = 6 * k + 3;
      const sixk4 = 6 * k + 4;
      const sixk5 = 6 * k + 5;
      const sixk6 = 6 * k + 6;
      const threek1 = 3 * k + 1;
      const threek2 = 3 * k + 2;
      const threek3 = 3 * k + 3;

      // Use native JS numbers for intermediate calculations, then convert once
      const numerator = new Decimal(sixk1)
        .mul(sixk2)
        .mul(sixk3)
        .mul(sixk4)
        .mul(sixk5)
        .mul(sixk6);
      const denominator = new Decimal(k1)
        .pow(3)
        .mul(threek1)
        .mul(threek2)
        .mul(threek3);

      M = M.mul(numerator).div(denominator);

      // Update C3Power for next iteration (multiply by C3 instead of recalculating)
      if (k < terms - 1) {
        C3Power = C3Power.mul(C3);
      }

      // Yield to event loop VERY frequently to allow other requests to be handled
      // This is critical - without frequent yields, CPU-intensive Decimal operations block everything
      // We yield every 5 iterations to ensure HTTP requests can be processed
      if ((k + 1) % YIELD_INTERVAL === 0) {
        // Use both setImmediate and setTimeout(0) to ensure event loop gets control
        await new Promise((resolve) => {
          setImmediate(() => {
            setTimeout(resolve, 0);
          });
        });
      }
    }

    const pi = CONST_426880.mul(CONST_10005_SQRT).div(S);
    return pi.toFixed(precision);
  }

  // Synchronous version for backward compatibility (but will block)
  private calculatePiChudnovsky(precision: number): string {
    // For low precision, compute synchronously (fast enough)
    if (precision < 1000) {
      const guard = 30;
      Decimal.set({
        precision: precision + guard,
        rounding: Decimal.ROUND_HALF_UP,
      });

      const C = new Decimal(640320);
      const C3 = C.pow(3);
      const CONST_426880 = new Decimal(426880);
      const CONST_10005_SQRT = new Decimal(10005).sqrt();
      const CONST_13591409 = new Decimal(13591409);
      const CONST_545140134 = new Decimal(545140134);

      let M = new Decimal(1);
      let S = new Decimal(0);
      let C3Power = new Decimal(1);
      const terms = Math.max(1, Math.ceil(precision / 14.1816474627));

      for (let k = 0; k < terms; k++) {
        const Ak = CONST_13591409.plus(CONST_545140134.mul(k));
        let term = M.mul(Ak).div(C3Power);
        if (k & 1) term = term.neg();
        S = S.plus(term);

        const k1 = k + 1;
        const numerator = new Decimal(6 * k + 1)
          .mul(6 * k + 2)
          .mul(6 * k + 3)
          .mul(6 * k + 4)
          .mul(6 * k + 5)
          .mul(6 * k + 6);
        const denominator = new Decimal(k1)
          .pow(3)
          .mul(3 * k + 1)
          .mul(3 * k + 2)
          .mul(3 * k + 3);

        M = M.mul(numerator).div(denominator);
        if (k < terms - 1) {
          C3Power = C3Power.mul(C3);
        }
      }

      const pi = CONST_426880.mul(CONST_10005_SQRT).div(S);
      return pi.toFixed(precision);
    }

    // For high precision, this will block - should use async version
    // But keeping sync for now to maintain API compatibility
    throw new Error('High precision calculation should use async method');
  }

  /**
   * Calculate the next precision to compute using adaptive increment strategy
   * - Low precision (< 1000): Small fixed increments for frequent updates
   * - Medium precision (1000-100k): Moderate fixed increments
   * - High precision (> 100k): Percentage-based increments
   */
  getNextPrecision(currentPrecision: number): number {
    const config = this.config.getConfig();

    // Low precision: use small increments for frequent updates
    if (currentPrecision < 1000) {
      return currentPrecision + config.incrementLow;
    }

    // Medium precision: use moderate increments
    if (currentPrecision < 100000) {
      return currentPrecision + config.incrementMedium;
    }

    // High precision: use percentage-based increments
    // This ensures we make progress but don't lose too much work on restart
    const incrementPercent = config.incrementHighPercent / 100;
    const increment = Math.floor(currentPrecision * incrementPercent);
    
    // Ensure minimum increment to avoid tiny steps at very high precision
    const minIncrement = Math.max(10000, Math.floor(currentPrecision * 0.01));
    return currentPrecision + Math.max(minIncrement, increment);
  }
}
