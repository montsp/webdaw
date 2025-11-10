
import type { SessionData } from '../types';

declare const pako: any;

export function encodeSessionData(sessionData: SessionData): string {
  try {
    const jsonString = JSON.stringify(sessionData);
    const compressed = pako.deflate(jsonString, { to: 'string' });
    const base64 = btoa(compressed);
    const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const url = new URL(window.location.href);
    url.search = `?data=${urlSafeBase64}`;
    return url.toString();
  } catch (error) {
    console.error("Failed to encode session data:", error);
    return "";
  }
}

export function decodeSessionData(encodedData: string): SessionData | null {
  try {
    const urlSafeBase64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = atob(urlSafeBase64);
    const decompressed = pako.inflate(base64, { to: 'string' });
    return JSON.parse(decompressed) as SessionData;
  } catch (error) {
    console.error("Failed to decode session data:", error);
    return null;
  }
}
