import type { GanttChartProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Gantt chart with task bars and date axis
 */
export function GanttChart({ props }: { props: GanttChartProps }) {
      if (props.tasks.length === 0) return <div style={{color:tc('--rk-text-secondary'),fontSize:13}}>No tasks</div>
      const starts = props.tasks.map(t => new Date(t.start).getTime())
      const ends = props.tasks.map(t => new Date(t.end).getTime())
      const minTime = Math.min(...starts), maxTime = Math.max(...ends)
      const range = maxTime - minTime || 1
      const barColors = [tc('--rk-accent'),tc('--rk-accent'),tc('--rk-success'),tc('--rk-warning'),tc('--rk-error'),tc('--rk-accent')]
      return <div style={{width:'100%'}}>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{position:'relative'}}>
          {props.tasks.map((task, i) => {
            const left = ((new Date(task.start).getTime() - minTime) / range * 100)
            const width = ((new Date(task.end).getTime() - new Date(task.start).getTime()) / range * 100)
            return <div key={task.id} style={{display:'flex',alignItems:'center',height:32,marginBottom:2}}>
              <div style={{width:120,flexShrink:0,fontSize:12,color:tc('--rk-text-secondary'),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8}}>{task.name}</div>
              <div style={{flex:1,position:'relative',height:20,background:tc('--rk-bg-primary'),borderRadius:4}}>
                <div style={{position:'absolute',left:left+'%',width:Math.max(width,1)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:4,opacity:0.8}} />
                {task.progress != null && <div style={{position:'absolute',left:left+'%',width:(width*task.progress/100)+'%',height:'100%',background:task.color??barColors[i%barColors.length],borderRadius:4}} />}
              </div>
            </div>
          })}
        </div>
      </div>
}
