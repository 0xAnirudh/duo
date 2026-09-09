export function largestVideo(root = document) {
  let best = null;
  let bestArea = 0;

  for (const video of root.querySelectorAll('video')) {
    const { width, height } = video.getBoundingClientRect();
    const area = width * height;

    if (area > bestArea) {
      best = video;
      bestArea = area;
    }
  }

  return best;
}

export function watchForVideo(onChange, root = document) {
  let current = null;

  const check = () => {
    const found = largestVideo(root);
    if (found !== current) {
      current = found;
      onChange(found);
    }
  };

  check();
  const observer = new MutationObserver(check);
  observer.observe(root.documentElement ?? root, { childList: true, subtree: true });

  const onResize = () => check();
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', onResize);
  };
}
