function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    if (/"props"\s*:/u.test(value)) {
      try {
        return parseJsonMergingDuplicateProps(value);
      } catch {
        return parsed;
      }
    }
    return parsed;
  } catch {
    try {
      return parseJsonMergingDuplicateProps(value);
    } catch {
      const repaired = repairUnescapedQuotesInJsonStrings(value);
      if (repaired !== value) {
        try {
          return JSON.parse(repaired);
        } catch {
          try {
            return parseJsonMergingDuplicateProps(repaired);
          } catch {
            return value;
          }
        }
      }
      return value;
    }
  }
}

function repairUnescapedQuotesInJsonStrings(source) {
  const text = String(source || '');
  let result = '';
  let inString = false;
  let escaped = false;
  let changed = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }
    if (char !== '"') {
      result += char;
      continue;
    }
    if (!inString) {
      inString = true;
      result += char;
      continue;
    }
    let nextIndex = index + 1;
    while (/\s/u.test(text[nextIndex] || '')) nextIndex += 1;
    const next = text[nextIndex] || '';
    if (!next || next === ':' || next === ',' || next === '}' || next === ']') {
      inString = false;
      result += char;
      continue;
    }
    result += '\\"';
    changed = true;
  }
  return changed ? result : text;
}

function parseJsonMergingDuplicateProps(source) {
  const text = String(source).trim();
  let index = 0;

  const skipWhitespace = () => {
    while (/\s/u.test(text[index] || '')) index += 1;
  };
  const parseString = () => {
    const start = index;
    index += 1;
    while (index < text.length) {
      const char = text[index];
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === '"') {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      index += 1;
    }
    throw new Error('Unterminated JSON string');
  };
  const parseNumber = () => {
    const start = index;
    while (/[-+0-9.eE]/u.test(text[index] || '')) index += 1;
    if (start === index) throw new Error('Expected JSON value');
    const value = Number(text.slice(start, index));
    if (!Number.isFinite(value)) throw new Error('Invalid JSON number');
    return value;
  };
  const parseLiteral = (literal, value) => {
    if (!text.startsWith(literal, index)) throw new Error(`Expected ${literal}`);
    index += literal.length;
    return value;
  };
  const parseArray = () => {
    index += 1;
    const values = [];
    skipWhitespace();
    if (text[index] === ']') {
      index += 1;
      return values;
    }
    while (index < text.length) {
      values.push(parseValue());
      skipWhitespace();
      if (text[index] === ']') {
        index += 1;
        return values;
      }
      if (text[index] !== ',') throw new Error('Expected JSON array comma');
      index += 1;
    }
    throw new Error('Unterminated JSON array');
  };
  const parseObject = () => {
    index += 1;
    const record = {};
    skipWhitespace();
    if (text[index] === '}') {
      index += 1;
      return record;
    }
    while (index < text.length) {
      skipWhitespace();
      if (text[index] !== '"') throw new Error('Expected JSON object key');
      const key = parseString();
      skipWhitespace();
      if (text[index] !== ':') throw new Error('Expected JSON object colon');
      index += 1;
      const value = parseValue();
      if (
        key === 'props'
        && isPlainObject(record[key])
        && isPlainObject(value)
      ) {
        record[key] = { ...record[key], ...value };
      } else {
        record[key] = value;
      }
      skipWhitespace();
      if (text[index] === '}') {
        index += 1;
        return record;
      }
      if (text[index] !== ',') throw new Error('Expected JSON object comma');
      index += 1;
    }
    throw new Error('Unterminated JSON object');
  };
  const parseValue = () => {
    skipWhitespace();
    const char = text[index];
    if (char === '"') return parseString();
    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === 't') return parseLiteral('true', true);
    if (char === 'f') return parseLiteral('false', false);
    if (char === 'n') return parseLiteral('null', null);
    return parseNumber();
  };

  const parsed = parseValue();
  skipWhitespace();
  if (index !== text.length) throw new Error('Unexpected trailing JSON content');
  return parsed;
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function fieldName(value, fallback) {
  const raw = String(value || fallback || 'value').trim();
  return raw
    .replace(/[^\p{L}\p{N}_]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    || fallback
    || 'value';
}

function numericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/%/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (value && typeof value === 'object') {
    const parsed = Number(value.y ?? value.value ?? value.r ?? value.size);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function chartNumericFields(props = {}) {
  const fields = new Set();
  const add = value => {
    if (typeof value === 'string' && value.trim()) fields.add(value.trim());
  };
  if (typeof props.y === 'string') add(props.y);
  if (Array.isArray(props.y)) {
    for (const item of props.y) {
      if (typeof item === 'string') add(item);
      else if (item && typeof item === 'object') add(item.y || item.key || item.field);
    }
  }
  if (Array.isArray(props.series)) {
    for (const series of props.series) {
      if (series && typeof series === 'object') add(series.y);
    }
  }
  return fields;
}

function normalizeChartNumericData(component, props = {}) {
  if (!/Chart$/u.test(String(component || '')) || !Array.isArray(props.data)) return props;
  const fields = chartNumericFields(props);
  if (!fields.size) return props;
  let changed = false;
  const data = props.data.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const next = { ...row };
    for (const field of fields) {
      if (!(field in next)) continue;
      const value = numericValue(next[field]);
      if (typeof value === 'number' && next[field] !== value) {
        next[field] = value;
        changed = true;
      }
    }
    return next;
  });
  return changed ? { ...props, data } : props;
}

