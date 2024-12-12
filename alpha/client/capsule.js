import { Environment, CapsuleWeb } from "@usecapsule/react-sdk";

const CAPSULE_API_KEY = "196c6fd5269e56bdcca8929272bf1e9c"

export const capsuleClient = new CapsuleWeb(Environment.PROD, CAPSULE_API_KEY);