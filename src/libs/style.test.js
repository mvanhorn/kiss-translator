import { css as uiCss } from "@emotion/css";
import {
  OPT_STYLE_BLINK,
  OPT_STYLE_FUZZY,
  OPT_STYLE_HIGHLIGHT,
} from "../config";
import {
  genTextClass,
  isOwnedTextStyleElement,
  recoverTextStyles,
} from "./style";

const ownedStyleElements = (root = document) =>
  [...(root.querySelectorAll?.("style") || [])].filter(isOwnedTextStyleElement);

const attachedCssText = (root = document) => {
  const parts = [];
  for (const el of root.querySelectorAll?.("style") || []) {
    if (!el.isConnected) continue;
    if (el.textContent?.trim()) parts.push(el.textContent);
    try {
      for (const rule of el.sheet?.cssRules || []) {
        parts.push(rule.cssText);
      }
    } catch {
      // jsdom may deny cssRules on cross-document sheets
    }
  }
  return parts.join("\n");
};

const cssForClass = (className) => {
  const cssText = attachedCssText();
  return cssText
    .split("}")
    .filter((chunk) => chunk.includes(className))
    .join("}");
};

const replaceHead = () => {
  const nextHead = document.createElement("head");
  const currentHead = document.head;
  if (currentHead) {
    document.documentElement.replaceChild(nextHead, currentHead);
  } else {
    document.documentElement.insertBefore(nextHead, document.body);
  }
  return nextHead;
};

describe("translation text style ownership", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "<head></head><body></body>";
    recoverTextStyles();
  });

  test("generates highlight rules and recovers nested hover plus keyframes", () => {
    const customStyles = [
      {
        styleSlug: "custom_hover",
        styleName: "Custom Hover",
        styleCode: `
          color: blue;
          &:hover {
            color: red;
          }
        `,
      },
    ];
    const [textClass] = genTextClass(customStyles);
    const highlightClass = textClass[OPT_STYLE_HIGHLIGHT];
    const fuzzyClass = textClass[OPT_STYLE_FUZZY];
    const blinkClass = textClass[OPT_STYLE_BLINK];
    const customClass = textClass.custom_hover;

    expect(highlightClass).toBeTruthy();
    expect(attachedCssText()).toContain(highlightClass);
    expect(cssForClass(highlightClass)).toMatch(/background-color/i);

    const initialOwned = ownedStyleElements().length;
    expect(initialOwned).toBeGreaterThan(0);

    ownedStyleElements().forEach((tag) => tag.remove());
    expect(cssForClass(highlightClass)).toBe("");

    recoverTextStyles();

    expect(textClass[OPT_STYLE_HIGHLIGHT]).toBe(highlightClass);
    expect(attachedCssText()).toContain(highlightClass);
    expect(cssForClass(highlightClass)).toMatch(/background-color/i);
    expect(cssForClass(fuzzyClass)).toMatch(new RegExp(`${fuzzyClass}:hover`));
    expect(cssForClass(customClass)).toMatch(new RegExp(`${customClass}:hover`));
    expect(cssForClass(customClass)).toMatch(/color:\s*red/i);

    const blinkCss = cssForClass(blinkClass);
    const animationName = blinkCss.match(
      /animation(?:-name)?:\s*([A-Za-z0-9_-]+)/i
    )?.[1];
    expect(animationName).toBeTruthy();
    expect(attachedCssText()).toMatch(
      new RegExp(`@keyframes\\s+${animationName}`)
    );
    expect(ownedStyleElements()).toHaveLength(initialOwned);

    recoverTextStyles();
    recoverTextStyles();
    expect(ownedStyleElements()).toHaveLength(initialOwned);
  });

  test("replays generated rules instead of reattaching emptied style tags", () => {
    const [textClass] = genTextClass();
    const highlightClass = textClass[OPT_STYLE_HIGHLIGHT];
    const emptied = ownedStyleElements();
    emptied.forEach((tag) => tag.remove());
    emptied
      .map((tag) => tag.cloneNode(false))
      .forEach((clone) => document.head.appendChild(clone));

    recoverTextStyles();

    expect(cssForClass(highlightClass)).toMatch(/background-color/i);
    expect(emptied.some((tag) => tag.isConnected)).toBe(false);
    expect(
      ownedStyleElements().some((tag) => !tag.textContent && !tag.sheet?.cssRules?.length)
    ).toBe(false);
  });

  test("moves styles to a replacement head and keeps later generation attached", () => {
    const [firstClass] = genTextClass();
    const highlightClass = firstClass[OPT_STYLE_HIGHLIGHT];
    const uiClass = uiCss`
      color: rgb(1, 2, 3);
    `;
    const siteStyle = document.createElement("style");
    siteStyle.setAttribute("data-site-style", "keep");
    siteStyle.textContent = `.${uiClass} { color: rgb(1, 2, 3); }`;
    document.head.appendChild(siteStyle);
    const uiStyleCount = [...document.querySelectorAll("style")].filter(
      (tag) => !isOwnedTextStyleElement(tag)
    ).length;

    ownedStyleElements().forEach((tag) => tag.remove());
    recoverTextStyles();
    expect(cssForClass(highlightClass)).toMatch(/background-color/i);
    expect(document.querySelector("style[data-site-style='keep']")).toBe(
      siteStyle
    );
    expect(
      [...document.querySelectorAll("style")].filter(
        (tag) => !isOwnedTextStyleElement(tag)
      )
    ).toHaveLength(uiStyleCount);

    replaceHead();
    document.head.appendChild(document.createElement("meta"));
    expect(cssForClass(highlightClass)).toBe("");

    recoverTextStyles();
    expect(document.head.contains(ownedStyleElements()[0])).toBe(true);
    expect(cssForClass(highlightClass)).toMatch(/background-color/i);

    const afterRecover = ownedStyleElements().length;
    document.head.appendChild(document.createElement("link"));
    recoverTextStyles();
    expect(ownedStyleElements()).toHaveLength(afterRecover);

    const [nextClass] = genTextClass([
      {
        styleSlug: "after_recovery",
        styleName: "After Recovery",
        styleCode: "outline: 2px solid green;",
      },
    ]);
    expect(nextClass[OPT_STYLE_HIGHLIGHT]).toBe(highlightClass);
    expect(cssForClass(nextClass.after_recovery)).toMatch(/outline/i);
  });

  test("does not throw when head is missing and restores once a head exists", () => {
    const [textClass] = genTextClass();
    const highlightClass = textClass[OPT_STYLE_HIGHLIGHT];
    document.head.remove();

    expect(() => recoverTextStyles()).not.toThrow();
    expect(() => genTextClass()).not.toThrow();

    const head = document.createElement("head");
    document.documentElement.insertBefore(head, document.body);
    recoverTextStyles();

    expect(cssForClass(highlightClass)).toMatch(/background-color/i);
    expect(ownedStyleElements(head).length).toBeGreaterThan(0);
  });
});
