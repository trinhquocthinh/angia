interface BenchmarkOptions {
  runRound(): Promise<{ verifyPasswordMs: number }>;
  emit(row: unknown): Promise<void>;
  shouldStop(): boolean;
}

export async function runLocalIdentityBenchmark(options: BenchmarkOptions) {
  const samples: number[] = [];
  const started = performance.now();
  const cpuStart = process.cpuUsage();
  for (let round = 1; round <= 50 && !options.shouldStop(); round += 1) {
    let verifyPasswordMs: number;
    try {
      ({ verifyPasswordMs } = await options.runRound());
      if (!Number.isFinite(verifyPasswordMs) || verifyPasswordMs < 0) throw new Error('invalid_sample');
    } catch {
      await options.emit({ type: 'round', round, success: false, error: 'local_benchmark_round_failed' });
      break;
    }
    samples.push(verifyPasswordMs);
    await options.emit({ type: 'round', round, success: true, verifyPasswordMs });
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length
    ? sorted.length % 2
      ? sorted[middle]!
      : (sorted[middle - 1]! + sorted[middle]!) / 2
    : null;
  const cpu = process.cpuUsage(cpuStart);
  return {
    planned: 50,
    completed: samples.length,
    successRate: samples.length / 50,
    medianVerifyPasswordMs: median,
    elapsedMs: performance.now() - started,
    cpuUserMs: cpu.user / 1000,
    cpuSystemMs: cpu.system / 1000,
    rssBytes: process.memoryUsage().rss,
    processPeakRssBytes: process.resourceUsage().maxRSS * 1024,
    adapterGatePassed: samples.length === 50 && median !== null && median <= 1000 && !options.shouldStop(),
    lifecycleAccepted: false,
  };
}
