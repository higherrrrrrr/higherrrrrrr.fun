import featuredProjects from '../data/featuredProjects';

export function getHighliteProjects() {
  const nowMs = Date.now();
  return featuredProjects
    .map(p => {
      const launchMs = new Date(p.launchDate).getTime();
      const timeLeftMs = Math.max(launchMs - nowMs, 0);
      return {
        ...p,
        timeLeftMs
      };
    })
    .sort((a, b) => a.timeLeftMs - b.timeLeftMs)
    .slice(0, 3); // Only take first 3 projects for HighLites
} 