import type { BudgetReportProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Budget vs actual with variance
 */
export function BudgetReport({ props }: { props: BudgetReportProps }) {
      const maxVal = Math.max(...props.categories.map(c => Math.max(c.budget, c.actual)))
      return <div>
        {props.title && <h3 style={{fontSize:tcss('--rk-text-md'),fontWeight:tcss('--rk-weight-semibold'),marginBottom:12}}>{props.title}</h3>}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {props.categories.map((cat, i) => {
            const variance = cat.actual - cat.budget
            const isOver = variance > 0
            return <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:tcss('--rk-text-base'),color:tcss('--rk-text-primary')}}>{cat.name}</span>
                <div style={{display:'flex',gap:12,fontSize:tcss('--rk-text-sm')}}>
                  <span style={{color:tcss('--rk-text-secondary')}}>Budget: {cat.budget.toLocaleString()}</span>
                  <span style={{color:tcss('--rk-text-primary')}}>Actual: {cat.actual.toLocaleString()}</span>
                  {props.showVariance !== false && <span style={{color:isOver?tcss('--rk-error'):tcss('--rk-success')}}>{isOver?'+':''}{variance.toLocaleString()}</span>}
                </div>
              </div>
              <div style={{height:6,background:tcss('--rk-bg-secondary'),borderRadius:tcss('--rk-radius-xs'),position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:(cat.budget/maxVal*100)+'%',background:tcss('--rk-border-subtle'),borderRadius:tcss('--rk-radius-xs')}} />
                <div style={{position:'absolute',height:'100%',width:(cat.actual/maxVal*100)+'%',background:cat.color??(isOver?tcss('--rk-error'):tcss('--rk-accent')),borderRadius:tcss('--rk-radius-xs'),opacity:0.8}} />
              </div>
            </div>
          })}
        </div>
      </div>
}