function normalizeComponentName(value) {
  const text = stripVizualNamespace(value).trim();
  const key = text.replace(/[\s_-]+/g, '').toLowerCase();
  const aliases = {
    board: 'Column',
    chart: 'BarChart',
    area: 'AreaChart',
    areachart: 'AreaChart',
    bar: 'BarChart',
    barchart: 'BarChart',
    bubble: 'BubbleChart',
    bubblechart: 'BubbleChart',
    combo: 'ComboChart',
    combochart: 'ComboChart',
    datatable: 'DataTable',
    donut: 'PieChart',
    donutchart: 'PieChart',
    funnel: 'FunnelChart',
    funnelchart: 'FunnelChart',
    heatmap: 'HeatmapChart',
    heatmapchart: 'HeatmapChart',
    histogram: 'HistogramChart',
    histogramchart: 'HistogramChart',
    kpi: 'KpiDashboard',
    kpicard: 'KpiDashboard',
    kpidashboard: 'KpiDashboard',
    line: 'LineChart',
    linechart: 'LineChart',
    markdown: 'Markdown',
    metriccard: 'KpiDashboard',
    pie: 'PieChart',
    piechart: 'PieChart',
    radar: 'RadarChart',
    radarchart: 'RadarChart',
    scatter: 'ScatterChart',
    scatterchart: 'ScatterChart',
    table: 'DataTable',
    view: 'View',
    vizualroot: 'Column',
    vizstack: 'Column',
    waterfall: 'WaterfallChart',
    waterfallchart: 'WaterfallChart',
    hstack: 'Row',
    horizontallayout: 'Row',
    horizontalstack: 'Row',
    stackhorizontal: 'Row',
    vstack: 'Column',
    verticallayout: 'Column',
    verticalstack: 'Column',
    stackvertical: 'Column',
  };
  return aliases[key] || text;
}

function looksLikeVizualNativeInput(value) {
  if (Array.isArray(value)) {
    return value.some(item => looksLikeVizualNativeInput(item));
  }
  if (!value || typeof value !== 'object') return false;
  if (typeof value.root === 'string' && value.elements && typeof value.elements === 'object') return true;
  if (value.root && typeof value.root === 'object' && (Array.isArray(value.elements) || value.elements && typeof value.elements === 'object')) return true;
  if (value.root && typeof value.root === 'object' && (value.root.props || value.root.chartType || value.root.component || value.root.componentType)) return true;
  if (Array.isArray(value.elements) && value.elements.some(item => item?.component || item?.type)) return true;
  if (value.createSurface || value.updateDataModel || value.updateComponents || value.appendDataModel || value.patchSurface || value.deleteSurface) return true;
  if (typeof value.version === 'string' && (value.createSurface || value.updateDataModel || value.updateComponents || value.appendDataModel || value.patchSurface || value.deleteSurface)) return true;
  if (typeof value.type === 'string' && (value.type.startsWith('surface.') || value.type.startsWith('vizual.'))) return true;
  return false;
}

function normalizeChartArrayProps(component, props = {}) {
  const baseProps = normalizeChartNumericData(component, props);
  const xValues = Array.isArray(baseProps.x) ? baseProps.x : Array.isArray(baseProps.labels) ? baseProps.labels : null;
  const inlineSeries = Array.isArray(baseProps.data) && baseProps.data.length === 1 && baseProps.data[0] && typeof baseProps.data[0] === 'object'
    ? baseProps.data[0]
    : null;
  const yValues = Array.isArray(baseProps.y)
    ? baseProps.y
    : Array.isArray(baseProps.values)
      ? baseProps.values
      : Array.isArray(inlineSeries?.y)
        ? inlineSeries.y
        : Array.isArray(inlineSeries?.data)
          ? inlineSeries.data
          : null;
  if (!xValues || !yValues || xValues.length !== yValues.length) return baseProps;
  if (!/Chart$/u.test(String(component || ''))) return baseProps;
  return normalizeChartNumericData(component, {
    ...baseProps,
    x: 'label',
    y: 'value',
    data: xValues.map((label, index) => ({
      label: String(label),
      value: numericValue(yValues[index]),
    })),
  });
}

function componentFromRootChart(root = {}) {
  const raw = String(root.component || root.componentType || root.chartType || root.type || '').toLowerCase();
  const chartType = raw === 'chart' ? String(root.chartType || '').toLowerCase() : raw;
  const map = {
    area: 'AreaChart',
    bar: 'BarChart',
    bubble: 'BubbleChart',
    combo: 'ComboChart',
    mixed: 'ComboChart',
    line: 'LineChart',
    pie: 'PieChart',
    doughnut: 'PieChart',
    scatter: 'ScatterChart',
    radar: 'RadarChart',
    funnel: 'FunnelChart',
    heatmap: 'HeatmapChart',
    histogram: 'HistogramChart',
    waterfall: 'WaterfallChart',
  };
  if (root.component || root.componentType) return String(root.component || root.componentType);
  return map[chartType] || '';
}

function normalizeNativeSpecShape(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (!('root' in input) && !('elements' in input)) return null;
  if ((!input.elements || (Array.isArray(input.elements) && input.elements.length === 0)) && input.root && typeof input.root === 'object' && !Array.isArray(input.root)) {
      const component = normalizeComponentName(componentFromRootChart(input.root));
      if (component) {
      const id = String(input.root.id || 'chart');
      const props = normalizeChartArrayProps(component, input.root.props && typeof input.root.props === 'object' ? input.root.props : {});
      return {
        source: 'native-shape',
        input: {
          ...input,
          root: id,
          elements: {
            [id]: {
              component,
              props,
            },
          },
        },
      };
    }
  }
  const rawElements = input.elements;
  const elementEntries = Array.isArray(rawElements)
    ? rawElements.map((element, index) => {
        if (!element || typeof element !== 'object' || Array.isArray(element)) return null;
        const id = String(element.id || `element_${index + 1}`);
        const component = normalizeComponentName(String(element.component || element.type || ''));
        const props = normalizeChartArrayProps(component, element.props && typeof element.props === 'object' ? element.props : {});
        return [id, {
          component,
          props,
          ...(Array.isArray(element.children) ? { children: element.children } : {}),
          ...(element.on && typeof element.on === 'object' ? { on: element.on } : {}),
        }];
      }).filter(Boolean)
    : rawElements && typeof rawElements === 'object'
      ? Object.entries(rawElements).map(([id, element]) => {
          if (!element || typeof element !== 'object' || Array.isArray(element)) return null;
          const component = normalizeComponentName(String(element.component || element.type || ''));
          const props = normalizeChartArrayProps(component, element.props && typeof element.props === 'object' ? element.props : {});
          const next = {
            ...element,
            component,
            props,
          };
          if (element.component == null && element.type != null) delete next.type;
          return [id, next];
        }).filter(Boolean)
      : [];
  if (!elementEntries.length) return null;
  const elements = Object.fromEntries(elementEntries);
  const requestedRoot = typeof input.root === 'string'
    ? input.root
    : input.root && typeof input.root === 'object' && typeof input.root.id === 'string'
      ? input.root.id
      : '';
  const firstId = elementEntries[0][0];
  const root = requestedRoot && elements[requestedRoot] ? requestedRoot : firstId;
  const normalized = {
    ...input,
    root,
    elements,
  };
  const changed = input.root !== normalized.root || Array.isArray(rawElements) || JSON.stringify(rawElements) !== JSON.stringify(elements);
  if (!changed) return null;
  return {
    source: 'native-shape',
    input: normalized,
  };
}

