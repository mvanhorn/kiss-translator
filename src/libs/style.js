import createEmotion from "@emotion/css/create-instance";
import {
  OPT_STYLE_NONE,
  OPT_STYLE_LINE,
  OPT_STYLE_DOTLINE,
  OPT_STYLE_DASHLINE,
  OPT_STYLE_WAVYLINE,
  OPT_STYLE_DASHBOX,
  OPT_STYLE_FUZZY,
  OPT_STYLE_HIGHLIGHT,
  OPT_STYLE_BLOCKQUOTE,
  OPT_STYLE_GRADIENT,
  OPT_STYLE_BLINK,
  OPT_STYLE_GLOW,
  OPT_STYLE_COLORFUL,
  DEFAULT_COLOR,
  OPT_STYLE_MARKER,
  OPT_STYLE_GRADIENT_MARKER,
  OPT_STYLE_DASHBOX_BOLD,
  OPT_STYLE_DASHLINE_BOLD,
  OPT_STYLE_WAVYLINE_BOLD,
} from "../config";

const TEXT_STYLE_KEY = "kiss-text";

const textEmotion = createEmotion({ key: TEXT_STYLE_KEY });
const { css, keyframes, sheet: textSheet } = textEmotion;

const createTextAnimations = () => ({
  gradientFlow: keyframes`
    to {
      background-position: 200% center;
    }
  `,
  blink: keyframes`
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  `,
  glow: keyframes`
    from {
      text-shadow: 0 0 10px #fff, 
      0 0 20px #fff, 
      0 0 30px #0073e6, 
      0 0 40px #0073e6;
    }
    to {
      text-shadow: 0 0 20px #fff, 
      0 0 30px #ff4da6, 
      0 0 40px #ff4da6, 
      0 0 50px #ff4da6;
    }
  `,
});

const genLineStyle = (style, color, thickness = 1) => `
  text-decoration-line: underline;
  text-decoration-style: ${style};
  text-decoration-color: ${color};
  text-decoration-thickness: ${thickness}px;
  text-underline-offset: 0.3em;
  -webkit-text-decoration-line: underline;
  -webkit-text-decoration-style: ${style};
  -webkit-text-decoration-color: ${color};
  -webkit-text-decoration-thickness: 1px;
  -webkit-text-underline-offset: 0.3em;

  opacity: 0.8;
  -webkit-opacity: 0.8;
  &:hover {
    opacity: 1;
    -webkit-opacity: 1;
  }
`;

const genBuiltinStyles = (
  color = DEFAULT_COLOR,
  animations = createTextAnimations()
) => ({
  // 无样式
  [OPT_STYLE_NONE]: ``,
  // 下划线
  [OPT_STYLE_LINE]: genLineStyle("solid", color),
  // 点状线
  [OPT_STYLE_DOTLINE]: genLineStyle("dotted", color),
  // 虚线
  [OPT_STYLE_DASHLINE]: genLineStyle("dashed", color),
  // 虚线加粗
  [OPT_STYLE_DASHLINE_BOLD]: genLineStyle("dashed", color, 2),
  // 波浪线
  [OPT_STYLE_WAVYLINE]: genLineStyle("wavy", color),
  // 波浪线加粗
  [OPT_STYLE_WAVYLINE_BOLD]: genLineStyle("wavy", color, 2),
  // 虚线框
  [OPT_STYLE_DASHBOX]: `
    border: 1px dashed ${color};
    display: block;
    padding: 0.2em 0.3em;
    box-sizing: border-box;
  `,
  // 虚线框加粗
  [OPT_STYLE_DASHBOX_BOLD]: `
    border: 2px dashed ${color};
    display: block;
    padding: 0.2em 0.3em;
    box-sizing: border-box;
  `,
  // 马克笔
  [OPT_STYLE_MARKER]: `
    background: linear-gradient(to top, ${color} 50%, transparent 50%);
  `,
  // 渐变马克笔
  [OPT_STYLE_GRADIENT_MARKER]: `
    background: linear-gradient(to top, transparent, ${color} 20%, transparent 60%);
  `,
  // 模糊
  [OPT_STYLE_FUZZY]: `
    filter: blur(0.2em);
    -webkit-filter: blur(0.2em);
    &:hover {
      filter: none;
      -webkit-filter: none;
    }
  `,
  // 高亮
  [OPT_STYLE_HIGHLIGHT]: `
    color: #fff;
    background-color: ${color};
  `,
  // 引用
  [OPT_STYLE_BLOCKQUOTE]: `
    opacity: 0.8;
    -webkit-opacity: 0.8;
    display: block;
    padding: 0.25em 0.5em;
    border-left: 0.25em solid ${color};
    background: rgb(32, 156, 238, 0.2);
    &:hover {
      opacity: 1;
      -webkit-opacity: 1;
    }
  `,
  // 渐变
  [OPT_STYLE_GRADIENT]: `
    background-image: linear-gradient(
      90deg,
      #3b82f6,
      #9333ea,
      #ec4899,
      #3b82f6
    );
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: ${animations.gradientFlow} 4s linear infinite;
    & * {
      background-color: transparent !important;
    }
  `,
  // 闪现
  [OPT_STYLE_BLINK]: `
    animation: ${animations.blink} 1s infinite;
  `,
  // 发光
  [OPT_STYLE_GLOW]: `
    animation: ${animations.glow} 2s ease-in-out infinite alternate;
  `,
  // 多彩
  [OPT_STYLE_COLORFUL]: `
    color: #333;
    background: linear-gradient(
      45deg,
      LightGreen 20%,
      LightPink 20% 40%,
      LightSalmon 40% 60%,
      LightSeaGreen 60% 80%,
      LightSkyBlue 80%
    );
    &:hover {
      color: #111;
    };
  `,
});

