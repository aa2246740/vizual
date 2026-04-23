import type { GanttChartProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

/**
 * Gantt chart with task bars and date axis.
 * 在 DocView 内时，每个任务条支持独立批注。
 */
export function GanttChart({ props }: { props: GanttChartProps }) {
  const ctx = useAnnotationContext()
  if (props.tasks.length === 0) return <div style={{color:tcss('--rk-text-secondary'),fontSize:tcss('--rk-text-base')}}>No tasks</div>
  const starts = props.tasks.map(t => new Date(t.start).getTime())
  const ends = props.tasks.map(t => new Date(t.end).getTime())
  const minTime = Math.min(...starts), maxTime = Math.max(...ends)
  const range = maxTime - minTime || 1
  const barColors = [tcss('--rk-accent'),tcss('--rk-accent'),tcss('--rk-success'),tcss('--rk-warning'),tcss('--rk-error'),tcss('--rk-accent')]
  return <div style={{width:'100%'}}>
    {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
    <div style={{position:'relative',maxHeight:400,overflowY:'auto'}}>
      {props.tasks.map((task, i) => {
        const left = ((new Date(task.start).getTime() - minTime) / range * 100)
        const width = ((new Date(task.end).getTime() - new Date(task.start).getTime()) / range * 100)
        // 每个任务条的批注属性
        const taskAnnotationProps = ctx ? {
          'data-docview-target': `gantt-${ctx.sectionIndex}-${i}`,
          'data-section-index': ctx.sectionIndex,
          'data-target-type': 'component',
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation()
            ctx.onTargetClick?.({
              sectionIndex: ctx.sectionIndex,
              targetType: 'component',
              label: task.name,
              targetId: `gantt-${ctx.sectionIndex}-${i}`,
            }, e.currentTarget as HTMLElement)
          },
          style: { cursor: 'pointer' as const },
        } : {}
        return <div key={task.id} style={{display:'flex',alignItems:'center',height:32,marginBottom:2}} {...taskAnnotationProps}>
          <div style={{width:120,flexShrink:0,fontSize:tcss('--rk-text-sm'),color:tcss('--rk-text-secondary'),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8}}>{task.name}</div>
          <div style={{flex:1,position:'relative',height:20,background:tcss('--rk-bg-primary'),borderRadius:tcss('--rk-radius-sm')}}>
            <div style={{position:'absolute',left:left+'%',width:Math.max(width,1)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:tcss('--rk-radius-sm'),opacity:0.8}} />
            {task.progress != null && <div style={{position:'absolute',left:left+'%',width:(width*task.progress/100)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:tcss('--rk-radius-sm')}} />}
          </div>
        </div>
      })}
    </div>
  </div>
}
