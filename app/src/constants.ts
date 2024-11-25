export const LAUNCH_DATE = new Date("2024-11-26T23:59:59-05:00");

export function isBeforeLaunch() {
  return new Date().getTime() < LAUNCH_DATE.getTime();
}
