import type { ParsedSchema } from '../../core/types'
import type { OrgChartParsed, OrgPerson } from './parser'
import { tc } from '../../core/theme-colors'

function renderPerson(person: OrgPerson): HTMLElement {
  const node = document.createElement('div')
  node.className = 'org-node'
  node.setAttribute('data-person', person.name)

  const card = document.createElement('div')
  card.className = 'org-card'

  const nameEl = document.createElement('div')
  nameEl.className = 'org-name'
  nameEl.textContent = person.name
  card.appendChild(nameEl)

  if (person.title) {
    const titleEl = document.createElement('div')
    titleEl.className = 'org-title'
    titleEl.textContent = person.title
    card.appendChild(titleEl)
  }

  if (person.department) {
    const deptEl = document.createElement('div')
    deptEl.className = 'org-department'
    deptEl.textContent = person.department
    card.appendChild(deptEl)
  }

  node.appendChild(card)

  if (person.children.length > 0) {
    const childrenEl = document.createElement('div')
    childrenEl.className = 'org-children'
    for (const child of person.children) {
      childrenEl.appendChild(renderPerson(child))
    }
    node.appendChild(childrenEl)
  }

  return node
}

export function renderOrgChart(parsed: ParsedSchema): HTMLElement {
  const chart = parsed as OrgChartParsed

  if (!chart.valid || !chart.root.name) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = parsed.originalInput !== undefined ? JSON.stringify(parsed.originalInput) : 'undefined'
    container.appendChild(inner)

    return container
  }

  const accent = tc('--rk-accent')
  const bgSecondary = tc('--rk-bg-secondary')
  const borderSubtle = tc('--rk-border-subtle')

  const wrapper = document.createElement('div')
  wrapper.className = 'org-chart'
  wrapper.setAttribute('data-schema', 'org-chart')

  // 注入组织架构连接线样式（使用 scoped 选择器避免外部CSS冲突）
  const style = document.createElement('style')
  style.textContent = `
    .org-chart[data-schema="org-chart"] {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
      overflow-x: auto;
    }
    .org-chart[data-schema="org-chart"] .org-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      margin-bottom: 0;
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
    }
    .org-chart[data-schema="org-chart"] .org-card {
      background: ${bgSecondary};
      border: 1px solid ${borderSubtle};
      border-radius: 8px;
      padding: 12px 20px;
      min-width: 120px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .org-chart[data-schema="org-chart"] .org-name {
      font-size: 14px;
      font-weight: 600;
      color: ${tc('--rk-text-primary')};
    }
    .org-chart[data-schema="org-chart"] .org-title {
      font-size: 11px;
      color: ${tc('--rk-text-tertiary')};
      margin-top: 2px;
    }
    .org-chart[data-schema="org-chart"] .org-department {
      font-size: 10px;
      color: ${accent};
      margin-top: 4px;
      padding: 1px 6px;
      background: ${accent}18;
      border-radius: 3px;
      display: inline-block;
    }
    .org-chart[data-schema="org-chart"] .org-children {
      display: flex;
      gap: 16px;
      position: relative;
      padding-top: 28px;
      margin-left: 0;
      border-left: none;
      padding-left: 0;
    }
    /* 父节点到子层级的垂直连接线 */
    .org-chart[data-schema="org-chart"] .org-children::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 2px;
      height: 28px;
      background: ${borderSubtle};
    }
    /* 每个子节点的垂直+水平连接线 */
    .org-chart[data-schema="org-chart"] .org-children > .org-node {
      position: relative;
    }
    .org-chart[data-schema="org-chart"] .org-children > .org-node::before {
      content: '';
      position: absolute;
      top: -28px;
      left: 50%;
      width: 2px;
      height: 28px;
      background: ${borderSubtle};
    }
    .org-chart[data-schema="org-chart"] .org-children > .org-node::after {
      content: '';
      position: absolute;
      top: -28px;
      height: 2px;
      background: ${borderSubtle};
    }
    /* 第一个子节点：连接线从中间到右边 */
    .org-chart[data-schema="org-chart"] .org-children > .org-node:first-child::after {
      left: 50%;
      right: 0;
    }
    /* 最后一个子节点：连接线从左边到中间 */
    .org-chart[data-schema="org-chart"] .org-children > .org-node:last-child::after {
      left: 0;
      right: 50%;
    }
    /* 中间子节点：连接线贯穿整个宽度 */
    .org-chart[data-schema="org-chart"] .org-children > .org-node:not(:first-child):not(:last-child)::after {
      left: 0;
      right: 0;
    }
    /* 只有一个子节点时，不需要水平线 */
    .org-chart[data-schema="org-chart"] .org-children > .org-node:only-child::after {
      display: none;
    }
  `
  wrapper.appendChild(style)
  wrapper.appendChild(renderPerson(chart.root))

  return wrapper
}
