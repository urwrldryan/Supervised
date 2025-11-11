import { registerSW } from "/active/prxy/register-sw.mjs";
import * as BareMux from "/active/prxy/baremux/index.mjs";
import { getFavicon, rAlert } from "./utils.mjs";

const connection = new BareMux.BareMuxConnection("/active/prxy/baremux/worker.js");

export function search(input, template) {
  try {
    return new URL(input).toString();
  } catch (err) {}

  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (err) {}

  return template.replace("%s", encodeURIComponent(input));
}

export async function getUV(input, customWispUrl = null) {
  try {
    await registerSW();
  } catch (err) {
    rAlert(`SW failed to register.<br>${err.toString()}`);
    throw err;
  }

  let url = search(input, "https://html.duckduckgo.com/html?t=h_&q=%s");

  // Get WISP URL from settings or use default
  let wispUrl = customWispUrl || "wss://wisp.rhw.one/";
  
  // Try to get from localStorage if not provided
  if (!customWispUrl && typeof window !== 'undefined') {
    try {
      const settings = localStorage.getItem("proxySettings");
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.wispUrl) {
          wispUrl = parsed.wispUrl;
        }
      }
    } catch (e) {
      // Use default if settings can't be read
    }
  }
  
  if ((await connection.getTransport()) !== "/active/prxy/epoxy/index.mjs") {
    await connection.setTransport("/active/prxy/epoxy/index.mjs", [
      { wisp: wispUrl },
    ]);
  }
  if ((await connection.getTransport()) !== "/active/prxy/libcurl/libcurl.mjs") {
    await connection.setTransport("/active/prxy/libcurl/libcurl.mjs", [
      { wisp: wispUrl },
    ]);
  }

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

  return viewUrl;
}
