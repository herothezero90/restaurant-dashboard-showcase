import { DEMO_AUTH_KEY } from "./demoStore";

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo123";

function hasWindow() {
  return typeof window !== "undefined";
}

function createToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readAuth() {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(DEMO_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (normalizedUsername !== DEMO_USERNAME || normalizedPassword !== DEMO_PASSWORD) {
    throw new Error("Incorrect username or password.");
  }

  if (!hasWindow()) return;

  const token = createToken();
  const auth = {
    username: DEMO_USERNAME,
    token,
    loggedInAt: new Date().toISOString(),
  };

  window.localStorage.setItem("token", token);
  window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(auth));
}

export async function checkToken() {
  if (!hasWindow()) {
    return { token: null };
  }

  const auth = readAuth();
  const token = window.localStorage.getItem("token");

  if (!auth?.token) {
    throw new Error("Unauthorized");
  }

  if (token !== auth.token) {
    window.localStorage.setItem("token", auth.token);
  }

  return { token: auth.token };
}

export function clearDemoAuth() {
  if (!hasWindow()) return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem(DEMO_AUTH_KEY);
}
