/**
 * PERFORMANCE LOOK-DEV (`?perf=1` only): the GPU time of each pass, from
 * EXT_disjoint_timer_query_webgl2, summed into window.__perf.gpu for a test
 * harness. Never created otherwise.
 */
export type GpuTimer = { begin(key: string): void; end(): void; poll(): void };

export function makeGpuTimer(gl: WebGL2RenderingContext, sink: { gpu?: Record<string, { sum: number; n: number }> }): GpuTimer | null {
  type Ext = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as Ext | null;
  if (!ext) return null;
  const pending: { q: WebGLQuery; key: string }[] = [];
  let cur: { q: WebGLQuery; key: string } | null = null;
  sink.gpu = {};
  return {
    begin(key) {
      if (cur) return;
      const q = gl.createQuery();
      if (!q) return;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      cur = { q, key };
    },
    end() {
      if (!cur) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(cur);
      cur = null;
    },
    poll() {
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      const acc = (sink.gpu ??= {});
      for (let i = pending.length - 1; i >= 0; i--) {
        const p = pending[i];
        if (!gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE)) continue;
        if (!disjoint) {
          const ms = gl.getQueryParameter(p.q, gl.QUERY_RESULT) / 1e6;
          const a = (acc[p.key] ??= { sum: 0, n: 0 });
          a.sum += ms;
          a.n++;
        }
        gl.deleteQuery(p.q);
        pending.splice(i, 1);
      }
    },
  };
}