function opCreateArrayToVizualSpec(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const createItems = input.filter(item => (
    item
    && typeof item === 'object'
    && !Array.isArray(item)
    && (item.op === 'create' || item.op === 'create_root')
    && item.component
  ));
  if (!createItems.length || createItems.length !== input.length) return null;

  const elements = {};
  const childIdsByParent = new Map();
  const itemIds = new Map();
  const topLevelIds = [];

  const uniqueId = (base, index) => {
    const normalized = String(base || `component-${index + 1}`)
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      || `component-${index + 1}`;
    let id = normalized;
    for (let suffix = 2; elements[id]; suffix += 1) id = `${normalized}-${suffix}`;
    return id;
  };

  createItems.forEach((item, index) => {
    const component = String(item.component);
    const id = uniqueId(item.id || item.elementId || normalizeComponentName(component), index);
    itemIds.set(item, id);
    const props = item.props && typeof item.props === 'object' && !Array.isArray(item.props)
      ? { ...item.props }
      : {};
    if (component === 'Container') {
      delete props.style;
      if (props.gap == null) props.gap = 16;
    }
    const type = component === 'Container' ? 'Column' : normalizeComponentName(component);
    elements[id] = {
      component: type,
      props,
      children: [],
    };
    if (!item.parent) topLevelIds.push(id);
  });

  for (const item of createItems) {
    const id = itemIds.get(item);
    if (item.parent) {
      const parent = String(item.parent);
      const existing = childIdsByParent.get(parent) || [];
      existing.push(id);
      childIdsByParent.set(parent, existing);
    }
  }

  for (const [parent, children] of childIdsByParent) {
    if (elements[parent]) elements[parent].children = children;
  }

  let rootId = '';
  if (topLevelIds.length === 1) {
    rootId = topLevelIds[0];
  } else if (topLevelIds.length > 1) {
    rootId = uniqueId('root', createItems.length);
    elements[rootId] = {
      component: 'Column',
      props: { gap: 16 },
      children: topLevelIds,
    };
  } else {
    const parentIds = new Set(Array.from(childIdsByParent.keys()));
    rootId = itemIds.get(createItems.find(item => parentIds.has(String(itemIds.get(item)))) || createItems[0]);
  }

  const rootElement = elements[rootId];
  const rootChildren = Array.isArray(rootElement?.children)
    ? rootElement.children.filter(childId => elements[childId])
    : [];
  const rootComponent = normalizeComponentName(String(rootElement?.component || rootElement?.type || ''));
  const containerComponents = new Set(['Column', 'Row', 'Card', 'Container', 'Tabs']);
  if (rootElement && rootChildren.length && !containerComponents.has(rootComponent)) {
    rootElement.children = [];
    const wrapperId = uniqueId('root', createItems.length + 1);
    elements[wrapperId] = {
      component: 'Column',
      props: { gap: 16 },
      children: [rootId, ...rootChildren],
    };
    rootId = wrapperId;
  }

  return {
    source: 'op-create-array',
    input: {
      root: String(rootId),
      elements,
    },
  };
}

function opAppendElementsArrayToVizualSpec(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const appendItems = input.filter(item => (
    item
    && typeof item === 'object'
    && !Array.isArray(item)
    && item.op === 'append'
    && Array.isArray(item.elements)
  ));
  if (!appendItems.length || appendItems.length !== input.length) return null;

  const elements = {};
  const referenced = new Set();
  const uniqueId = (base, index) => {
    const normalized = String(base || `element-${index + 1}`)
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      || `element-${index + 1}`;
    let id = normalized;
    for (let suffix = 2; elements[id]; suffix += 1) id = `${normalized}-${suffix}`;
    return id;
  };

  let index = 0;
  for (const item of appendItems) {
    for (const element of item.elements) {
      if (!element || typeof element !== 'object' || Array.isArray(element)) continue;
      const component = normalizeComponentName(String(element.component || element.type || 'Column'));
      const id = uniqueId(element.id || element.elementId || component, index);
      index += 1;
      const props = normalizeChartArrayProps(component, element.props && typeof element.props === 'object' ? element.props : {});
      const children = Array.isArray(element.children) ? element.children.map(String) : [];
      children.forEach(child => referenced.add(child));
      elements[id] = {
        component,
        props,
        ...(children.length ? { children } : {}),
        ...(element.on && typeof element.on === 'object' ? { on: element.on } : {}),
      };
    }
  }
  const ids = Object.keys(elements);
  if (!ids.length) return null;
  const topLevelIds = ids.filter(id => !referenced.has(id));
  let root = topLevelIds.length === 1 ? topLevelIds[0] : '';
  if (!root) {
    root = uniqueId('root', ids.length);
    elements[root] = {
      component: 'Column',
      props: { gap: 16 },
      children: topLevelIds.length ? topLevelIds : ids,
    };
  }
  return {
    source: 'op-append-elements-array',
    input: {
      root,
      elements,
    },
  };
}

