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
                <span style={{fontSize:13,color:'#ddd'}}>{cat.name}</span>
                <div style={{display:'flex',gap:12,fontSize:12}}>
                  <span style={{color:'#888'}}>Budget: {cat.budget.toLocaleString()}</span>
                  <span style={{color:'#ddd'}}>Actual: {cat.actual.toLocaleString()}</span>
                  {props.showVariance !== false && <span style={{color:isOver?'#ef4444':'#22c55e'}}>{isOver?'+':''}{variance.toLocaleString()}</span>}
                </div>
              </div>
              <div style={{height:6,background:'#1a1a1a',borderRadius:3,position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:(cat.budget/maxVal*100)+'%',background:'#333',borderRadius:3}} />
                <div style={{position:'absolute',height:'100%',width:(cat.actual/maxVal*100)+'%',background:cat.color??(isOver?'#ef4444':'#3b82f6'),borderRadius:3,opacity:0.8}} />
              </div>
            </div>
          })}
        </div>
      </div>
}
