import * as THREE from "three";

type Program = { isReady(): boolean };

/**
 * `renderer.compile`, then a promise for exactly the programs it produced.
 *
 * Programs compile off the main thread (KHR_parallel_shader_compile), and ANGLE
 * compiles several side by side — on Windows the full glass alone takes the
 * D3D compiler seconds, so everything the film needs is started at once and
 * nothing draws with a program before it is ready (a draw would wait for it:
 * a freeze). three's own compileAsync re-reads each material's CURRENT program
 * every time it polls, so a render or another compile in between (for another
 * output) can make it resolve on the wrong one; here the programs are taken
 * the moment they are made.
 *
 * `target`: the output the programs are keyed on. three keys every program on
 * it (into a render target: linear, no tone mapping), and any non-XR target
 * stands for all of them.
 */
export function compileFor(
  gl: THREE.WebGLRenderer,
  obj: THREE.Object3D,
  camera: THREE.Camera,
  scene: THREE.Scene,
  target: THREE.WebGLRenderTarget | null = null
): Promise<void> {
  const programs: Program[] = [];
  const prev = gl.getRenderTarget();
  try {
    gl.setRenderTarget(target);
    gl.compile(obj, camera, scene).forEach((m) => {
      const p = (gl.properties.get(m) as { currentProgram?: Program } | undefined)?.currentProgram;
      if (p) programs.push(p);
    });
  } catch {
    // (Nothing to wait for: the first draw reports it.)
  } finally {
    gl.setRenderTarget(prev);
  }
  return new Promise((resolve) => {
    const poll = () => (programs.every((p) => p.isReady()) ? resolve() : setTimeout(poll, 25));
    poll();
  });
}