function operationCreateComponentArrayToVizualSpec(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const componentItems = input.filter(item => (
    item
    && typeof item === 'object'
    && !Array.isArray(item)
    && item.operation === 'createComponent'
    && item.component
  ));
  if (!componentItems.length || componentItems.length !== input.length) return null;

  const elements = {};
  const uniqueId = (base, index) => {
    const normalized = String(base || `component-${index + 1}`)
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      || `component-${index + 1}`;
    let id = normalized;
    for (let suffix = 2; elements[id]; suffix += 1) id = `${normalized}-${suffix}`;
    return id;
  };

  const childIds = componentItems.map((item, index) => {
    const component = normalizeComponentName(String(item.component));
    const id = uniqueId(item.id || item.elementId || component, index);
    const props = normalizeChartArrayProps(component, item.props && typeof item.props === 'object' ? item.props : {});
    elements[id] = {
      component,
      props,
      ...(Array.isArray(item.children) ? { children: item.children.map(String) } : {}),
      ...(item.on && typeof item.on === 'object' ? { on: item.on } : {}),
    };
    return id;
  });

  const root = childIds.length === 1 ? childIds[0] : uniqueId('root', childIds.length);
  if (childIds.length > 1) {
    elements[root] = {
      component: 'Column',
      props: { gap: 16 },
      children: childIds,
    };
  }
  return {
    source: 'operation-create-component-array',
    input: {
      root,
      elements,
    },
  };
}

function stringifyCellValue(value) {
  if (Array.isArray(value)) return value.map(item => stringifyCellValue(item)).filter(Boolean).join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value == null ? '' : String(value);
}

function rowsFromRecords(records, keys) {
  if (!Array.isArray(records)) return [];
  return records
    .filter(record => record && typeof record === 'object' && !Array.isArray(record))
    .map(record => Object.fromEntries(keys.map(key => [key, stringifyCellValue(record[key])])));
}

function semanticAnalysisToVizualSpec(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const hasAnalysisShape = input.type === 'op-analysis'
    || Array.isArray(input.priorityInsights)
    || Array.isArray(input.metricTrends)
    || Array.isArray(input.analysis)
    || Array.isArray(input.constraints);
  if (!hasAnalysisShape) return null;

  const elements = {
    root: {
      component: 'Column',
      props: { gap: 16 },
      children: [],
    },
  };
  const rootChildren = elements.root.children;
  const title = typeof input.title === 'string' && input.title.trim()
    ? input.title.trim()
    : '分析结果';
  const summaryLines = [];
  if (typeof input.summary === 'string' && input.summary.trim()) summaryLines.push(input.summary.trim());
  if (Array.isArray(input.constraints) && input.constraints.length) {
    summaryLines.push('## 关键约束');
    summaryLines.push(...input.constraints.map(item => `- ${stringifyCellValue(item)}`).filter(line => line !== '- '));
  }
  if (summaryLines.length) {
    elements.summary = {
      component: 'Markdown',
      props: {
        content: `# ${title}\n\n${summaryLines.join('\n')}`,
      },
    };
    rootChildren.push('summary');
  }

  const priorityRows = rowsFromRecords(input.priorityInsights, ['priority', 'issue', 'reason', 'evidence']);
  if (priorityRows.length) {
    elements.priority = {
      component: 'DataTable',
      props: {
        type: 'table',
        title: '优先排查',
        columns: [
          { key: 'priority', label: '优先级' },
          { key: 'issue', label: '问题' },
          { key: 'reason', label: '判读' },
          { key: 'evidence', label: '证据' },
        ],
        data: priorityRows,
        compact: true,
      },
    };
    rootChildren.push('priority');
  }

  const metricRows = rowsFromRecords(input.metricTrends, ['metric', 'trend', 'min', 'max', 'units']);
  if (metricRows.length) {
    elements.metricTrends = {
      component: 'DataTable',
      props: {
        type: 'table',
        title: '指标趋势',
        columns: [
          { key: 'metric', label: '指标' },
          { key: 'trend', label: '趋势' },
          { key: 'min', label: '低点' },
          { key: 'max', label: '高点' },
          { key: 'units', label: '单位' },
        ],
        data: metricRows,
        compact: true,
      },
    };
    rootChildren.push('metricTrends');
  }

  const analysisRows = rowsFromRecords(input.analysis, ['type', 'finding', 'action']);
  if (analysisRows.length) {
    elements.analysis = {
      component: 'DataTable',
      props: {
        type: 'table',
        title: '因果边界与动作',
        columns: [
          { key: 'type', label: '类型' },
          { key: 'finding', label: '判断' },
          { key: 'action', label: '建议' },
        ],
        data: analysisRows,
        compact: true,
      },
    };
    rootChildren.push('analysis');
  }

  if (!rootChildren.length) return null;
  const gaps = [];
  const chartInputs = Array.isArray(input.charts) ? input.charts : [];
  if (chartInputs.some(chart => chart && typeof chart === 'object' && !Array.isArray(chart) && !Array.isArray(chart.data))) {
    gaps.push({
      code: 'vizual.semantic_analysis_chart_missing_data',
      message: 'op-analysis chart descriptors were omitted because they did not include data rows.',
    });
  }
  return {
    source: 'semantic-op-analysis',
    input: {
      root: 'root',
      elements,
    },
    runtimeAudit: gaps.length ? { catalogGaps: gaps } : {},
  };
}

