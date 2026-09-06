import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");

const skill = read("SKILL.md");
const openaiYaml = read("agents", "openai.yaml");
const safety = read("references", "safety-protocol.md");
const models = read("references", "六个核心心智模型.md");
const timeline = read("references", "research", "06-timeline.md");
const supplement = read("references", "research", "08-supplement-2026.md");
const evals = JSON.parse(read("evals", "evals.json"));

// 六个模型在重构中被抽到 references/六个核心心智模型.md。
// 旧版校验只在 SKILL.md 中查找标题，因此该检查长期失败。这里改为检查模型文件本身。
const modelHeadings = (models.match(/^### 模型[一二三四五六]：/gm) || []).length;

const checks = [
  ["frontmatter name", /^---[\s\S]*?name:\s+lian-ai/m.test(skill)],
  [
    "explicit-only invocation",
    /allow_implicit_invocation:\s+false/.test(openaiYaml),
  ],
  ["six core models", modelHeadings === 6],
  [
    "models routed from SKILL.md",
    skill.includes("references/六个核心心智模型.md"),
  ],
  [
    "every model states its limits",
    (models.match(/^\*\*局限\*\*/gm) || []).length >= 6,
  ],
  [
    "case-level inference disclosure",
    skill.includes("未见公开材料讨论这一具体场景"),
  ],
  [
    "timeline routing",
    skill.includes("必须读取 `references/research/06-timeline.md`"),
  ],
  [
    "supplement routing",
    skill.includes("必须读取 `references/research/08-supplement-2026.md`"),
  ],
  ["supplement stays a layer, not a 7th model", !/^### 模型七/m.test(supplement)],
  ["one supplement item per answer", skill.includes("一次回答只用一条补强条目")],
  ["no ghostwriting scripts", skill.includes("不做代聊脚本供应商")],
  [
    "complaint heuristic constrained",
    skill.includes("不把“抱怨指向缺失”这类假设应用到用户没有提供的经历上"),
  ],
  ["timeline covers 2026 stage six", timeline.includes("阶段六")],
  [
    "strict crisis routing",
    skill.includes("必须读取并严格执行 `references/safety-protocol.md`"),
  ],
  [
    "no hotline before location",
    safety.includes("确认地区前，不列出具体号码"),
  ],
  ["official crisis sources", safety.includes("政府卫生部门")],
  ["eleven evaluation cases", evals.cases.length >= 11],
  ["no INFJ routing", !skill.includes("INFJ")],
  ["no direct impersonation rule", !skill.includes("直接以瑞恩的身份回应")],
  [
    "generic romance does not trigger",
    skill.includes("不在普通恋爱问题中自动触发"),
  ],
  ["source count updated", skill.includes("338份")],
];

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed += 1;
}

if (failed) {
  console.error(`Validation failed: ${failed}/${checks.length} checks.`);
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${checks.length}/${checks.length} checks.`);
}