let lastCustomStyles = [];
let hasGeneratedTextClass = false;
let recoveringTextStyles = false;

const getLiveHead = () => {
  try {
    const head = document.head;
    return head && head.isConnected ? head : null;
  } catch {
    return null;
  }
};

const bindOwnedSheetContainer = () => {
  const head = getLiveHead();
  if (head) {
    textSheet.container = head;
    return head;
  }

  const root = document.documentElement;
  if (root?.isConnected) {
    textSheet.container = root;
    return root;
  }

  return null;
};

export const isOwnedTextStyleElement = (node) => {
  if (!node || node.nodeName !== "STYLE") return false;
  const value = node.getAttribute?.("data-emotion");
  if (typeof value !== "string") return false;
  return value === TEXT_STYLE_KEY || value.startsWith(`${TEXT_STYLE_KEY} `);
};

const styleTagHasRules = (tag) => {
  if (!tag) return false;
  const text = tag.textContent;
  if (typeof text === "string" && text.trim()) return true;
  try {
    return Boolean(tag.sheet?.cssRules?.length);
  } catch {
    return false;
  }
};

const collectOwnedStyleElements = () => {
  const owned = [];
  const seen = new Set();
  const add = (node) => {
    if (!node || seen.has(node) || !isOwnedTextStyleElement(node)) return;
    seen.add(node);
    owned.push(node);
  };

  try {
    document.querySelectorAll("style[data-emotion]").forEach(add);
  } catch {
    // 文档可能正在替换 head
  }
  textSheet.tags.forEach(add);
  return owned;
};

const areOwnedStylesAttached = () => {
  const head = getLiveHead();
  const tags = textSheet.tags;
  if (!head || !tags.length || textSheet.container !== head) return false;
  return tags.every(
    (tag) => tag.isConnected && head.contains(tag) && styleTagHasRules(tag)
  );
};

const buildTextClass = (customStyles = []) => {
  const styles = genBuiltinStyles();
  customStyles.forEach((style) => {
    styles[style.styleSlug] = style.styleCode;
  });

  const textClass = {};
  let textStyles = "";
  Object.entries(styles).forEach(([k, v]) => {
    textClass[k] = css`
      ${v}
    `;
  });
  Object.entries(styles).forEach(([k, v]) => {
    textStyles += `
      .${textClass[k]} {
        ${v}
      }
    `;
  });
  return [textClass, textStyles];
};

const replayOwnedStyles = () => {
  const host = bindOwnedSheetContainer();
  if (!host) return;

  collectOwnedStyleElements().forEach((tag) => {
    tag.parentNode?.removeChild(tag);
  });
  textEmotion.flush();
  bindOwnedSheetContainer();
  if (hasGeneratedTextClass) {
    buildTextClass(lastCustomStyles);
  } else {
    createTextAnimations();
  }
};

/**
 * 根据内置样式和用户自定义样式，生成唯一的 CSS Class 类名映射与全局样式表字符串
 * 译文样式使用独立的 Emotion 实例写入文档，避免与 UI 缓存互相污染。
 * 导航或 head 替换导致样式节点丢失时，可通过 recoverTextStyles 按已生成规则重放 CSS，
 * 并保持原有 class 名不变。Shadow DOM 仍使用返回的 textStyles 字符串注入。
 * @param {Array} customStyles - 用户自定义样式表
 * @returns {Array} [textClass, textStyles] 返回 Class 映射字典及完整样式表字符串
 */
export const genTextClass = (customStyles = []) => {
  lastCustomStyles = Array.isArray(customStyles) ? customStyles.slice() : [];
  hasGeneratedTextClass = true;
  recoverTextStyles();
  bindOwnedSheetContainer();
  return buildTextClass(lastCustomStyles);
};

/**
 * 当译文样式宿主被卸下或规则丢失时，把已生成的 CSS（含嵌套选择器与 keyframes）重放到当前 head。
 * 不清理共享 UI Emotion 缓存，也不改变已经发给 Translator 的 class 名。
 */
export const recoverTextStyles = () => {
  if (recoveringTextStyles) return;
  recoveringTextStyles = true;
  try {
    const head = getLiveHead();
    if (!head) return;
    if (areOwnedStylesAttached()) return;
    replayOwnedStyles();
  } catch {
    // head 可能在导航过程中暂时不存在，稍后由观察者再次恢复
  } finally {
    recoveringTextStyles = false;
  }
};

export const builtinStylesMap = genBuiltinStyles();