function opUpsertValueArrayToVizualSpec(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const upsertItems = input.filter(item => (
    item
    && typeof item === 'object'
    && !Array.isArray(item)
    && item.op === 'upsert'
    && upsertElementRecord(item)
  ));
  if (!upsertItems.length || upsertItems.length !== input.length) return null;

  const elements = {};
  const referenced = new Set();
  const uniqueId = (base, index) => {
    const normalized = String(base || `element-${index + 1}`)
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      || `element-${index + 1}`;
    let id = normalized;
    for (let suffix = 2; elements[id]; suffix += 1) id = `${normalized}-${suffix}`;
    return id;
  };
  const idFromPath = (path, fallback) => {
    const segments = String(path || '')
      .split('/')
      .map(segment => decodeURIComponent(segment).trim())
      .filter(Boolean);
    return segments.at(-1) || fallback;
  };

  const childIds = upsertItems.map((item, index) => {
    const value = upsertElementRecord(item);
    const component = normalizeComponentName(String(value.component || value.type || value.componentType));
    const id = uniqueId(item.id || item.elementId || value.id || idFromPath(item.path, component), index);
    const props = normalizeChartArrayProps(component, propsFromElementRecord(component, value));
    const children = Array.isArray(value.children) ? value.children.map(String) : [];
    children.forEach(child => referenced.add(child));
    elements[id] = {
      component,
      props,
      ...(children.length ? { children } : {}),
      ...(value.on && typeof value.on === 'object' ? { on: value.on } : {}),
    };
    return id;
  });

  const topLevelIds = childIds.filter(id => !referenced.has(id));
  let root = topLevelIds.length === 1 ? topLevelIds[0] : uniqueId('root', childIds.length);
  if (!elements[root]) {
    elements[root] = {
      component: 'Column',
      props: { gap: 16 },
      children: topLevelIds.length ? topLevelIds : childIds,
    };
  }

  const rootElement = elements[root];
  const rootChildren = Array.isArray(rootElement?.children)
    ? rootElement.children.filter(childId => elements[childId])
    : [];
  const rootComponent = normalizeComponentName(String(rootElement?.component || rootElement?.type || ''));
  const containerComponents = new Set(['Column', 'Row', 'Card', 'Container', 'Tabs']);
  if (rootElement && rootChildren.length && !containerComponents.has(rootComponent)) {
    rootElement.children = [];
    const wrapperId = uniqueId('root', childIds.length + 1);
    elements[wrapperId] = {
      component: 'Column',
      props: { gap: 16 },
      children: [root, ...rootChildren],
    };
    root = wrapperId;
  }

  return {
    source: upsertItems.some(item => item.element && !item.value) ? 'op-upsert-element-array' : 'op-upsert-value-array',
    input: {
      root,
      elements,
    },
  };
}

function upsertElementRecord(item) {
  const value = item?.value || item?.element;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (!(value.component || value.type || value.componentType)) return null;
  return value;
}

function propsFromElementRecord(component, value) {
  const props = value.props && typeof value.props === 'object' && !Array.isArray(value.props)
    ? { ...value.props }
    : {};
  const structuralKeys = new Set(['id', 'key', 'component', 'componentType', 'type', 'props', 'children', 'child', 'on']);
  for (const [key, entryValue] of Object.entries(value)) {
    if (!structuralKeys.has(key) && props[key] === undefined) props[key] = entryValue;
  }
  if (component === 'DataTable') {
    if (!Array.isArray(props.data) && Array.isArray(props.rows)) props.data = props.rows;
    if (props.type == null) props.type = 'table';
  }
  if (component === 'Markdown' && props.content == null) {
    if (props.text != null) props.content = props.text;
    else if (props.markdown != null) props.content = props.markdown;
  }
  return props;
}

function jsonPatchArrayToVizualSpec(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const patchItems = input.filter(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.op === 'string' && typeof item.path === 'string');
  if (!patchItems.length || patchItems.length !== input.length) return null;

  const elements = {};
  let root = '';

  for (const item of patchItems) {
    if (!['add', 'replace'].includes(String(item.op))) return null;
    const path = String(item.path);
    const value = item.value;
    if (path === '/root' && typeof value === 'string') {
      root = value;
      continue;
    }
    if (path === '/elements' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [id, element] of Object.entries(value)) {
        if (element && typeof element === 'object' && !Array.isArray(element)) elements[id] = normalizePatchElement(element);
      }
      continue;
    }
    const elementMatch = path.match(/^\/elements\/([^/]+)$/u);
    if (elementMatch && value && typeof value === 'object' && !Array.isArray(value)) {
      elements[decodeURIComponent(elementMatch[1])] = normalizePatchElement(value);
    }
  }

  const elementIds = Object.keys(elements);
  if (!elementIds.length) return null;
  const requestedRoot = root && elements[root] ? root : elementIds[0];
  if (elementIds.length > 1 && !Array.isArray(elements[requestedRoot]?.children)) {
    const wrapperId = elements.root ? 'root_surface' : 'root';
    elements[wrapperId] = {
      component: 'Column',
      props: { gap: 16 },
      children: elementIds,
    };
    root = wrapperId;
  } else {
    root = requestedRoot;
  }

  return {
    source: 'json-patch-array',
    input: {
      root,
      elements,
    },
  };
}

function normalizePatchElement(element) {
  const component = normalizeComponentName(element.component || element.type || element.componentType || '');
  const props = normalizeChartArrayProps(component, element.props && typeof element.props === 'object' ? element.props : {});
  const next = {
    ...element,
    component,
    props,
  };
  if (element.component == null && element.type != null) delete next.type;
  return next;
}

