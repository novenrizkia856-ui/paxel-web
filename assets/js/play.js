// Runs looping animations and videos only while they are on screen.
//   [data-play]      gets .is-playing while visible, CSS pauses its animations otherwise
//   [data-autoplay]  videos play while visible and pause when scrolled away
export function initPlay({ reduced }) {
  const scenes = document.querySelectorAll("[data-play]");
  const videos = document.querySelectorAll("video[data-autoplay]");

  if (!("IntersectionObserver" in window)) {
    scenes.forEach((el) => el.classList.add("is-playing"));
    return;
  }

  const sceneObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-playing", entry.isIntersecting)),
    { rootMargin: "80px 0px", threshold: 0.15 }
  );
  scenes.forEach((el) => sceneObserver.observe(el));

  // With reduced motion the posters stay as still images
  if (reduced) return;

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (video.preload === "none") video.preload = "auto";
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "200px 0px", threshold: 0.05 }
  );
  videos.forEach((video) => {
    video.muted = true;
    videoObserver.observe(video);
  });
}
