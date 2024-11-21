export const LAUNCH_DATE = new Date("2024-11-23T00:00:00.000Z");

export function isBeforeLaunch() {
  return new Date().getTime() < LAUNCH_DATE.getTime();
}