function chartJsToVizualSpec(input, args = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const categories = input.data?.categories || input.categories || input.xAxis?.data;
  if (Array.isArray(categories) && Array.isArray(input.series) && input.series.length) {
    const title = args.display?.title || input.title || args.fallbackText || 'Vizual Chart';
    const data = categories.map((category, index) => {
      const row = { category: String(category) };
      input.series.forEach((series, seriesIndex) => {
        const key = fieldName(series.name, `series_${seriesIndex + 1}`);
        row[key] = numericValue(Array.isArray(series.data) ? series.data[index] : 0);
      });
      return row;
    });
    return {
      source: 'echarts-like',
      input: {
      root: 'chart',
      elements: {
        chart: {
          component: 'ComboChart',
          props: {
            title,
            data,
            x: 'category',
            series: input.series.map((series, index) => {
              const type = String(series.type || (index === 0 ? 'bar' : 'line')).toLowerCase();
              const key = fieldName(series.name, `series_${index + 1}`);
              return {
                name: series.name || `Series ${index + 1}`,
                type: type.includes('scatter') ? 'scatter' : type.includes('line') ? 'line' : 'bar',
                y: key,
                size: type.includes('scatter') ? key : undefined,
                yAxisIndex: Number.isFinite(Number(series.yAxisIndex)) ? Number(series.yAxisIndex) : index === 0 ? 0 : 1,
              };
            }),
          },
        },
      },
      },
    };
  }
  const labels = input.data?.labels;
  const datasets = input.data?.datasets;
  if (!Array.isArray(labels) || !Array.isArray(datasets) || !datasets.length) return null;

  const title = args.display?.title || input.options?.plugins?.title?.text || args.fallbackText || 'Vizual Chart';
  const normalizedType = String(input.chartType || input.type || datasets[0]?.type || 'bar').toLowerCase();
  const rows = labels.map((label, index) => {
    const row = { category: String(label) };
    datasets.forEach((dataset, datasetIndex) => {
      const key = fieldName(dataset.label, `series_${datasetIndex + 1}`);
      row[key] = numericValue(Array.isArray(dataset.data) ? dataset.data[index] : 0);
    });
    return row;
  });

  if (datasets.length === 1 && normalizedType !== 'combo') {
    const key = fieldName(datasets[0].label, 'value');
    const component = normalizedType.includes('line')
      ? 'LineChart'
      : normalizedType.includes('pie') || normalizedType.includes('doughnut')
        ? 'PieChart'
        : 'BarChart';
    return {
      source: 'chartjs-like',
      input: {
      root: 'chart',
      elements: {
        chart: {
          component,
          props: {
            title,
            data: rows,
            x: 'category',
            y: key,
          },
        },
      },
      },
    };
  }

  return {
    source: 'chartjs-like',
    input: {
    root: 'chart',
    elements: {
      chart: {
        component: 'ComboChart',
        props: {
          title,
          data: rows,
          x: 'category',
          series: datasets.map((dataset, index) => ({
            name: dataset.label || `Series ${index + 1}`,
            type: String(dataset.type || normalizedType || 'bar').toLowerCase().includes('scatter') ? 'scatter' : String(dataset.type || normalizedType || 'bar').toLowerCase().includes('line') ? 'line' : 'bar',
            y: fieldName(dataset.label, `series_${index + 1}`),
            yAxisIndex: dataset.yAxisID === 'y1' || dataset.yAxisID === 'right' ? 1 : 0,
          })),
        },
      },
    },
    },
  };
}

function rowsToVizualSpec(rows, args = {}) {
  if (!Array.isArray(rows) || !rows.length || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) return null;
  const keys = Object.keys(rows[0]);
  if (keys.some(key => /^(op|tag|path|style|textContent|tool|toolName|toolCall|args|arguments|parameters)$/i.test(key))) return null;
  if (rows.some(row => Object.values(row).some(value => value && typeof value === 'object'))) return null;
  const categoryKey = keys.find(key => /^(category|label|name|week|month|date|time|x|周次|月份|日期|时间)$/i.test(key))
    || keys.find(key => rows.some(row => typeof row[key] === 'string' && !Number.isFinite(Number(String(row[key]).replace(/%|,/g, '')))))
    || keys[0];
  const numericKeys = keys.filter(key => key !== categoryKey && rows.some(row => typeof numericValue(row[key]) === 'number'));
  if (!numericKeys.length) return null;

  const title = args.display?.title || args.fallbackText || 'Vizual Chart';
  const data = rows.map(row => {
    const next = { ...row, [categoryKey]: String(row[categoryKey]) };
    for (const key of numericKeys) next[key] = numericValue(row[key]);
    return next;
  });

  if (numericKeys.length === 1) {
    return {
      source: 'rows-like',
      input: {
      root: 'chart',
      elements: {
        chart: {
          component: 'BarChart',
          props: {
            title,
            data,
            x: categoryKey,
            y: numericKeys[0],
          },
        },
      },
      },
    };
  }

  return {
    source: 'rows-like',
    input: {
    root: 'chart',
    elements: {
      chart: {
        component: 'ComboChart',
        props: {
          title,
          data,
          x: categoryKey,
          series: numericKeys.map((key, index) => ({
            name: key,
            y: key,
            type: /churn|流失|scatter|size|bubble/i.test(key) ? 'scatter' : index === 0 ? 'bar' : 'line',
            yAxisIndex: index === 0 ? 0 : 1,
          })),
        },
      },
    },
    },
  };
}

function stripVizualNamespace(value) {
  return String(value || '').replace(/^Vizual[._:-]/i, '');
}

function collectComponentTypes(value, out = []) {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    parsed.forEach(item => collectComponentTypes(item, out));
    return out;
  }
  if (!parsed || typeof parsed !== 'object') return out;
  const component = normalizeComponentName(parsed.component || parsed.type || parsed.componentType);
  if (component) out.push(component);
  if (parsed.elements && typeof parsed.elements === 'object') collectComponentTypes(Object.values(parsed.elements), out);
  if (parsed.props && typeof parsed.props === 'object') collectComponentTypes(parsed.props.children, out);
  for (const key of ['children', 'items', 'content', 'body', 'sections', 'value']) {
    if (parsed[key] !== undefined) collectComponentTypes(parsed[key], out);
  }
  return out;
}

function collectNativeElementEntries(value) {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed.flatMap(item => collectNativeElementEntries(item));
  }
  if (!isPlainObject(parsed)) return [];
  if (isPlainObject(parsed.elements)) return Object.entries(parsed.elements);
  if (Array.isArray(parsed.elements)) {
    return parsed.elements.map((element, index) => [String(element?.id || `element_${index + 1}`), element]);
  }
  if (parsed.component || parsed.type || parsed.componentType) return [[String(parsed.id || 'root'), parsed]];
  return [];
}

