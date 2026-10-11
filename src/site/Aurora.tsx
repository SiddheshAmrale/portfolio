// Hero backdrop: three large, pre-blurred gradient blobs drifting slowly.
// Only `transform` animates, so the browser composites it on the GPU with no
// per-frame JavaScript, style, layout or paint work. (This replaced a WebGL
// shader whose per-frame cost showed up as main-thread long tasks.)
export default function Aurora() {
  return (
    <div aria-hidden className="aurora pointer-events-none absolute inset-0 -z-10 overflow-hidden" data-motion>
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />
    </div>
  );
}
