// ==UserScript==
// @name         Roll20 Macro Builder Panel
// @namespace    local.roll20.macro.builder
// @version      1.0.6
// @description  Roll20 화면 위에서 가름선/인트로/아웃트로 매크로를 생성합니다.
// @updateURL    https://raw.githubusercontent.com/yumesuru/roll20-macro-builder/main/outputs/roll20-macro-builder.user.js
// @downloadURL  https://raw.githubusercontent.com/yumesuru/roll20-macro-builder/main/outputs/roll20-macro-builder.user.js
// @match        https://app.roll20.net/editor/*
// @match        https://app.roll20.net/editor
// @match        https://app.roll20.net/editor?*
// @grant        GM_registerMenuCommand
// @sandbox      DOM
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const APP_ID = "roll20-macro-builder-panel";
  const STATE_KEY = "roll20-macro-builder-userscript-state-v1";
  const PANEL_KEY = "roll20-macro-builder-userscript-panel-v1";
  const LAUNCHER_KEY = "roll20-macro-builder-userscript-launcher-v1";
  const DEFAULT_RULE_CHIPS = [
    "Call of Cthulhu 7th edition",
    "멀티 호러 TRPG inSANe",
    "현대 인술 배틀 RPG 시노비가미",
  ];
  const DEFAULT_COLOR_CHIPS = [
    "#a4a4a4",
    "#26674c",
    "#7f47b8",
    "#ed6b90",
    "#2e2ca1",
    "#57a421",
    "#ec7731",
  ];

  if (document.getElementById(APP_ID)) return;

  const host = document.createElement("div");
  host.id = APP_ID;
  host.style.cssText = "all: initial;";
  (document.body || document.documentElement).append(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      :host {
        --bg: #f3f4f6;
        --panel: #ffffff;
        --line: #d9dee7;
        --text: #202633;
        --muted: #697386;
        --accent: #2563eb;
        --accent-hover: #1d4ed8;
        --preview-width: 420px;
        color: var(--text);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      button, input, select, textarea { font: inherit; }
      .launcher {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483646;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        border: 1px solid #1d4ed8;
        border-radius: 0;
        padding: 8px 12px;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
      }
      .launcher:hover {
        border-color: #2563eb;
        background: #fff;
        color: #2563eb;
      }
      .panel {
        position: fixed;
        left: 80px;
        top: 80px;
        z-index: 2147483647;
        display: none;
        grid-template-rows: auto 1fr;
        width: min(980px, calc(100vw - 32px));
        height: min(720px, calc(100vh - 32px));
        min-width: 680px;
        min-height: 460px;
        border: 1px solid #111827;
        background: var(--panel);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        resize: both;
        overflow: hidden;
      }
      .panel.open { display: grid; }
      .titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 38px;
        padding: 7px 10px;
        border-bottom: 1px solid var(--line);
        background: #111827;
        color: #fff;
        cursor: move;
        user-select: none;
      }
      .titlebar-title {
        font-size: 13px;
        font-weight: 800;
      }
      .titlebar-actions {
        display: flex;
        gap: 6px;
      }
      .titlebar button,
      button {
        min-height: 30px;
        border: 1px solid var(--line);
        border-radius: 0;
        padding: 6px 9px;
        background: #fff;
        color: var(--text);
        cursor: pointer;
        font-size: 12px;
      }
      .titlebar button {
        border-color: #374151;
        background: #1f2937;
        color: #fff;
      }
      button:hover {
        border-color: #b6bfcc;
        background: #f9fafb;
      }
      .titlebar button:hover {
        border-color: #4b5563;
        background: #374151;
      }
      button.primary,
      .tab.active {
        border-color: var(--accent);
        background: var(--accent);
        color: #fff;
      }
      button.primary:hover,
      .tab.active:hover {
        border-color: var(--accent-hover);
        background: var(--accent-hover);
      }
      .app {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 0;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }
      .field-inline {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--muted);
        font-size: 12px;
      }
      .field-inline input[type="number"] {
        width: 78px;
        padding: 5px 7px;
        border: 1px solid var(--line);
        border-radius: 0;
        background: #fff;
        color: var(--text);
      }
      .work {
        display: grid;
        grid-template-columns: minmax(330px, 0.82fr) minmax(300px, 1fr);
        min-height: 0;
      }
      .controls {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 0;
        border-right: 1px solid var(--line);
        background: var(--panel);
      }
      .tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        padding: 10px;
        border-bottom: 1px solid var(--line);
      }
      .form-wrap {
        min-height: 0;
        overflow: auto;
        padding: 12px;
      }
      .form-grid {
        display: grid;
        gap: 11px;
      }
      .form-field {
        display: grid;
        gap: 6px;
      }
      .field-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        align-items: start;
      }
      label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }
      .field-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 18px;
      }
      .field-label label {
        min-width: 0;
      }
      .inline-toggle {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .inline-toggle input {
        width: auto;
        margin: 0;
      }
      input[type="text"],
      input[type="color"],
      input[type="number"],
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 0;
        background: #fff;
        color: var(--text);
      }
      input[type="text"],
      select {
        min-height: 32px;
        padding: 6px 8px;
      }
      input[type="color"] {
        height: 34px;
        padding: 3px;
        cursor: pointer;
      }
      select { cursor: pointer; }
      .color-row {
        display: grid;
        grid-template-columns: 52px 1fr auto;
        gap: 7px;
        align-items: center;
      }
      .preset-row,
      .inline-action-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 7px;
        align-items: center;
      }
      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
        font-size: 13px;
        font-weight: 500;
      }
      .checkbox-field input { width: auto; }
      .saved-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        max-width: 100%;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 4px 8px;
        background: #fff;
        color: var(--text);
        font-size: 12px;
      }
      .chip button {
        min-height: 0;
        border: 0;
        padding: 0 2px;
        background: transparent;
        color: var(--muted);
        line-height: 1;
      }
      .color-chip {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.18);
      }
      .color-chip-wrap {
        padding-top: 3px;
        padding-bottom: 3px;
      }
      .repeat-list {
        display: grid;
        gap: 7px;
      }
      .repeat-row {
        display: grid;
        grid-template-columns: minmax(76px, 0.42fr) minmax(120px, 1fr) auto;
        gap: 7px;
        align-items: center;
      }
      .repeat-row button,
      .add-row {
        min-height: 32px;
      }
      .preview-pane {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 0;
        background: var(--panel);
      }
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 36px;
        padding: 8px 10px;
        border-bottom: 1px solid var(--line);
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }
      .preview-wrap {
        min-height: 0;
        overflow: auto;
        padding: 14px;
        background: #e8eaee;
      }
      .roll20-chat {
        width: min(100%, var(--preview-width));
        min-height: 100%;
        margin: 0 auto;
        padding: 12px;
        border: 1px solid #b9c0cc;
        border-radius: 0;
        background: #f7f7f7;
        color: #222;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13px;
      }
      .message {
        margin: 0 0 8px;
        overflow-wrap: anywhere;
      }
      .message.desc {
        text-align: center;
        font-weight: 700;
      }
      .message.meta {
        color: #8a8f9a;
        font-family: "Cascadia Code", Consolas, "Courier New", monospace;
        font-size: 12px;
      }
      .message img {
        display: block;
        max-width: 100%;
        margin: 0 auto;
        border: 0;
      }
      #macroOutput {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }
      .status {
        color: var(--muted);
        font-size: 12px;
        font-weight: 400;
        white-space: nowrap;
      }
      @media (max-width: 760px) {
        .panel {
          min-width: 320px;
        }
        .work {
          grid-template-columns: 1fr;
          grid-template-rows: minmax(300px, 0.95fr) minmax(260px, 1fr);
        }
        .controls {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .tabs {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .field-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
    <button class="launcher" type="button">매크로</button>
    <section class="panel" role="dialog" aria-label="Roll20 매크로 생성기">
      <div class="titlebar">
        <div class="titlebar-title">Roll20 매크로 생성기</div>
        <div class="titlebar-actions">
          <button type="button" data-reset-panel>위치 초기화</button>
          <button type="button" data-close-panel>닫기</button>
        </div>
      </div>
      <div class="app">
        <div class="toolbar">
          <label class="field-inline">
            미리보기 폭
            <input id="previewWidth" type="number" min="260" max="900" step="10" value="420">
          </label>
          <div>
            <button id="copyMacro" type="button" class="primary">매크로 복사</button>
            <button id="resetForm" type="button">현재 양식 초기화</button>
          </div>
        </div>
        <main class="work">
          <section class="controls" aria-label="매크로 설정">
            <div class="tabs" role="tablist" aria-label="양식 선택">
              <button class="tab active" type="button" data-template="divider">가름선</button>
              <button class="tab" type="button" data-template="intro">인트로</button>
              <button class="tab" type="button" data-template="outro">아웃트로</button>
            </div>
            <div class="form-wrap">
              <div id="form" class="form-grid"></div>
            </div>
          </section>
          <section class="preview-pane" aria-label="미리보기">
            <div class="section-title">
              <span>실시간 미리보기</span>
              <span class="status" id="saveStatus">준비됨</span>
            </div>
            <div class="preview-wrap">
              <div id="preview" class="roll20-chat"></div>
            </div>
          </section>
        </main>
        <textarea id="macroOutput" readonly spellcheck="false" aria-hidden="true" tabindex="-1"></textarea>
      </div>
    </section>
  `;

  const launcher = root.querySelector(".launcher");
  const panel = root.querySelector(".panel");
  const titlebar = root.querySelector(".titlebar");
  const closeButton = root.querySelector("[data-close-panel]");
  const resetPanelButton = root.querySelector("[data-reset-panel]");
  const form = root.querySelector("#form");
  const preview = root.querySelector("#preview");
  const macroOutput = root.querySelector("#macroOutput");
  const previewWidth = root.querySelector("#previewWidth");
  const saveStatus = root.querySelector("#saveStatus");
  const tabs = [...root.querySelectorAll(".tab")];

  let activeTemplate = "divider";
  let values = {};
  let savedRules = [];
  let savedColors = [];

  function dividerMacro(color) {
    return `/desc [───────](#" style="text-decoration:none; font-style: normal; color:#000000;!) [✷](#" style="font-style: normal; text-decoration:none; color:${color};) [───────](#" style="text-decoration:none; font-style: normal; color:#000000;)`;
  }

  const templates = {
    divider: {
      name: "가름선",
      fields: [
        { id: "primaryColor", label: "장식 색", type: "color", value: "#ed6b90" },
      ],
      build: (v) => dividerMacro(v.primaryColor),
    },
    intro: {
      name: "인트로",
      fields: [
        { id: "primaryColor", label: "메인 색", type: "color", value: "#ed6b90" },
        { id: "rule", label: "룰", type: "rule", value: "" },
        { id: "title", label: "제목", type: "text", value: "", row: "titleWriter" },
        { id: "writer", label: "라이터", type: "text", value: "", row: "titleWriter" },
        { id: "imageEnabled", label: "이미지 사용", type: "checkbox", value: false },
        { id: "imageUrl", label: "이미지 링크", type: "text", value: "", showWhen: "imageEnabled" },
        { id: "includeKpc", label: "KPC 줄 사용", type: "checkbox", value: true },
        { id: "kpcLabel", label: "KPC 표기", type: "select", value: "", options: ["KPC", "GMPC", "GM"], row: "introKpc", showWhen: "includeKpc" },
        { id: "kpcName", label: "KPC 이름", type: "text", value: "", row: "introKpc", showWhen: "includeKpc" },
        { id: "pcs", label: "PC", type: "pcList", mode: "name", labelLabel: "PC 표기", labelOptions: ["PC", "PL"], valueLabel: "이름", value: [{ label: "PC", value: "" }] },
        { id: "date", label: "일시", type: "datetime", value: "" },
      ],
      build: (v) => [
        dividerMacro(v.primaryColor),
        `/desc [ ${v.rule} ](#" style="color:#333333; display:block; text-decoration: none; font-size: 12px; font-weight: normal;)`,
        `/desc [ ${v.title} ](#" style="color: #ffffff; background-color:${v.primaryColor}; padding:6px; margin:1px; font-size:14px; font-weight:bold; text-align:center; user-select:none; display:block; text-decoration:none; font-style: normal;)`,
        `/desc [ Written by ${v.writer} ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)`,
        introImageLine(v),
        introKpcLine(v),
        introPcLines(v),
        `/desc [ Date ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${v.date}](#" style="color:#000000; font-style: normal; font-size:12px; font-weight: normal; display:block; text-decoration:none;)`,
        dividerMacro(v.primaryColor),
      ].filter(Boolean).join("\n"),
    },
    outro: {
      name: "아웃트로",
      fields: [
        { id: "primaryColor", label: "메인 색", type: "color", value: "#ed6b90" },
        { id: "importIntro", label: "인트로 정보 불러오기", type: "action", action: "importIntroToOutro" },
        { id: "rule", label: "룰", type: "rule", value: "" },
        { id: "title", label: "제목", type: "text", value: "", row: "titleWriter" },
        { id: "writer", label: "라이터", type: "text", value: "", row: "titleWriter" },
        { id: "includeEnding", type: "state", value: true },
        { id: "ending", label: "엔딩", type: "text", value: "", toggleField: "includeEnding" },
        { id: "outroNameMode", label: "인트로 모드", type: "checkbox", value: false },
        { id: "includeKpc", label: "KPC 줄 사용", type: "checkbox", value: true },
        { id: "kpcLabel", label: "KPC 표기", type: "select", value: "", options: ["KPC", "GMPC", "GM"], row: "outroKpc", showWhen: "includeKpc", showWhenValue: { field: "outroNameMode", value: true } },
        { id: "kpcName", label: "KPC 이름", type: "text", value: "", row: "outroKpc", showWhen: "includeKpc" },
        { id: "kpcResult", label: "KPC 결과", type: "text", value: "", row: "outroKpc", showWhen: "includeKpc", showWhenValue: { field: "outroNameMode", value: false } },
        { id: "pcs", label: "PC", type: "pcList", mode: "result", labelLabel: "PC 이름", valueLabel: "결과", value: [{ label: "", value: "" }] },
        { id: "includeReward", type: "state", value: true },
        { id: "reward", label: "보상", type: "text", value: "", toggleField: "includeReward" },
        { id: "includeEndLabel", type: "state", value: true },
        { id: "endLabel", label: "마무리 문구", type: "select", value: "END", options: ["END", "完結"], toggleField: "includeEndLabel" },
      ],
      build: (v) => [
        dividerMacro(v.primaryColor),
        `/desc [ ${v.rule} ](#" style="color:#333333; display:block; text-decoration: none; font-size: 12px; font-weight: normal;)`,
        `/desc [  ${v.title}  ](#" style="color:${v.primaryColor}; font-size: 13px; font-style: normal; text-decoration:none; line-height:1.5; padding:1px;)[w. ${v.writer}](#" style="color:#000000; font-style: normal; font-size:10px; font-weight: normal; display:block; text-decoration:none;)`,
        outroEndingLine(v),
        outroKpcLine(v),
        outroPcLines(v),
        outroRewardLine(v),
        outroEndLabelLine(v),
        dividerMacro(v.primaryColor),
        `/desc [수고하셨습니다!](#" style="color:#333333; font-style: italic; font-size:12px; font-weight: normal; display:block; text-decoration:none;)`,
      ].filter(Boolean).join("\n"),
    },
  };

  function defaultValues() {
    const result = {};
    for (const [key, template] of Object.entries(templates)) {
      result[key] = {};
      for (const field of template.fields) {
        result[key][field.id] = Array.isArray(field.value)
          ? field.value.map((item) => ({ ...item }))
          : field.value;
      }
    }
    return result;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniqueList(items) {
    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
  }

  function normalizeColor(value) {
    const color = String(value).trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
  }

  function renderRuleChips(rules, removable) {
    return rules.map((rule) => `<span class="chip"><button type="button" data-use-rule="${escapeHtml(rule)}">${escapeHtml(rule)}</button>${removable ? `<button type="button" data-remove-rule="${escapeHtml(rule)}" aria-label="저장한 룰 삭제">×</button>` : ""}</span>`).join("");
  }

  function renderColorChips(colors, removable) {
    return colors.map((savedColor) => `<span class="chip color-chip-wrap"><button class="color-chip" type="button" data-use-color="${savedColor}" style="background:${savedColor}" aria-label="${savedColor} 적용"></button><span>${savedColor}</span>${removable ? `<button type="button" data-remove-color="${savedColor}" aria-label="저장한 색상 삭제">×</button>` : ""}</span>`).join("");
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateTime(date) {
    const hours = date.getHours();
    const period = hours < 12 ? "AM" : "PM";
    const displayHours = hours % 12 || 12;
    return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}. ${period} ${pad2(displayHours)}:${pad2(date.getMinutes())}`;
  }

  function sanitizeStyle(style) {
    return style.replace(/[\r\n]/g, " ").replace(/"/g, "&quot;").trim();
  }

  function parseStyledLinks(line) {
    const pattern = /\[([^\]]*)\]\(#"\s*style="([^)]*)\)/g;
    let html = "";
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      html += escapeHtml(line.slice(lastIndex, match.index));
      html += `<a href="#" style="${sanitizeStyle(match[2])}">${escapeHtml(match[1])}</a>`;
      lastIndex = pattern.lastIndex;
    }
    html += escapeHtml(line.slice(lastIndex));
    return html || "&nbsp;";
  }

  function renderDescContent(content) {
    const imageMatch = content.trim().match(/^\[img\]\((.+)\)$/i) || content.trim().match(/^\((.+)\)$/);
    if (imageMatch) return `<img src="${escapeHtml(imageMatch[1].trim())}" alt="">`;
    return parseStyledLinks(content);
  }

  function activeColor() {
    return values[activeTemplate]?.primaryColor || templates.divider.fields[0].value;
  }

  function setSharedColor(color) {
    const normalized = normalizeColor(color);
    if (!normalized) return false;
    for (const key of Object.keys(templates)) {
      if (Object.prototype.hasOwnProperty.call(values[key], "primaryColor")) {
        values[key].primaryColor = normalized;
      }
    }
    return true;
  }

  function renderLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed === "#0") {
      return `<div class="message desc">${parseStyledLinks(dividerMacro(activeColor()).replace(/^\/desc\s+/, ""))}</div>`;
    }
    if (trimmed.startsWith("#")) {
      return `<div class="message meta">${escapeHtml(trimmed)}</div>`;
    }
    if (trimmed.startsWith("/desc ")) {
      return `<div class="message desc">${renderDescContent(line.replace(/^\/desc\s+/, ""))}</div>`;
    }
    if (trimmed.startsWith("/desc")) {
      return `<div class="message desc">${renderDescContent(line.replace(/^\/desc\s*/, ""))}</div>`;
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return `<div class="message desc"><strong>${parseStyledLinks(trimmed.slice(2, -2))}</strong></div>`;
    }
    return "";
  }

  function pcRows(value) {
    return Array.isArray(value) && value.length > 0 ? value : [{ label: "", value: "" }];
  }

  function introPcLines(v) {
    return pcRows(v.pcs).map((pc) =>
      `/desc [  ${pc.label || ""}  ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${pc.value || ""}](#" style="color:#000000; font-style: normal; font-size:12px; font-weight: normal; display:block; text-decoration:none;)`
    ).join("\n");
  }

  function introImageLine(v) {
    const imageUrl = String(v.imageUrl || "").trim();
    return v.imageEnabled && imageUrl ? `/desc [img](${imageUrl})` : "";
  }

  function introKpcLine(v) {
    return v.includeKpc
      ? `/desc [  ${v.kpcLabel}  ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${v.kpcName}](#" style="color:#000000; font-style: normal; font-size:12px; font-weight: normal; display:block; text-decoration:none;)`
      : "";
  }

  function outroEndingLine(v) {
    return v.includeEnding
      ? `/desc [  END  ](#" style="color:#000000; font-style: normal; font-size:12px; font-weight: normal; display:block; text-decoration:none;)[${v.ending}](#" style="color: #ffffff; background-color:${v.primaryColor}; margin:3px; padding:6px; font-size:14px; font-weight:bold; text-align:center; user-select:none; display:block; text-decoration:none; font-style: normal;)`
      : "";
  }

  function outroKpcLine(v) {
    if (!v.includeKpc) return "";
    if (v.outroNameMode) {
      return `/desc [  ${v.kpcLabel}  ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${v.kpcName}](#" style="color:#000000; font-style: normal; font-size:13px; font-weight: normal; display:block; text-decoration:none;)`;
    }
    return `/desc [  ${v.kpcName}  ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${v.kpcResult}](#" style="color:#000000; font-style: normal; font-size:13px; font-weight: normal; display:block; text-decoration:none;)`;
  }

  function outroPcLines(v) {
    return pcRows(v.pcs).map((pc) =>
      `/desc [  ${pc.label || ""}  ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${pc.value || ""}](#" style="color:#000000; font-style: normal; font-size:13px; font-weight: normal; display:block; text-decoration:none;)`
    ).join("\n");
  }

  function outroRewardLine(v) {
    return v.includeReward
      ? `/desc [ 보상 ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)[${v.reward}](#" style="color:#000000; font-style: normal; font-size:13px; font-weight: normal; display:block; text-decoration:none; padding: 2px, 2px;)`
      : "";
  }

  function outroEndLabelLine(v) {
    return v.includeEndLabel
      ? `/desc [ ${v.endLabel || "END"} ](#" style="font-style: normal; text-decoration:none; color:${v.primaryColor}; line-height:1.5; padding:1px;)`
      : "";
  }

  function currentMacro() {
    return templates[activeTemplate].build(values[activeTemplate]);
  }

  function importIntroToOutro() {
    const intro = values.intro || {};
    const outro = values.outro || {};
    const currentOutroPcs = pcRows(outro.pcs);
    const introPcs = pcRows(intro.pcs);

    outro.title = intro.title || "";
    outro.rule = intro.rule || "";
    outro.writer = intro.writer || "";
    outro.kpcLabel = intro.kpcLabel || "";
    outro.kpcName = intro.kpcName || "";
    outro.pcs = introPcs.map((pc, index) => outro.outroNameMode
      ? { label: pc.label || "PC", value: pc.value || "" }
      : { label: pc.value || "", value: currentOutroPcs[index]?.value || "" });

    values.outro = outro;
    renderAll();
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        activeTemplate,
        values,
        savedRules,
        savedColors,
        previewWidth: Number(previewWidth.value) || 420,
      }));
      saveStatus.textContent = "자동 저장됨";
    } catch {
      saveStatus.textContent = "자동 저장 불가";
    }
  }

  function loadState() {
    values = defaultValues();
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      if (templates[state.activeTemplate]) activeTemplate = state.activeTemplate;
      if (state.values && typeof state.values === "object") {
        for (const key of Object.keys(templates)) {
          values[key] = { ...values[key], ...(state.values[key] || {}) };
        }
      }
      const sharedColor = normalizeColor(values[activeTemplate]?.primaryColor)
        || normalizeColor(values.intro?.primaryColor)
        || normalizeColor(values.divider?.primaryColor)
        || templates.divider.fields[0].value;
      setSharedColor(sharedColor);
      savedRules = uniqueList(Array.isArray(state.savedRules) ? state.savedRules : []).filter((rule) => !DEFAULT_RULE_CHIPS.includes(rule));
      savedColors = uniqueList(Array.isArray(state.savedColors) ? state.savedColors.map(normalizeColor) : []).filter((color) => !DEFAULT_COLOR_CHIPS.includes(color));
      previewWidth.value = state.previewWidth || 420;
    } catch {
      values = defaultValues();
      savedRules = [];
      savedColors = [];
    }
  }

  function renderTabs() {
    for (const tab of tabs) {
      const active = tab.dataset.template === activeTemplate;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    }
  }

  function renderRuleField(field, value) {
    const chips = renderRuleChips(DEFAULT_RULE_CHIPS, false) + renderRuleChips(savedRules, true);
    return `<div class="form-field">
      <label for="${field.id}">${field.label}</label>
      <div class="preset-row">
        <input id="${field.id}" data-field="${field.id}" type="text" value="${escapeHtml(value)}" placeholder="직접 입력">
        <button type="button" data-save-rule>룰 저장</button>
      </div>
      <div class="saved-list">${chips}</div>
    </div>`;
  }

  function renderColorField(field, value) {
    const color = normalizeColor(value) || field.value;
    const chips = renderColorChips(DEFAULT_COLOR_CHIPS, false) + renderColorChips(savedColors, true);
    return `<div class="form-field">
      <label for="${field.id}">${field.label}</label>
      <div class="color-row">
        <input id="${field.id}" data-field="${field.id}" type="color" value="${escapeHtml(color)}">
        <input data-field="${field.id}" type="text" value="${escapeHtml(value)}" aria-label="${field.label} 색상 코드">
        <button type="button" data-save-color="${field.id}">저장</button>
      </div>
      <div class="saved-list">${chips}</div>
    </div>`;
  }

  function fieldLabel(field) {
    if (!field.toggleField) return `<label for="${field.id}">${field.label}</label>`;
    const checked = values[activeTemplate][field.toggleField] !== false;
    return `<div class="field-label">
      <label for="${field.id}">${field.label}</label>
      <label class="inline-toggle" aria-label="${field.label} 사용">
        <input data-field="${field.toggleField}" type="checkbox" ${checked ? "checked" : ""}>
      </label>
    </div>`;
  }

  function fieldDisabled(field) {
    return field.toggleField && values[activeTemplate][field.toggleField] === false ? " disabled" : "";
  }

  function renderField(field) {
    if (field.showWhen && !values[activeTemplate][field.showWhen]) return "";
    if (field.showWhenValue && values[activeTemplate][field.showWhenValue.field] !== field.showWhenValue.value) return "";
    if (field.type === "state") return "";
    const value = values[activeTemplate][field.id] ?? "";
    if (field.type === "color") return renderColorField(field, value);
    if (field.type === "rule") return renderRuleField(field, value);
    if (field.type === "action") {
      return `<div class="form-field">
        <button type="button" data-action="${field.action}">${field.label}</button>
      </div>`;
    }
    if (field.type === "checkbox") {
      return `<div class="form-field">
        <label class="checkbox-field">
          <input data-field="${field.id}" type="checkbox" ${value ? "checked" : ""}>
          <span>${field.label}</span>
        </label>
      </div>`;
    }
    if (field.type === "datetime") {
      return `<div class="form-field">
        ${fieldLabel(field)}
        <div class="inline-action-row">
          <input id="${field.id}" data-field="${field.id}" type="text" value="${escapeHtml(value)}"${fieldDisabled(field)}>
          <button type="button" data-current-datetime="${field.id}">현재 시각</button>
        </div>
      </div>`;
    }
    if (field.type === "select") {
      const options = [`<option value="">선택</option>`].concat(field.options.map((option) =>
        `<option value="${escapeHtml(option)}"${value === option ? " selected" : ""}>${escapeHtml(option)}</option>`
      ));
      return `<div class="form-field">
        ${fieldLabel(field)}
        <select id="${field.id}" data-field="${field.id}"${fieldDisabled(field)}>${options.join("")}</select>
      </div>`;
    }
    if (field.type === "pcList") {
      const pcField = activeTemplate === "outro" && field.id === "pcs" && values.outro?.outroNameMode
        ? { ...field, mode: "name", labelLabel: "PC 표기", labelOptions: ["PC", "PL"], valueLabel: "이름" }
        : field;
      const rows = pcRows(value);
      const labelLabel = pcField.labelLabel || "PC 표기";
      const valueLabel = pcField.valueLabel || (pcField.mode === "result" ? "결과" : "이름");
      return `<div class="form-field">
        <label>${pcField.label}</label>
        <div class="repeat-list" data-repeat="${pcField.id}">
          ${rows.map((row, index) => `<div class="repeat-row">
            ${pcField.labelOptions
              ? `<select data-repeat-field="${pcField.id}" data-index="${index}" data-prop="label" aria-label="${labelLabel}">${pcField.labelOptions.map((option) => `<option value="${escapeHtml(option)}"${(row.label || pcField.labelOptions[0]) === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`
              : `<input data-repeat-field="${pcField.id}" data-index="${index}" data-prop="label" type="text" value="${escapeHtml(row.label || "")}" aria-label="${labelLabel}" placeholder="${labelLabel}">`}
            <input data-repeat-field="${pcField.id}" data-index="${index}" data-prop="value" type="text" value="${escapeHtml(row.value || "")}" aria-label="PC ${valueLabel}" placeholder="PC ${valueLabel}">
            <button type="button" data-remove-row="${pcField.id}" data-index="${index}" ${rows.length === 1 ? "disabled" : ""}>삭제</button>
          </div>`).join("")}
        </div>
        <button class="add-row" type="button" data-add-row="${pcField.id}">PC 추가</button>
      </div>`;
    }
    return `<div class="form-field">
      ${fieldLabel(field)}
      <input id="${field.id}" data-field="${field.id}" type="text" value="${escapeHtml(value)}"${fieldDisabled(field)}>
    </div>`;
  }

  function renderForm() {
    const template = templates[activeTemplate];
    const parts = [];
    for (let index = 0; index < template.fields.length; index += 1) {
      const field = template.fields[index];
      if (!field.row) {
        parts.push(renderField(field));
        continue;
      }
      const rowFields = [field];
      while (template.fields[index + 1]?.row === field.row) {
        index += 1;
        rowFields.push(template.fields[index]);
      }
      const rowContent = rowFields.map(renderField).join("");
      if (rowContent.trim()) parts.push(`<div class="field-row">${rowContent}</div>`);
    }
    form.innerHTML = parts.join("");
  }

  function renderOutput() {
    const macro = currentMacro();
    const width = Math.max(260, Math.min(900, Number(previewWidth.value) || 420));
    root.host.style.setProperty("--preview-width", `${width}px`);
    macroOutput.value = macro;
    preview.innerHTML = macro.split(/\r?\n/).map(renderLine).join("");
    saveState();
  }

  function renderAll() {
    renderTabs();
    renderForm();
    renderOutput();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const copyArea = document.createElement("textarea");
      copyArea.value = text;
      copyArea.setAttribute("readonly", "");
      copyArea.style.position = "fixed";
      copyArea.style.left = "-9999px";
      document.body.append(copyArea);
      copyArea.select();
      document.execCommand("copy");
      copyArea.remove();
    }
    saveStatus.textContent = "매크로 복사됨";
    window.setTimeout(() => {
      saveStatus.textContent = "자동 저장됨";
    }, 1200);
  }

  function savePanelState() {
    const rect = panel.getBoundingClientRect();
    localStorage.setItem(PANEL_KEY, JSON.stringify({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      open: panel.classList.contains("open"),
    }));
  }

  function loadPanelState() {
    try {
      const state = JSON.parse(localStorage.getItem(PANEL_KEY) || "{}");
      const left = Number.isFinite(state.left) ? state.left : 80;
      const top = Number.isFinite(state.top) ? state.top : 80;
      const width = Number.isFinite(state.width) ? state.width : Math.min(980, window.innerWidth - 32);
      const height = Number.isFinite(state.height) ? state.height : Math.min(720, window.innerHeight - 32);
      panel.style.left = `${Math.max(8, Math.min(left, window.innerWidth - 120))}px`;
      panel.style.top = `${Math.max(8, Math.min(top, window.innerHeight - 80))}px`;
      panel.style.width = `${Math.max(680, Math.min(width, window.innerWidth - 16))}px`;
      panel.style.height = `${Math.max(460, Math.min(height, window.innerHeight - 16))}px`;
      panel.classList.toggle("open", Boolean(state.open));
    } catch {
      panel.style.left = "80px";
      panel.style.top = "80px";
    }
  }

  function resetPanelPosition() {
    panel.style.left = "80px";
    panel.style.top = "80px";
    panel.style.width = `${Math.min(980, window.innerWidth - 32)}px`;
    panel.style.height = `${Math.min(720, window.innerHeight - 32)}px`;
    savePanelState();
  }

  let launcherPositionRatio = null;

  function launcherBounds() {
    const rect = launcher.getBoundingClientRect();
    const width = Math.max(launcher.offsetWidth || 0, rect.width || 0, 72);
    const height = Math.max(launcher.offsetHeight || 0, rect.height || 0, 34);
    return {
      maxLeft: Math.max(0, window.innerWidth - width),
      maxTop: Math.max(0, window.innerHeight - height),
    };
  }

  function setLauncherPosition(left, top) {
    const bounds = launcherBounds();
    const nextLeft = Math.max(0, Math.min(left, bounds.maxLeft));
    const nextTop = Math.max(0, Math.min(top, bounds.maxTop));
    launcher.style.left = `${nextLeft}px`;
    launcher.style.top = `${nextTop}px`;
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    launcherPositionRatio = {
      left: bounds.maxLeft ? nextLeft / bounds.maxLeft : 0,
      top: bounds.maxTop ? nextTop / bounds.maxTop : 0,
    };
  }

  function saveLauncherState() {
    const rect = launcher.getBoundingClientRect();
    const bounds = launcherBounds();
    launcherPositionRatio = {
      left: bounds.maxLeft ? rect.left / bounds.maxLeft : 0,
      top: bounds.maxTop ? rect.top / bounds.maxTop : 0,
    };
    localStorage.setItem(LAUNCHER_KEY, JSON.stringify({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      leftRatio: launcherPositionRatio.left,
      topRatio: launcherPositionRatio.top,
    }));
  }

  function loadLauncherState() {
    try {
      const state = JSON.parse(localStorage.getItem(LAUNCHER_KEY) || "{}");
      const bounds = launcherBounds();
      if (Number.isFinite(state.leftRatio) && Number.isFinite(state.topRatio)) {
        setLauncherPosition(state.leftRatio * bounds.maxLeft, state.topRatio * bounds.maxTop);
        return;
      }
      if (!Number.isFinite(state.left) || !Number.isFinite(state.top)) return;
      setLauncherPosition(state.left, state.top);
    } catch {
      // Keep default bottom-right position.
    }
  }

  function adjustLauncherToViewport() {
    if (!launcherPositionRatio) return;
    const bounds = launcherBounds();
    setLauncherPosition(
      launcherPositionRatio.left * bounds.maxLeft,
      launcherPositionRatio.top * bounds.maxTop
    );
    saveLauncherState();
  }

  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("매크로 버튼/패널 위치 복원", () => {
      const bounds = launcherBounds();
      setLauncherPosition(bounds.maxLeft - 18, bounds.maxTop - 18);
      saveLauncherState();
      panel.classList.add("open");
      resetPanelPosition();
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTemplate = tab.dataset.template;
      renderAll();
    });
  });

  function handleFormInput(event) {
    const repeatField = event.target.dataset.repeatField;
    if (repeatField) {
      const index = Number(event.target.dataset.index);
      const prop = event.target.dataset.prop;
      const rows = pcRows(values[activeTemplate][repeatField]).map((row) => ({ ...row }));
      rows[index][prop] = event.target.value;
      values[activeTemplate][repeatField] = rows;
      renderOutput();
      return;
    }
    const field = event.target.dataset.field;
    if (!field) return;
    values[activeTemplate][field] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (activeTemplate === "outro" && field === "outroNameMode") {
      values.outro.pcs = pcRows(values.outro.pcs).map((row) => event.target.checked
        ? { label: ["PC", "PL"].includes(row.label) ? row.label : "PC", value: row.label || row.value || "" }
        : { label: row.value || row.label || "", value: "" });
    }
    if (event.target.type === "color") {
      setSharedColor(event.target.value);
      const textInput = form.querySelector(`input[type="text"][data-field="${field}"]`);
      if (textInput) textInput.value = event.target.value;
    } else if (/^#[0-9a-f]{6}$/i.test(event.target.value)) {
      if (field === "primaryColor") setSharedColor(event.target.value);
      const colorInput = form.querySelector(`input[type="color"][data-field="${field}"]`);
      if (colorInput) colorInput.value = event.target.value;
    }
    if (event.target.type === "checkbox") renderAll();
    else renderOutput();
  }

  form.addEventListener("input", handleFormInput);
  form.addEventListener("change", handleFormInput);

  form.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action === "importIntroToOutro") {
      importIntroToOutro();
      return;
    }

    if (event.target.hasAttribute("data-save-rule")) {
      const rule = String(values[activeTemplate].rule || "").trim();
      if (rule && !DEFAULT_RULE_CHIPS.includes(rule)) {
        savedRules = uniqueList(savedRules.concat(rule));
        renderAll();
      }
      return;
    }
    const useRule = event.target.dataset.useRule;
    if (useRule) {
      values[activeTemplate].rule = useRule;
      renderAll();
      return;
    }
    const removeRule = event.target.dataset.removeRule;
    if (removeRule) {
      savedRules = savedRules.filter((rule) => rule !== removeRule);
      renderAll();
      return;
    }
    const saveColorField = event.target.dataset.saveColor;
    if (saveColorField) {
      const color = normalizeColor(values[activeTemplate][saveColorField]);
      if (color && !DEFAULT_COLOR_CHIPS.includes(color)) {
        savedColors = uniqueList(savedColors.concat(color));
        renderAll();
      }
      return;
    }
    const useColor = event.target.dataset.useColor;
    if (useColor) {
      setSharedColor(useColor);
      renderAll();
      return;
    }
    const removeColor = event.target.dataset.removeColor;
    if (removeColor) {
      savedColors = savedColors.filter((color) => color !== removeColor);
      renderAll();
      return;
    }
    const currentDateTimeField = event.target.dataset.currentDatetime;
    if (currentDateTimeField) {
      values[activeTemplate][currentDateTimeField] = formatDateTime(new Date());
      renderAll();
      return;
    }
    const addField = event.target.dataset.addRow;
    if (addField) {
      const field = templates[activeTemplate].fields.find((item) => item.id === addField);
      const label = activeTemplate === "outro" && addField === "pcs" && values.outro?.outroNameMode
        ? "PC"
        : field?.labelOptions?.[0] || "";
      values[activeTemplate][addField] = pcRows(values[activeTemplate][addField]).concat({ label, value: "" });
      renderAll();
      return;
    }
    const removeField = event.target.dataset.removeRow;
    if (removeField) {
      const index = Number(event.target.dataset.index);
      const rows = pcRows(values[activeTemplate][removeField]).filter((_, rowIndex) => rowIndex !== index);
      values[activeTemplate][removeField] = rows.length ? rows : [{ label: "", value: "" }];
      renderAll();
    }
  });

  previewWidth.addEventListener("input", renderOutput);
  root.querySelector("#copyMacro").addEventListener("click", () => copyText(macroOutput.value));
  root.querySelector("#resetForm").addEventListener("click", () => {
    const defaults = defaultValues();
    const sharedColor = activeColor();
    values[activeTemplate] = defaults[activeTemplate];
    setSharedColor(sharedColor);
    renderAll();
  });

  window.addEventListener("keydown", (event) => {
    if (!panel.classList.contains("open")) return;
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "a") return;

    const active = root.activeElement;
    if (!active || !active.matches?.("input[type='text'], input[type='number'], textarea")) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof active.select === "function") {
      active.select();
    } else if (typeof active.setSelectionRange === "function") {
      active.setSelectionRange(0, active.value.length);
    }
  }, true);

  let launcherDrag = null;
  let launcherMoved = false;

  launcher.addEventListener("mousedown", (event) => {
    const rect = launcher.getBoundingClientRect();
    launcherDrag = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
    };
    launcherMoved = false;
    event.preventDefault();
  });

  launcher.addEventListener("click", (event) => {
    if (launcherMoved) {
      event.preventDefault();
      event.stopPropagation();
      launcherMoved = false;
      return;
    }
    panel.classList.add("open");
    savePanelState();
  });

  closeButton.addEventListener("click", () => {
    panel.classList.remove("open");
    savePanelState();
  });
  resetPanelButton.addEventListener("click", resetPanelPosition);

  let dragging = null;
  titlebar.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) return;
    const rect = panel.getBoundingClientRect();
    dragging = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.preventDefault();
  });
  window.addEventListener("mousemove", (event) => {
    if (launcherDrag) {
      const movedX = Math.abs(event.clientX - launcherDrag.startX);
      const movedY = Math.abs(event.clientY - launcherDrag.startY);
      if (movedX > 3 || movedY > 3) launcherMoved = true;
      setLauncherPosition(event.clientX - launcherDrag.offsetX, event.clientY - launcherDrag.offsetY);
    }

    if (!dragging) return;
    const left = Math.max(0, Math.min(event.clientX - dragging.offsetX, window.innerWidth - 80));
    const top = Math.max(0, Math.min(event.clientY - dragging.offsetY, window.innerHeight - 40));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });
  window.addEventListener("mouseup", () => {
    if (launcherDrag) {
      launcherDrag = null;
      saveLauncherState();
    }

    if (!dragging) return;
    dragging = null;
    savePanelState();
  });
  new ResizeObserver(() => {
    if (panel.classList.contains("open")) savePanelState();
  }).observe(panel);
  window.addEventListener("resize", adjustLauncherToViewport);

  loadPanelState();
  loadLauncherState();
  loadState();
  renderAll();
})();
