import type { BudgetReportProps } from './schema'
import { tc } from '../../core/theme-colors'

/**
 * Budget vs actual with variance
 */
export function BudgetReport({ props }: { props: BudgetReportProps }) {
      const maxVal = Math.max(...props.categories.map(c => Math.max(c.budget, c.actual)))
      return <div>
        {props.title && <h3 style={{fontSize:14,fontWeight:600,marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {props.categories.map((cat, i) => {
            const variance = cat.actual - cat.budget
            const isOver = variance > 0
            return <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,color:tc('--rk-text-primary')}}>{cat.name}</span>
                <div style={{display:'flex',gap:12,fontSize:12}}>
                  <span style={{color:tc('--rk-text-secondary')}}>Budget: {cat.budget.toLocaleString()}</span>
                  <span style={{color:tc('--rk-text-primary')}}>Actual: {cat.actual.toLocaleString()}</span>
                  {props.showVariance !== false && <span style={{color:isOver?tc('--rk-error'):tc('--rk-success')}}>{isOver?'+':''}{variance.toLocaleString()}</span>}
                </div>
              </div>
              <div style={{height:6,background:tc('--rk-bg-secondary'),borderRadius:3,position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:(cat.budget/maxVal*100)+'%',background:tc('--rk-border-subtle'),borderRadius:3}} />
                <div style={{position:'absolute',height:'100%',width:(cat.actual/maxVal*100)+'%',background:cat.color??(isOver?tc('--rk-error'):tc('--rk-accent')),borderRadius:3,opacity:0.8}} />
              </div>
            </div>
          })}
        </div>
      </div>
}
