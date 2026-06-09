import React from 'react'
import { defineRegistry } from '@json-render/react'
import { renderKitCatalog } from './catalog'

// Chart components
import { BarChart } from './charts/bar-chart/component'
import { AreaChart } from './charts/area/component'
import { LineChart } from './charts/line/component'
import { PieChart } from './charts/pie/component'
import { ScatterChart } from './charts/scatter/component'
import { BubbleChart } from './charts/bubble/component'
import { BoxplotChart } from './charts/boxplot/component'
import { HistogramChart } from './charts/histogram/component'
import { WaterfallChart } from './charts/waterfall/component'
import { XmrChart } from './charts/xmr/component'
import { SankeyChart } from './charts/sankey/component'
import { FunnelChart } from './charts/funnel/component'
import { HeatmapChart } from './charts/heatmap/component'
import { CalendarChart } from './charts/calendar/component'
import { SparklineChart } from './charts/sparkline/component'
import { ComboChart } from './charts/combo/component'
import { DumbbellChart } from './charts/dumbbell/component'
import { RadarChart } from './charts/radar/component'
import { MermaidChart } from './charts/mermaid/component'

// UI components
import { DataTable } from './charts/table/component'

// Custom business components
import { Timeline } from './components/timeline/component'
import { GanttChart } from './components/gantt/component'
import { OrgChart } from './components/org-chart/component'
import { KpiDashboard } from './components/kpi-dashboard/component'

// Interactive input components — only FormBuilder retained
import { FormBuilder } from './inputs/form-builder/component'

import { Markdown } from './components/markdown/component'
import { Container } from './components/container/component'

// A2UI basic catalog primitives
import { Row } from './components/a2ui-row/component'
import { Column } from './components/a2ui-column/component'
import { Card } from './components/a2ui-card/component'
import { Text } from './components/a2ui-text/component'
import { Image } from './components/a2ui-image/component'
import { Icon } from './components/a2ui-icon/component'
import { List } from './components/a2ui-list/component'
import { Divider } from './components/a2ui-divider/component'
import { Button } from './components/a2ui-button/component'
import { CheckBox } from './components/a2ui-checkbox/component'
import { TextField } from './components/a2ui-textfield/component'
import { ChoicePicker } from './components/a2ui-choicepicker/component'
import { Slider } from './components/a2ui-slider/component'
import { DateTimeInput } from './components/a2ui-datetime/component'
import { Tabs } from './components/a2ui-tabs/component'
import { Video } from './components/a2ui-video/component'
import { AudioPlayer } from './components/a2ui-audio/component'

/**
 * Vizual registry — 44 React components + action handlers
 */
// @ts-ignore
export const { registry, handlers, executeAction } = defineRegistry(renderKitCatalog, {
  components: {
    BarChart, AreaChart, LineChart, PieChart, ScatterChart, BubbleChart,
    BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart,
    FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart,
    DumbbellChart, RadarChart, MermaidDiagram: MermaidChart,
    DataTable,
    Timeline, GanttChart, OrgChart, KpiDashboard,
    FormBuilder,
    Markdown, Container,
    Row, Column, Card,
    Text, Image, Icon, List, Divider,
    Button, CheckBox, TextField, ChoicePicker, Slider, DateTimeInput,
    Tabs, Video, AudioPlayer,
  } as any,
  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitForm: async (params: any, setState: any) => {
      const submission = {
        formId: params?.formId,
        data: params?.data ?? {},
        submittedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _formSubmissions: [...(Array.isArray(prev._formSubmissions) ? prev._formSubmissions : []), submission],
        _lastFormSubmission: submission,
      }))
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyFilter: async (params: any, setState: any) => {
      const event = {
        filterId: params?.filterId,
        filters: params?.filters ?? {},
        source: params?.source,
        appliedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _filterEvents: [...(Array.isArray(prev._filterEvents) ? prev._filterEvents : []), event],
        _lastFilterEvent: event,
      }))
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drillDown: async (params: any, setState: any) => {
      const event = {
        chartId: params?.chartId,
        point: params?.point,
        row: params?.row,
        targetId: params?.targetId,
        requestedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _drillDownEvents: [...(Array.isArray(prev._drillDownEvents) ? prev._drillDownEvents : []), event],
        _lastDrillDownEvent: event,
      }))
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectLocation: async (params: any, setState: any) => {
      const event = {
        id: params?.id,
        label: params?.label,
        value: params?.value,
        selectedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _locationSelections: [...(Array.isArray(prev._locationSelections) ? prev._locationSelections : []), event],
        _lastLocationSelection: event,
      }))
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePlan: async (params: any, setState: any) => {
      const event = {
        actionId: params?.actionId,
        status: params?.status,
        comment: params?.comment,
        data: params?.data ?? {},
        updatedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _planUpdates: [...(Array.isArray(prev._planUpdates) ? prev._planUpdates : []), event],
        _lastPlanUpdate: event,
      }))
    },

  },
})
