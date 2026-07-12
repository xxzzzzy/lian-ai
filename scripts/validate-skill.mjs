import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const skill = fs.readFileSync(path.join(root, "SKILL.md"), "utf8");
const openaiYaml = fs.readFileSync(
  path.join(root, "agents", "openai.yaml"),
  "utf8",
);
const safety = fs.readFileSync(
  path.join(root, "references", "safety-protocol.md"),
  "utf8",
);
const evals = JSON.parse(
  fs.readFileSync(path.join(root, "evals", "evals.json"), "utf8"),
);

const checks = [
  ["frontmatter name", /^---[\s\S]*?name:\s+lian-ai/m.test(skill)],
  [
    "explicit-only invocation",
    /allow_implicit_invocation:\s+false/.test(openaiYaml),
  ],
  [
    "six core models",
    (skill.match(/^### 模型[一二三四五六]：/gm) || []).length === 6,
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
    "strict crisis routing",
    skill.includes("必须读取并严格执行 `references/safety-protocol.md`"),
  ],
  [
    "no hotline before location",
    safety.includes("确认地区前，不列出具体号码"),
  ],
  ["official crisis sources", safety.includes("政府卫生部门")],
  ["eleven evaluation cases", evals.cases.length === 11],
  ["no INFJ routing", !skill.includes("INFJ")],
  [
    "no direct impersonation rule",
    !skill.includes("直接以瑞恩的身份回应"),
  ],
  [
    "generic romance does not trigger",
    skill.includes("不在普通恋爱问题中自动触发"),
  ],
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
