/**
 * 文件工具：rename timestamp — 文件与路径工具
 */

export const name = "dsh-file-rename-timestamp";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

const MIME = { txt: "text/plain", md: "text/markdown", html: "text/html", css: "text/css", js: "application/javascript", json: "application/json", xml: "application/xml", csv: "text/csv", pdf: "application/pdf", zip: "application/zip", gz: "application/gzip", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", ico: "image/x-icon", mp3: "audio/mpeg", mp4: "video/mp4", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", wasm: "application/wasm", dxf: "image/vnd.dxf", dwg: "image/vnd.dwg", step: "model/step", stp: "model/step", stl: "model/stl" };
const UNITS = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024, tb: 1024 * 1024 * 1024 * 1024 };

function f(x) { return (Math.round(x * 100) / 100).toString(); }
function baseName(p) { const s = String(p).replace(/[\\/]+$/, ""); const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\")); return i >= 0 ? s.slice(i + 1) : s; }
function dirName(p) { const s = String(p).replace(/[\\/]+$/, ""); const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\")); return i > 0 ? s.slice(0, i) : ""; }
function splitExt(n) { const i = String(n).lastIndexOf("."); return i > 0 ? [String(n).slice(0, i), String(n).slice(i)] : [String(n), ""]; }

const OPS = {
  filename: (t) => baseName(t),
  extension: (t) => { const [, e] = splitExt(baseName(t)); return e ? e.slice(1) : "无扩展名"; },
  basename_no_ext: (t) => splitExt(baseName(t))[0],
  dirname: (t) => dirName(t),
  path_join: (t, a) => { const base = String(t).replace(/[\\/]+$/, ""); return base + "/" + String(a).replace(/^[\\/]+/, ""); },
  path_normalize: (t) => String(t).replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/\.\//g, "/").replace(/[^/]+\/\.\.\//g, "").replace(/\/\.$/, ""),
  path_depth: (t) => "层级: " + String(t).split(/[\\/]/).filter(Boolean).length,
  size_format: (t) => { const b = Number(t); if (!Number.isFinite(b)) throw new Error("需要字节数"); let v = b, u = "B"; ["KB", "MB", "GB", "TB"].forEach((x) => { if (v >= 1024) { v /= 1024; u = x; } }); return f(v) + " " + u; },
  size_parse: (t) => { const m = String(t).trim().match(/^([\d.]+)\s*(b|kb|mb|gb|tb)$/i); if (!m) throw new Error("格式如 1.5GB"); return Math.round(Number(m[1]) * UNITS[m[2].toLowerCase()]) + " 字节"; },
  mime_by_ext: (t) => { const e = String(t).toLowerCase().replace(/^\./, ""); return MIME[e] || "未知（未收录）"; },
  ext_list: (t) => { const m = {}; String(t).split(/[\s,;]+/).filter(Boolean).forEach((p) => { const e = splitExt(baseName(p))[1].toLowerCase(); if (e) m[e] = (m[e] || 0) + 1; }); return Object.keys(m).sort().map((k) => k + ": " + m[k]).join(NL); },
  sanitize_filename: (t) => String(t).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/^\.+/, "").trim() || "_",
  rename_add_prefix: (t, a) => String(t).split(NL).filter((x) => x.trim()).map((n) => String(a) + baseName(n)).join(NL),
  rename_add_suffix: (t, a) => String(t).split(NL).filter((x) => x.trim()).map((n) => { const b = baseName(n); const [s, e] = splitExt(b); return s + String(a) + e; }).join(NL),
  rename_change_ext: (t, a) => String(t).split(NL).filter((x) => x.trim()).map((n) => { const b = baseName(n); return splitExt(b)[0] + "." + String(a).replace(/^\./, ""); }).join(NL),
  rename_number: (t, a) => { const start = Number(a) || 1; return String(t).split(NL).filter((x) => x.trim()).map((n, i) => { const b = baseName(n); const [s, e] = splitExt(b); return s + "_" + String(start + i).padStart(2, "0") + e; }).join(NL); },
  rename_replace: (t, a) => { const [oldN, newN] = String(a).split(":"); return String(t).split(NL).filter((x) => x.trim()).map((n) => baseName(n).split(oldN).join(newN)).join(NL); },
  rename_lower: (t) => String(t).split(NL).filter((x) => x.trim()).map((n) => baseName(n).toLowerCase()).join(NL),
  rename_upper: (t) => String(t).split(NL).filter((x) => x.trim()).map((n) => baseName(n).toUpperCase()).join(NL),
  rename_spaces: (t) => String(t).split(NL).filter((x) => x.trim()).map((n) => baseName(n).replace(/\s+/g, "_")).join(NL),
  rename_timestamp: (t, a) => { const stamp = String(a || "2026-11-14").replace(/[-: ]/g, ""); return String(t).split(NL).filter((x) => x.trim()).map((n) => { const b = baseName(n); const [s, e] = splitExt(b); return s + "_" + stamp + e; }).join(NL); },
  natural_sort: (t) => String(t).split(NL).filter((x) => x.trim()).sort((x, y) => x.localeCompare(y, undefined, { numeric: true })).join(NL),
  dedupe_names: (t) => { const seen = {}; return String(t).split(NL).filter((x) => x.trim()).filter((n) => { const b = baseName(n); if (seen[b]) return false; seen[b] = 1; return true; }).join(NL); },
  path_common_prefix: (t, a) => { const p = String(t).replace(/\\/g, "/").split("/"), q = String(a).replace(/\\/g, "/").split("/"); const out = []; for (let i = 0; i < Math.min(p.length, q.length); i++) { if (p[i] === q[i]) out.push(p[i]); else break; } return out.join("/") || "无公共前缀"; },
  to_relative: (t, a) => { const base = String(a).replace(/\\/g, "/").replace(/\/$/, ""); const p = String(t).replace(/\\/g, "/"); return p.indexOf(base) === 0 ? "." + p.slice(base.length) : p; },
  split_ext: (t) => { const [s, e] = splitExt(String(t)); return "主名: " + s + NL + "扩展名: " + (e || "无"); },
  is_hidden: (t) => baseName(t).startsWith(".") ? "隐藏文件" : "普通文件",
  windows_to_unix: (t) => String(t).replace(/\\/g, "/").replace(/^([A-Za-z]):/, "/$1").toLowerCase(),
  unix_to_windows: (t) => { const s = String(t).replace(/\//g, "\\"); const m = s.match(/^\\([a-z])\\/i); return m ? s.slice(1, 2).toUpperCase() + ":" + s.slice(2) : s; },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "file_rename_timestamp",
    description: "rename timestamp",
    parameters: {
      text: { "type": "string", required: true, "description": "输入" },
      a: { "type": "string", "description": "参数 a" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      try {
        const fn = OPS["rename_timestamp"];
        if (!fn) throw new Error("未知操作");
        return { text: ["文件工具：rename timestamp", "=".repeat(52), String(fn(t, a)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}
