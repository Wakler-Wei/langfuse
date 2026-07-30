// @ts-nocheck
const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../../..");
const sourceRoot = path.join(repoRoot, "web", "src");
const ts = require(
  path.join(
    repoRoot,
    "packages/config-eslint/node_modules/typescript/lib/typescript.js",
  ),
);
const checkOnly = process.argv.includes("--check");
const enCatalogPath = path.join(
  sourceRoot,
  "features/i18n/messages/auto.en.json",
);
const zhCatalogPath = path.join(
  sourceRoot,
  "features/i18n/messages/auto.zh-CN.json",
);

const excludedPathParts = [
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}components${path.sep}design-system${path.sep}ThemeTokens${path.sep}`,
  `${path.sep}features${path.sep}i18n${path.sep}`,
  `${path.sep}features${path.sep}chart-view-prototype${path.sep}`,
  `${path.sep}pages${path.sep}api${path.sep}`,
  `${path.sep}server${path.sep}`,
];
const excludedFilePatterns = [
  /\.stories\.tsx$/,
  /\.clienttest\.tsx?$/,
  /\.servertest\.tsx?$/,
  /\.test\.tsx?$/,
  /\.d\.ts$/,
];
const excludedTags = new Set([
  "code",
  "pre",
  "script",
  "style",
  "Codeblock",
  "CodeBlock",
  "JsonView",
  "JsonViewer",
  "MarkdownJsonView",
]);
const translatedAttributes = new Set([
  "alt",
  "aria-label",
  "buttonText",
  "cancelText",
  "confirmText",
  "description",
  "emptyMessage",
  "label",
  "message",
  "placeholder",
  "searchPlaceholder",
  "title",
  "tooltip",
]);
const translatedObjectProperties = new Set([
  "buttonText",
  "cancelText",
  "confirmText",
  "description",
  "emptyMessage",
  "header",
  "label",
  "placeholder",
  "searchPlaceholder",
  "title",
  "tooltip",
]);
const translatedToastMethods = new Set([
  "error",
  "info",
  "loading",
  "message",
  "success",
  "warning",
]);
const translatedVariableNamePattern =
  /(label|text|title|message|description|tooltip|placeholder)$/i;
const protectedExactText = new Set([
  "AND",
  "API",
  "AWS",
  "Azure",
  "CLI",
  "Cmd",
  "Codex",
  "Ctrl",
  "GCP",
  "GitHub Enterprise",
  "GitLab",
  "Google",
  "Auth0",
  "Authentik",
  "OneLogin",
  "Okta",
  "Azure AD / Entra ID",
  "AWS Cognito",
  "Custom OIDC",
  "Keycloak",
  "JumpCloud",
  "GitHub",
  "JSON",
  "Langfuse",
  "LLM",
  "MCP",
  "MinIO",
  "OpenAI",
  "OR",
  "PostHog",
  "PostgreSQL",
  "Redis",
  "SDK",
  "Slack",
  "SSO",
  "Tab",
  "USD",
  "URL",
]);
const protectedTerms = [
  "Hugging Face",
  "Claude Code",
  "OpenTelemetry",
  "ClickHouse",
  "PostgreSQL",
  "Langfuse",
  "PostHog",
  "OpenAI",
  "GitHub",
  "Codex",
  "MinIO",
  "Redis",
  "Slack",
  "Azure",
  "AWS",
  "GCP",
  "MCP",
  "CLI",
  "API",
  "SDK",
  "SSO",
  "LLM",
  "JSON",
  "URL",
];
const exactTranslationOverrides = {
  Action: "操作",
  Actions: "操作",
  Active: "启用",
  Added: "已添加",
  Adapter: "适配器",
  Dashboard: "仪表板",
  Dashboards: "仪表板",
  Dataset: "数据集",
  Datasets: "数据集",
  Error: "错误",
  Evaluation: "评估",
  Evaluations: "评估",
  Evaluator: "评估器",
  Evaluators: "评估器",
  Generation: "生成",
  Generations: "生成",
  Header: "请求头",
  Headers: "请求头",
  Model: "模型",
  Models: "模型",
  Observation: "观测",
  Observations: "观测",
  Prompt: "提示词",
  Prompts: "提示词",
  Score: "评分",
  Scores: "评分",
  Span: "Span",
  Spans: "Span",
  Token: "Token",
  Tokens: "Token",
  Trace: "追踪",
  Traces: "追踪",
  Widget: "组件",
  Widgets: "组件",
  "Add Header": "添加请求头",
  "Add header": "添加请求头",
  "Custom Header": "自定义请求头",
  "Commit message": "提交说明",
  "Prompt reference": "提示词引用",
};

function listTsxFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTsxFiles(filePath);
    if (!entry.isFile()) return [];
    const isTsx = entry.name.endsWith(".tsx");
    const isToastTs =
      entry.name.endsWith(".ts") &&
      /(?:show(?:Error|Success)Toast|toast\.(?:error|info|success|warning))\s*\(/.test(
        fs.readFileSync(filePath, "utf8"),
      );
    if (!isTsx && !isToastTs) return [];
    if (excludedPathParts.some((part) => filePath.includes(part))) return [];
    if (excludedFilePatterns.some((pattern) => pattern.test(filePath)))
      return [];
    return [filePath];
  });
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getTagName(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current))
      return current.openingElement.tagName.getText();
    if (ts.isJsxSelfClosingElement(current)) return current.tagName.getText();
    current = current.parent;
  }
  return null;
}

function hasDynamicSibling(node) {
  const parent = node.parent;
  return (
    ts.isJsxElement(parent) &&
    parent.children.some(
      (child) =>
        child !== node &&
        ts.isJsxExpression(child) &&
        child.expression !== undefined,
    )
  );
}

function looksLikeExampleValue(text) {
  return (
    /_[a-f0-9]{7}$/.test(text) ||
    /^\d+(?:ms|s|m|h|d)$/.test(text) ||
    /^\*+$/.test(text) ||
    /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text) ||
    /^https?:\/\//.test(text) ||
    (/^[\w.-]+\.[A-Za-z]{2,}$/.test(text) && !text.includes(" ")) ||
    /^\$?\d[\d.,:%/-]*$/.test(text) ||
    /^[A-Z][A-Z0-9_-]*\d[A-Z0-9_-]*$/.test(text)
  );
}

function isTranslatable(node, text, { allowDynamicSibling = false } = {}) {
  if (text.length < 2 || text.length > 1000 || !/[A-Za-z]/.test(text)) {
    return false;
  }
  if (
    protectedExactText.has(text) ||
    /^[A-Z0-9_.+-]{2,16}$/.test(text) ||
    looksLikeExampleValue(text)
  ) {
    return false;
  }
  if (/https?:\/\/|mailto:|\{\{|\}\}|=>|<\/?[A-Za-z]|&[a-z]+;/.test(text)) {
    return false;
  }
  if (/^[./\\]|[/\\][A-Za-z0-9_.-]+$/.test(text)) return false;
  if (excludedTags.has(getTagName(node))) return false;
  if (!allowDynamicSibling && hasDynamicSibling(node)) return false;
  return true;
}

function createMessageId(text) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 52);
  const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 7);
  return `${slug || "text"}_${hash}`;
}

function getPropertyName(node) {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

function hasTranslationKeySibling(node) {
  return (
    ts.isObjectLiteralExpression(node.parent) &&
    node.parent.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        getPropertyName(property.name) === "translationKey",
    )
  );
}

function getFunctionName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  if (
    node.parent &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  let current = node.parent;
  while (
    current &&
    (ts.isParenthesizedExpression(current) || ts.isCallExpression(current))
  ) {
    if (
      current.parent &&
      ts.isVariableDeclaration(current.parent) &&
      ts.isIdentifier(current.parent.name)
    ) {
      return current.parent.name.text;
    }
    current = current.parent;
  }
  if (
    ts.isFunctionDeclaration(node) &&
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
    )
  ) {
    return "DefaultPage";
  }
  return null;
}

function findHookOwner(node) {
  let current = node.parent;
  while (current) {
    if (
      (ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current)) &&
      ts.isBlock(current.body)
    ) {
      const name = getFunctionName(current);
      if (name && (/^[A-Z]/.test(name) || /^use[A-Z0-9]/.test(name))) {
        return current;
      }
    }
    current = current.parent;
  }
  return null;
}

function createTemplateTranslation(node, sourceFile, registerMessage) {
  const values = {};
  let message = node.head.text;
  node.templateSpans.forEach((span, index) => {
    const key = `value${index}`;
    values[key] = span.expression.getText(sourceFile);
    message += `{${key}}${span.literal.text}`;
  });
  const text = normalizeText(message);
  const staticText = normalizeText(text.replace(/\{value\d+\}/g, ""));
  if (!isTranslatable(node, staticText, { allowDynamicSibling: true })) {
    return null;
  }
  const id = registerMessage(text);
  const serializedValues = Object.entries(values)
    .map(([key, value]) => `${key}: String(((${value}) as unknown) ?? "")`)
    .join(", ");
  return { id, values: serializedValues };
}

function protectTerms(text) {
  const replacements = [];
  let protectedText = text;
  protectedTerms.forEach((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    protectedText = protectedText.replace(new RegExp(escaped, "g"), () => {
      const marker = `ZXQ${replacements.length}QXZ`;
      replacements.push([marker, term]);
      return marker;
    });
  });
  protectedText = protectedText.replace(
    /\{[A-Za-z][A-Za-z0-9_]*\}/g,
    (interpolation) => {
      const marker = `ZXQ${replacements.length}QXZ`;
      replacements.push([marker, interpolation]);
      return marker;
    },
  );
  return { protectedText, replacements };
}

function getInterpolationVariables(message) {
  return [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

function findInterpolationMismatches(englishCatalog, translatedCatalog) {
  return Object.entries(englishCatalog).flatMap(([id, message]) => {
    const englishVariables = getInterpolationVariables(message);
    const translatedVariables = getInterpolationVariables(
      translatedCatalog[id] ?? "",
    );
    return JSON.stringify(englishVariables) ===
      JSON.stringify(translatedVariables)
      ? []
      : [
          `${id}: expected {${englishVariables.join(", ")}}, found {${translatedVariables.join(", ")}}`,
        ];
  });
}

function restoreTerms(text, replacements) {
  return replacements.reduce(
    (result, [marker, term]) => result.replace(new RegExp(marker, "gi"), term),
    text,
  );
}

function normalizeProductTerms(text) {
  return text
    .replace(/痕迹/g, "追踪")
    .replace(/跟踪/g, "追踪")
    .replace(/型号/g, "模型")
    .replace(/代币/g, "Token")
    .replace(/观察结果/g, "观测")
    .replace(/提示词语/g, "提示词")
    .replace(/提示参考/g, "提示词引用")
    .replace(/数据集合/g, "数据集")
    .replace(/小部件/g, "组件")
    .replace(/工作观点/g, "工作视图");
}

async function translateBatch(entries) {
  const protectedEntries = entries.map(([id, text]) => {
    const protectedValue = protectTerms(text);
    return { id, ...protectedValue };
  });
  const response = childProcess.execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "$ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false); $items = ConvertFrom-Json $env:LANGFUSE_TRANSLATE_ITEMS; $output = [ordered]@{}; foreach ($item in $items) { $uri = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=' + [uri]::EscapeDataString($item.text); $response = Invoke-RestMethod -Uri $uri -Method Get; $data = if ($null -ne $response.value) { $response.value } else { $response }; $output[$item.id] = (($data[0] | ForEach-Object { $_[0] }) -join '') }; $output | ConvertTo-Json -Compress",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        LANGFUSE_TRANSLATE_ITEMS: JSON.stringify(
          protectedEntries.map((entry) => ({
            id: entry.id,
            text: entry.protectedText,
          })),
        ),
      },
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60_000,
    },
  );
  const translated = JSON.parse(response);
  return Object.fromEntries(
    protectedEntries.map((entry) => {
      const value = translated[entry.id];
      if (!value) throw new Error(`missing translation for ${entry.id}`);
      return [
        entry.id,
        normalizeProductTerms(restoreTerms(value, entry.replacements)),
      ];
    }),
  );
}

async function translateEntries(entries) {
  const result = {};
  let batch = [];
  let batchLength = 0;
  for (const entry of entries) {
    if (batch.length >= 30 || batchLength + entry[1].length > 2500) {
      Object.assign(result, await translateBatch(batch));
      batch = [];
      batchLength = 0;
    }
    batch.push(entry);
    batchLength += entry[1].length;
  }
  if (batch.length > 0) Object.assign(result, await translateBatch(batch));
  return result;
}

function collectFileChanges(filePath, existingMessages) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const replacements = [];
  const hookOwners = new Map();
  const ownersWithExistingTranslator = new Set();
  const unresolved = [];
  let usesI18nText = false;

  function registerMessage(text) {
    const id = createMessageId(text);
    existingMessages.set(id, text);
    return id;
  }

  function addReplacement(start, end, value) {
    if (
      replacements.some(
        (replacement) => start < replacement.end && end > replacement.start,
      )
    ) {
      return false;
    }
    replacements.push({ start, end, value });
    return true;
  }

  function getTranslator(node, text) {
    const owner = findHookOwner(node);
    if (!owner) {
      const line =
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      unresolved.push(
        `${path.relative(sourceRoot, filePath)}:${line} [${ts.SyntaxKind[node.kind]}]: ${text}`,
      );
      return null;
    }
    if (!hookOwners.has(owner)) {
      const ownerText = owner.getText(sourceFile);
      const existingTranslator = ownerText.match(
        /\bconst\s+(\w+)\s*=\s*useAutoTranslations\(\)/,
      );
      hookOwners.set(
        owner,
        existingTranslator?.[1] ??
          (/\btAuto\b/.test(ownerText) ? "tAutoI18n" : "tAuto"),
      );
      if (existingTranslator) ownersWithExistingTranslator.add(owner);
    }
    return hookOwners.get(owner);
  }

  function replaceLiteral(node, contextNode = node) {
    const text = normalizeText(node.text);
    if (!isTranslatable(contextNode, text, { allowDynamicSibling: true })) {
      return false;
    }
    const translator = getTranslator(contextNode, text);
    if (!translator) return false;
    const id = registerMessage(text);
    return addReplacement(
      node.getStart(sourceFile),
      node.getEnd(),
      `${translator}("${id}")`,
    );
  }

  function replaceExpressionStrings(node, contextNode) {
    if (ts.isTemplateExpression(node)) {
      const translation = createTemplateTranslation(
        node,
        sourceFile,
        registerMessage,
      );
      if (!translation) return;
      const translator = getTranslator(contextNode, node.getText(sourceFile));
      if (!translator) return;
      addReplacement(
        node.getStart(sourceFile),
        node.getEnd(),
        `${translator}("${translation.id}", { ${translation.values} })`,
      );
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      replaceLiteral(node, contextNode);
      return;
    }
    if (ts.isParenthesizedExpression(node)) {
      replaceExpressionStrings(node.expression, contextNode);
      return;
    }
    if (ts.isConditionalExpression(node)) {
      replaceExpressionStrings(node.whenTrue, contextNode);
      replaceExpressionStrings(node.whenFalse, contextNode);
      return;
    }
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
        ts.SyntaxKind.PlusToken,
      ].includes(node.operatorToken.kind)
    ) {
      replaceExpressionStrings(node.left, contextNode);
      replaceExpressionStrings(node.right, contextNode);
    }
  }

  function visit(node) {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText() === "I18nText"
    ) {
      const idAttribute = node.attributes.properties.find(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText() === "id" &&
          attribute.initializer &&
          ts.isStringLiteral(attribute.initializer),
      );
      if (idAttribute) {
        if (findHookOwner(node)) {
          const translator = getTranslator(node, idAttribute.initializer.text);
          addReplacement(
            node.getStart(sourceFile),
            node.getEnd(),
            `{${translator}("${idAttribute.initializer.text}")}`,
          );
          return;
        }
      }
      usesI18nText = true;
      return;
    }

    if (ts.isJsxText(node)) {
      const rawText = node.getText(sourceFile);
      const text = normalizeText(rawText);
      if (isTranslatable(node, text, { allowDynamicSibling: true })) {
        const translator = getTranslator(node, text);
        if (translator) {
          const id = registerMessage(text);
          addReplacement(
            node.getStart(sourceFile),
            node.getEnd(),
            `${/^\s/.test(rawText) ? " " : ""}{${translator}("${id}")}${/\s$/.test(rawText) ? " " : ""}`,
          );
        }
      }
    }

    if (
      ts.isConditionalExpression(node) &&
      ts.isJsxExpression(node.parent) &&
      !ts.isJsxAttribute(node.parent.parent)
    ) {
      replaceExpressionStrings(node.whenTrue, node);
      replaceExpressionStrings(node.whenFalse, node);
      return;
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      translatedVariableNamePattern.test(node.name.text) &&
      node.initializer &&
      ts.isConditionalExpression(node.initializer)
    ) {
      replaceExpressionStrings(node.initializer, node);
    }

    if (
      ts.isJsxAttribute(node) &&
      translatedAttributes.has(node.name.getText())
    ) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer)) {
        const text = normalizeText(initializer.text);
        if (isTranslatable(node, text, { allowDynamicSibling: true })) {
          const translator = getTranslator(node, text);
          if (translator) {
            const id = registerMessage(text);
            addReplacement(
              initializer.getStart(sourceFile),
              initializer.getEnd(),
              `{${translator}("${id}")}`,
            );
          }
        }
      } else if (
        initializer &&
        ts.isJsxExpression(initializer) &&
        initializer.expression
      ) {
        replaceExpressionStrings(initializer.expression, node);
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const target = node.expression.expression.getText(sourceFile);
      const method = node.expression.name.text;
      if (
        target === "toast" &&
        translatedToastMethods.has(method) &&
        node.arguments[0]
      ) {
        replaceExpressionStrings(node.arguments[0], node);
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["showErrorToast", "showSuccessToast"].includes(node.expression.text)
    ) {
      const argsToTranslate =
        node.expression.text === "showErrorToast"
          ? node.arguments.slice(0, 2)
          : node.arguments.slice(0, 1);
      argsToTranslate.forEach((argument) =>
        replaceExpressionStrings(argument, node),
      );
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "setError" &&
      node.arguments.length === 1
    ) {
      replaceExpressionStrings(node.arguments[0], node);
    }

    if (ts.isPropertyAssignment(node)) {
      const propertyName = getPropertyName(node.name);
      if (
        propertyName &&
        translatedObjectProperties.has(propertyName) &&
        !hasTranslationKeySibling(node)
      ) {
        replaceExpressionStrings(node.initializer, node);
      }
    }

    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  for (const [owner, translator] of hookOwners) {
    if (ownersWithExistingTranslator.has(owner)) continue;
    addReplacement(
      owner.body.getStart(sourceFile) + 1,
      owner.body.getStart(sourceFile) + 1,
      `\n  const ${translator} = useAutoTranslations();`,
    );
  }

  const needsAutoHookImport =
    hookOwners.size > 0 || /\buseAutoTranslations\s*\(/.test(source);
  if (needsAutoHookImport || usesI18nText) {
    const i18nImports = sourceFile.statements.filter(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === "@/src/features/i18n/I18nText",
    );
    const importValue = !needsAutoHookImport
      ? 'import { I18nText } from "@/src/features/i18n/I18nText";'
      : usesI18nText
        ? 'import { I18nText, useAutoTranslations } from "@/src/features/i18n/I18nText";'
        : 'import { useAutoTranslations } from "@/src/features/i18n/I18nText";';
    if (i18nImports.length > 0) {
      const requiredImports = [
        ...(usesI18nText ? ["I18nText"] : []),
        ...(needsAutoHookImport ? ["useAutoTranslations"] : []),
      ];
      const existingImports = new Set(
        i18nImports.flatMap((declaration) => {
          const bindings = declaration.importClause?.namedBindings;
          return bindings && ts.isNamedImports(bindings)
            ? bindings.elements.map((element) => element.name.text)
            : [];
        }),
      );
      const hasRequiredImports = requiredImports.every((name) =>
        existingImports.has(name),
      );

      if (!hasRequiredImports) {
        const importedSpecifiers = i18nImports.flatMap((declaration) => {
          const bindings = declaration.importClause?.namedBindings;
          return bindings && ts.isNamedImports(bindings)
            ? bindings.elements.map((element) => element.getText(sourceFile))
            : [];
        });
        const importedNames = new Set(
          i18nImports.flatMap((declaration) => {
            const bindings = declaration.importClause?.namedBindings;
            return bindings && ts.isNamedImports(bindings)
              ? bindings.elements.map((element) => element.name.text)
              : [];
          }),
        );
        const missingImports = requiredImports.filter(
          (name) => !importedNames.has(name),
        );
        const mergedImportValue = `import { ${[
          ...new Set([...importedSpecifiers, ...missingImports]),
        ].join(", ")} } from "@/src/features/i18n/I18nText";`;

        addReplacement(
          i18nImports[0].getStart(sourceFile),
          i18nImports[0].getEnd(),
          mergedImportValue,
        );
      }
      for (const duplicateImport of hasRequiredImports
        ? []
        : i18nImports.slice(1)) {
        addReplacement(
          duplicateImport.getStart(sourceFile),
          duplicateImport.getEnd(),
          "",
        );
      }
    } else {
      const imports = sourceFile.statements.filter(ts.isImportDeclaration);
      const importPosition = imports.at(-1)?.getEnd() ?? 0;
      addReplacement(importPosition, importPosition, `\n${importValue}`);
    }
  }

  return { filePath, source, replacements, unresolved };
}

async function main() {
  const existingEn = JSON.parse(fs.readFileSync(enCatalogPath, "utf8"));
  const existingZh = JSON.parse(fs.readFileSync(zhCatalogPath, "utf8"));
  const messages = new Map(Object.entries(existingEn));
  const fileChanges = [];
  const unresolved = [];
  const interpolationMismatches = findInterpolationMismatches(
    existingEn,
    existingZh,
  );

  for (const filePath of listTsxFiles(sourceRoot)) {
    const change = collectFileChanges(filePath, messages);
    if (change.replacements.length > 0) fileChanges.push(change);
    unresolved.push(...change.unresolved);
  }

  if (checkOnly) {
    if (
      fileChanges.length > 0 ||
      unresolved.length > 0 ||
      interpolationMismatches.length > 0
    ) {
      console.error(
        `${fileChanges.length} files contain untranslated UI text; ${unresolved.length} messages require manual migration; ${interpolationMismatches.length} translations have invalid interpolation variables. Run pnpm --filter web i18n:migrate-static.`,
      );
      fileChanges
        .slice(0, 500)
        .forEach((change) =>
          console.error(path.relative(sourceRoot, change.filePath)),
        );
      unresolved.slice(0, 500).forEach((message) => console.error(message));
      interpolationMismatches
        .slice(0, 500)
        .forEach((message) => console.error(message));
      process.exit(1);
    }
    console.log("Static UI text audit passed.");
    return;
  }

  const missingTranslations = [...messages.entries()].filter(
    ([id]) => existingZh[id] === undefined,
  );
  const translated = await translateEntries(missingTranslations);
  for (const change of fileChanges) {
    let output = change.source;
    for (const replacement of change.replacements.sort(
      (a, b) => b.start - a.start,
    )) {
      output =
        output.slice(0, replacement.start) +
        replacement.value +
        output.slice(replacement.end);
    }
    fs.writeFileSync(change.filePath, output);
  }

  const sortedEn = Object.fromEntries(
    [...messages.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
  const sortedZh = Object.fromEntries(
    Object.keys(sortedEn).map((id) => [
      id,
      exactTranslationOverrides[sortedEn[id]] ??
        normalizeProductTerms(existingZh[id] ?? translated[id]),
    ]),
  );
  fs.writeFileSync(enCatalogPath, `${JSON.stringify(sortedEn, null, 2)}\n`);
  fs.writeFileSync(zhCatalogPath, `${JSON.stringify(sortedZh, null, 2)}\n`);
  console.log(
    `Migrated ${fileChanges.length} files and added ${missingTranslations.length} translations.`,
  );
  if (unresolved.length > 0) {
    console.warn(`${unresolved.length} messages require manual migration:`);
    unresolved.slice(0, 500).forEach((message) => console.warn(message));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
