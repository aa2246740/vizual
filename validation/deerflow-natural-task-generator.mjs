import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, "true");
  }
}

const scenario = args.get("scenario") || "";
const outDir = args.get("out-dir") || os.tmpdir();
const seed = args.get("seed") || new Date().toISOString().replace(/[:.]/g, "-");
const cdpBase = args.get("cdp-base") || "http://127.0.0.1:9227";
const deerflowUrl = args.get("deerflow-url") || "http://localhost:2026";

const scenarioBuilders = {
  n2: buildN2,
  n5: buildN5,
  n6: buildN6,
  activity: buildActivity,
  stream: buildStream,
};

if (!scenarioBuilders[scenario]) {
  console.error(`Usage: node validation/deerflow-natural-task-generator.mjs --scenario <n2|n5|n6|activity|stream> [--out-dir /tmp]`);
  process.exit(2);
}

function choose(items) {
  let hash = 0;
  for (const char of `${seed}:${scenario}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

function buildN2() {
  const topic = choose([
    {
      slug: "inventory-reorder",
      text: [
        "我想给非技术同事讲清楚安全库存和补货点为什么不是一个固定数字。",
        "请做一个可以自己调参数的小实验：日均销量、到货提前期、需求波动都能变动，然后能直观看到缺货风险和库存占用怎么变化。",
        "不要只给文字结论，互动必须对理解有帮助；不需要接任何外部系统。",
      ].join("\n"),
    },
    {
      slug: "cache-hit-rate",
      text: [
        "帮我解释缓存命中率为什么会影响接口延迟。",
        "希望有一个可以调请求总量、热门数据占比、缓存容量的小实验，让产品经理能看到命中率和平均耗时怎么一起变化。",
        "所有数据都用本地示例，不要假装调用真实服务。",
      ].join("\n"),
    },
    {
      slug: "queue-waiting",
      text: [
        "我要给客服团队解释为什么排队系统在接近满负载时等待时间会突然变长。",
        "请做一个能调整到达速度、处理速度和坐席数量的小实验，让人能看到等待人数和等待时间的变化。",
        "互动要有实际意义，不要放装饰按钮。",
      ].join("\n"),
    },
  ]);
  return { expectation: "n2", slug: `n2-${topic.slug}-${seed}`, prompt: topic.text, interact: true };
}

function buildN5() {
  const topic = choose([
    {
      slug: "conference-landing",
      text: [
        "请做一个完整的 HTML landing page，用于一个虚构活动「Quiet Systems Summit」。",
        "我要的是网页 artifact：有 CSS、hero、议程、讲者、报名按钮的页面结构。",
        "不要把它做成聊天里的图表、看板或交互分析面板。",
      ].join("\n"),
    },
    {
      slug: "mini-game",
      text: [
        "请做一个可以保存成单文件 HTML 的小网页游戏：键盘控制方块躲避下落障碍物。",
        "需要包含 HTML、CSS、JS 的完整代码，能在浏览器打开玩。",
        "这不是数据分析，也不要生成内联图表或诊断面板。",
      ].join("\n"),
    },
    {
      slug: "react-widget",
      text: [
        "请写一个 React 组件文件，实现一个简洁的订阅价格页，有月付/年付切换和三档套餐。",
        "我需要的是代码 artifact，不是聊天里的可视化分析面板。",
        "请按普通前端实现方式给出文件内容。",
      ].join("\n"),
    },
  ]);
  return { expectation: "n5", slug: `n5-${topic.slug}-${seed}`, prompt: topic.text, interact: false };
}

function buildN6() {
  const topic = choose([
    {
      slug: "journey-uncertainty",
      text: [
        "我想分析一个跨部门客户旅程：每一步都有耗时范围、不确定性、负责人、依赖和阻塞原因。",
        "请尽量做成容易理解的展示；如果某些复杂表达不适合直接画出来，就保留清楚的文字解释和可读的降级结果，不要让整轮回答失败。",
        "数据：线索进入 1-3 天 市场部 依赖表单完整；方案确认 2-8 天 销售部 依赖预算；安全评审 5-15 天 安全部 依赖材料；采购审批 3-20 天 财务部 依赖合同。",
      ].join("\n"),
    },
    {
      slug: "multi-axis-risk",
      text: [
        "请帮我表达一个风险判断：每个项目同时有影响范围、发生概率、可恢复性、信心区间和负责人。",
        "如果不能完美呈现五个维度，也要给我一个不空白、不崩溃、能读懂的替代表达，并说明哪些表达被简化了。",
        "项目A 影响高 概率中 恢复慢 信心60% Owner平台；项目B 影响中 概率高 恢复快 信心75% Owner增长；项目C 影响低 概率低 恢复中 信心55% Owner运营。",
      ].join("\n"),
    },
    {
      slug: "dependency-map",
      text: [
        "我有一组互相依赖的上线任务，想看关键阻塞点和风险说明。",
        "如果图形表达受限，回答也必须保留完整文字分析，不能只显示一个空框或报错。",
        "任务：埋点依赖字段确认；字段确认依赖法务审核；灰度依赖埋点和客服话术；全量发布依赖灰度指标和回滚预案。",
      ].join("\n"),
    },
  ]);
  return { expectation: "n6", slug: `n6-${topic.slug}-${seed}`, prompt: topic.text, interact: false };
}

function buildActivity() {
  const topic = choose([
    {
      slug: "vendor-comparison-run",
      text: [
        "请分步骤比较三个客服知识库方案，边做边展示当前进展：先列评价维度，再逐项打分，最后给选择建议。",
        "方案：A 成本低但集成弱；B 成本中等且搜索强；C 成本高但权限和审计最好。",
        "我希望能看清楚任务正在推进到哪一步，而不是只看到最后一段话。",
      ].join("\n"),
    },
    {
      slug: "release-readiness-run",
      text: [
        "请做一次上线准备度检查，分阶段展示：风险盘点、阻塞项、负责人、下一步。",
        "输入：支付回归未完成；客服FAQ已更新；灰度监控缺阈值；回滚脚本已演练；法务确认还差邮件归档。",
        "需要让我在同一轮回答里看到阶段状态和最终结论。",
      ].join("\n"),
    },
  ]);
  return { expectation: "activity", slug: `activity-${topic.slug}-${seed}`, prompt: topic.text, interact: false };
}

function buildStream() {
  const topic = choose([
    {
      slug: "rolling-sales",
      text: [
        "下面的数据按批次到达，请边分析边更新判断，最后汇总趋势和风险。",
        "第1批：周一 销量120 退货6 广告费1800；周二 销量136 退货8 广告费2100。",
        "第2批：周三 销量155 退货15 广告费3100；周四 销量171 退货23 广告费4300。",
        "第3批：周五 销量190 退货35 广告费6200；周六 销量205 退货49 广告费8100。",
        "我想看到随着批次增加，结论如何变化。",
      ].join("\n"),
    },
    {
      slug: "incremental-incidents",
      text: [
        "请按事件到达顺序逐步更新一次故障复盘视图，最后给根因假设。",
        "09:00 错误率 1.2%；09:05 缓存命中率下降；09:12 数据库连接数升高；09:20 订单接口超时；09:32 回滚缓存配置后恢复。",
        "不要只给最终总结，我要能看到信息逐步补充后的判断变化。",
      ].join("\n"),
    },
  ]);
  return { expectation: "stream", slug: `stream-${topic.slug}-${seed}`, prompt: topic.text, interact: false };
}

const task = scenarioBuilders[scenario]();
await fs.mkdir(outDir, { recursive: true });
const promptFile = path.join(outDir, `deerflow-${task.slug}.txt`);
await fs.writeFile(promptFile, task.prompt);

const interactFlag = task.interact ? " --interact" : "";
const command = [
  `DEERFLOW_URL=${deerflowUrl}`,
  `CDP_BASE=${cdpBase}`,
  "node validation/deerflow-natural-browser-runner.mjs",
  `--slug ${task.slug}`,
  `--prompt-file ${promptFile}`,
  "--wait-ms 240000",
  "--max-existing-deerflow-targets 0",
  interactFlag.trim(),
].filter(Boolean).join(" ");

const auditCommand = `node validation/deerflow-evidence-audit.mjs --case ${task.expectation}:<result-json-or-dir>`;

console.log(JSON.stringify({
  scenario,
  expectation: task.expectation,
  slug: task.slug,
  promptFile,
  prompt: task.prompt,
  interact: task.interact,
  runCommand: command,
  runnerArgs: [
    "validation/deerflow-natural-browser-runner.mjs",
    "--slug",
    task.slug,
    "--prompt-file",
    promptFile,
    "--wait-ms",
    "240000",
    "--max-existing-deerflow-targets",
    "0",
    ...(task.interact ? ["--interact"] : []),
  ],
  auditCommand,
  registryIdByScenario: {
    n2: "deerflow.n2-concept-interaction-current",
    n5: "deerflow.n5-explicit-web-current",
    n6: "deerflow.n6-failure-absorption",
    activity: "deerflow.agui-natural-activity",
    stream: "deerflow.stream-natural-incremental",
  }[scenario],
}, null, 2));