function collectEmptyCharts(value) {
  const chartTypes = new Set([
    'AreaChart', 'BarChart', 'BubbleChart', 'CalendarChart', 'ComboChart',
    'DumbbellChart', 'FunnelChart', 'HeatmapChart', 'HistogramChart',
    'LineChart', 'PieChart', 'RadarChart', 'SankeyChart', 'ScatterChart',
    'SparklineChart', 'WaterfallChart', 'XmrChart',
  ]);
  const emptyCharts = [];
  for (const [id, element] of collectNativeElementEntries(value)) {
    if (!isPlainObject(element)) continue;
    const component = normalizeComponentName(element.component || element.type || element.componentType);
    if (!chartTypes.has(component)) continue;
    const props = isPlainObject(element.props) ? element.props : element;
    const hasDataRows = Array.isArray(props.data) && props.data.length > 0;
    const hasDataBinding = isPlainObject(props.data) && typeof props.data.path === 'string';
    const hasInlineArrays = Array.isArray(props.x) && (Array.isArray(props.y) || Array.isArray(props.values));
    if (!hasDataRows && !hasDataBinding && !hasInlineArrays) {
      emptyCharts.push(`${component} "${id}"`);
    }
  }
  return emptyCharts;
}

function assertToolCoverage(params) {
  const componentTypes = collectComponentTypes(params?.input);
  const errors = [];
  const emptyCharts = collectEmptyCharts(params?.input);
  if (emptyCharts.length) {
    errors.push(`Native chart component(s) have no data rows or data binding: ${emptyCharts.join(', ')}. Put x/data/series/y fields inside the same props object; do not repeat props keys.`);
  }
  return { errors, componentTypes };
}

export function normalizeArguments(args = {}) {
  const parsed = parseMaybeJson(args.input);
  const semanticAnalysisSpec = semanticAnalysisToVizualSpec(parsed);
  if (semanticAnalysisSpec) {
    return {
      input: semanticAnalysisSpec.input,
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: semanticAnalysisSpec.source,
        ...(semanticAnalysisSpec.runtimeAudit || {}),
      },
    };
  }
  const opCreateSpec = opCreateArrayToVizualSpec(parsed);
  if (opCreateSpec) {
    return {
      input: opCreateSpec.input,
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: opCreateSpec.source,
      },
    };
  }
  const opAppendElementsSpec = opAppendElementsArrayToVizualSpec(parsed);
  if (opAppendElementsSpec) {
    return {
      input: opAppendElementsSpec.input,
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: opAppendElementsSpec.source,
      },
    };
  }
  const operationCreateComponentSpec = operationCreateComponentArrayToVizualSpec(parsed);
  if (operationCreateComponentSpec) {
    return {
      input: operationCreateComponentSpec.input,
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: operationCreateComponentSpec.source,
      },
    };
  }
  const opUpsertValueSpec = opUpsertValueArrayToVizualSpec(parsed);
  if (opUpsertValueSpec) {
    return {
      input: opUpsertValueSpec.input,
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: opUpsertValueSpec.source,
      },
    };
  }
  if (looksLikeVizualNativeInput(parsed)) {
    const normalizedNative = normalizeNativeSpecShape(parsed);
    if (normalizedNative) {
      return {
        input: normalizedNative.input,
        runtimeAudit: {
          inputMode: 'native-normalized',
          conversion: normalizedNative.source,
        },
      };
    }
    return {
      input: parsed,
      runtimeAudit: {
        inputMode: 'native',
        conversion: null,
      },
    };
  }
  if (Array.isArray(parsed) && parsed.length === 1 && parsed[0]?.data?.labels && parsed[0]?.data?.datasets) {
    const converted = chartJsToVizualSpec(parsed[0], args);
    if (converted) {
      return {
        input: converted.input,
        runtimeAudit: {
          inputMode: 'compat-converted',
          conversion: converted.source,
        },
      };
    }
  }
  if (Array.isArray(parsed)) {
    const patchSpec = jsonPatchArrayToVizualSpec(parsed);
    if (patchSpec) {
      return {
        input: patchSpec.input,
        runtimeAudit: {
          inputMode: 'native-normalized',
          conversion: patchSpec.source,
        },
      };
    }
    const converted = rowsToVizualSpec(parsed, args);
    if (converted) {
      return {
        input: converted.input,
        runtimeAudit: {
          inputMode: 'compat-converted',
          conversion: converted.source,
        },
      };
    }
    return {
      input: parsed,
      runtimeAudit: {
        inputMode: 'unknown',
        conversion: null,
      },
    };
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.elements) && parsed.elements.length === 1 && parsed.elements[0]?.data?.labels && parsed.elements[0]?.data?.datasets) {
    const converted = chartJsToVizualSpec(parsed.elements[0], args);
    if (converted) {
      return {
        input: converted.input,
        runtimeAudit: {
          inputMode: 'compat-converted',
          conversion: converted.source,
        },
      };
    }
  }
  const converted = chartJsToVizualSpec(parsed, args);
  if (converted) {
    return {
      input: converted.input,
      runtimeAudit: {
        inputMode: 'compat-converted',
        conversion: converted.source,
      },
    };
  }
  return {
    input: parsed,
    runtimeAudit: {
      inputMode: 'unknown',
      conversion: null,
    },
  };
}

export default function vizualDirectTool(pi) {
  pi.registerTool({
    name: 'present_vizual_ui',
    label: 'Present Vizual UI',
    description: 'DO NOT CALL THIS TOOL when the user asks to write, generate, build, or return code/artifacts such as webpages, landing pages, HTML/CSS, React/Vue/Svelte components, SVG illustrations, games, apps, or code files; answer normally in text/code with no tool call. Present a Vizual native UI payload only when an ordinary conversation would be clearer as an inline visual or interactive surface. If the user explicitly asks to prove or show conclusions with charts/图表, the payload must include at least one native chart component; DataTable/action lists can support details but do not satisfy chart evidence by themselves. The input must be Vizual native operations or a Vizual spec, not Chart.js, ECharts option, HTML, React code, CSS, or Markdown. Use the native catalog as capability discovery; component choices are not creative gates.',
    promptSnippet: 'Do not call present_vizual_ui for webpages, landing pages, HTML/CSS, React, SVG, games, apps, or code artifacts; in those cases answer normally with toolCall=null. Call present_vizual_ui for natural conversation visualization when analysis, comparison, diagnosis, planning, concept explanation, or decision support would be clearer as a visible surface. Concrete numbers, multi-metric comparisons, funnels, rankings, event sequences, algorithm traces, and process state changes are strong candidates even if the user never says chart/dashboard/widget. If the user explicitly asks to prove or show conclusions with charts/图表, include at least one native chart such as LineChart, BarChart, ComboChart, or PieChart using the supplied data. Input must be Vizual JSON. Use semantic native components instead of hand-built Text/View cards.',
    promptGuidelines: [
      'Call boundary: if the user explicitly asks for a webpage, landing page, HTML/CSS, React/Vue/Svelte component, SVG illustration, game, app, or code artifact, do not call present_vizual_ui. Use the requested creative/file/artifact path instead.',
      'Use present_vizual_ui when you decide an inline visual or interactive surface would make the current answer easier to understand or act on. The user does not need to say chart/dashboard/widget.',
      'Concrete data, multi-metric before/after comparisons, funnels, rankings, event sequences, algorithm traces, process flows, and state changes plus a request to understand, compare, diagnose, prioritize, or explain are strong Vizual candidates.',
      'If the user explicitly asks to prove, support, or show conclusions with charts/图表, include at least one native chart component. A DataTable or action list may support details, but it cannot be the only Vizual component for a chart-evidence request.',
      'Do not use present_vizual_ui for greetings, short text-only answers, ordinary conceptual Q&A where prose is enough, or explicit creative requests such as webpages, landing pages, games, React/HTML/CSS, SVG, or code artifacts.',
      'Do not create React apps, install packages, write files, browse web examples, emit Chart.js/ECharts configs, or use HTML for ordinary chat visualization requests.',
      'Do not emit createElement/op/tag/path/style DSL. Do not pass root as an object. Do not pass elements as an array. A direct Vizual spec uses root as an element id string and elements as an object map.',
      'For a simple chart, use data rows plus string field bindings. Example input: { "root":"chart", "elements": { "chart": { "component":"BarChart", "props": { "type":"bar", "title":"A/B/C", "data":[{"label":"A","value":10},{"label":"B","value":18},{"label":"C","value":7}], "x":"label", "y":"value" } } } }.',
      'For mixed bar/line/scatter charts, use Vizual native ComboChart: root/elements with component "ComboChart" and props { type:"combo", x, data, series:[{ type:"bar"|"line"|"scatter", y, name, yAxisIndex, size }] }.',
      'For dashboards, KPI boards, scorecards, operating cockpits, or metric summaries, include component "KpiDashboard" with props { type:"kpi_dashboard", title, columns, metrics:[{ label, value, trend, trendValue }] }. Do not hand-build KPI cards with View/Text/style.',
      'For tables or detail lists, use component "DataTable" with props { type:"table", columns:[{key,label}], data:[...] }. Do not use "Table" or hand-written text tables.',
      'Only include FormBuilder when the user explicitly asks to collect, submit, edit, or confirm structured input.',
      'Add actions, buttons, filters, or forms only when the interaction is useful and backed by local state or an explicit host capability. Do not add controls just to prove interactivity.',
    ],
    parameters: {
      type: 'object',
      required: ['input'],
      additionalProperties: false,
      properties: {
        surfaceId: { type: 'string' },
        fallbackText: { type: 'string' },
        display: {
          type: 'object',
          additionalProperties: true,
          properties: {
            mode: { type: 'string' },
            title: { type: 'string' },
            persist: { type: 'boolean' },
          },
        },
        input: {
          description: 'Vizual native input only: A2UI operation array, AG-UI event array, or a direct Vizual spec with root/elements. Do not pass Chart.js datasets, ECharts options, HTML, React, or CSS.',
          anyOf: [{ type: 'object' }, { type: 'array' }],
        },
        runtimeAudit: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    prepareArguments(args) {
      const normalized = normalizeArguments(args);
      return {
        ...args,
        input: normalized.input,
        runtimeAudit: normalized.runtimeAudit,
      };
    },
    async execute(_toolCallId, params) {
      if (params?.runtimeAudit?.inputMode === 'unknown') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: false,
                validationErrors: ['Input did not match Vizual native, A2UI, AG-UI, or an absorbed semantic payload shape.'],
                instruction: 'Revise and call present_vizual_ui again with root/elements native spec or A2UI operations. Do not return an opaque analysis object.',
              }),
            },
          ],
          details: {
            ok: false,
            tool: 'present_vizual_ui',
            surfaceId: params?.surfaceId,
            validationErrors: ['unknown input shape'],
          },
          isError: true,
        };
      }
      const coverage = assertToolCoverage(params);
      if (coverage.errors.length) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: false,
                validationErrors: coverage.errors,
                componentTypes: coverage.componentTypes,
                instruction: 'Revise and call present_vizual_ui again with complete Vizual native input that satisfies the native payload contract.',
              }),
            },
          ],
          details: {
            ok: false,
            tool: 'present_vizual_ui',
            surfaceId: params?.surfaceId,
            validationErrors: coverage.errors,
          },
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: true,
              toolCall: {
                name: 'present_vizual_ui',
                arguments: params,
              },
            }),
          },
        ],
        details: {
          ok: true,
          tool: 'present_vizual_ui',
          surfaceId: params?.surfaceId,
        },
      };
    },
  });
}
