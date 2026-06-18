import { useMemo, useState } from 'react'
import { Calculator, Info, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

export function ProfitCalculator({ dishes, specifications }) {
  const [selectedSpecId, setSelectedSpecId] = useState('')
  const [adjustMode, setAdjustMode] = useState('absolute')
  const [salePriceAdj, setSalePriceAdj] = useState('')
  const [ingredientCostAdj, setIngredientCostAdj] = useState('')
  const [packagingCostAdj, setPackagingCostAdj] = useState('')
  const [wastageAdj, setWastageAdj] = useState('')

  const selectedSpec = useMemo(() => {
    return specifications.find((spec) => spec.id === selectedSpecId) || null
  }, [specifications, selectedSpecId])

  const dishName = useMemo(() => {
    if (!selectedSpec) return ''
    return dishes.find((dish) => dish.id === selectedSpec.dish_id)?.name || '未知菜品'
  }, [dishes, selectedSpec])

  const original = useMemo(() => {
    if (!selectedSpec) return null
    const specWastage = selectedSpec.wastage_cost || 0
    const cost = selectedSpec.ingredient_cost + selectedSpec.packaging_cost + specWastage
    const grossProfit = selectedSpec.sale_price - cost
    const grossMargin = selectedSpec.sale_price > 0 ? grossProfit / selectedSpec.sale_price : 0
    return {
      salePrice: selectedSpec.sale_price,
      ingredientCost: selectedSpec.ingredient_cost,
      packagingCost: selectedSpec.packaging_cost,
      wastage: specWastage,
      cost,
      grossProfit,
      grossMargin,
    }
  }, [selectedSpec])

  const calculated = useMemo(() => {
    if (!original) return null

    const priceAdjNum = parseFloat(salePriceAdj) || 0
    const ingredAdjNum = parseFloat(ingredientCostAdj) || 0
    const packAdjNum = parseFloat(packagingCostAdj) || 0
    const wasteAdjNum = parseFloat(wastageAdj) || 0

    let newSalePrice
    let newIngredientCost
    let newPackagingCost
    let newWastage

    if (adjustMode === 'absolute') {
      newSalePrice = Math.max(0, original.salePrice + priceAdjNum)
      newIngredientCost = Math.max(0, original.ingredientCost + ingredAdjNum)
      newPackagingCost = Math.max(0, original.packagingCost + packAdjNum)
      newWastage = Math.max(0, original.wastage + wasteAdjNum)
    } else {
      newSalePrice = Math.max(0, original.salePrice * (1 + priceAdjNum / 100))
      newIngredientCost = Math.max(0, original.ingredientCost * (1 + ingredAdjNum / 100))
      newPackagingCost = Math.max(0, original.packagingCost * (1 + packAdjNum / 100))
      newWastage = Math.max(0, newIngredientCost * (wasteAdjNum / 100))
    }

    const newCost = newIngredientCost + newPackagingCost + newWastage
    const newGrossProfit = newSalePrice - newCost
    const newGrossMargin = newSalePrice > 0 ? newGrossProfit / newSalePrice : 0

    const profitDiff = newGrossProfit - original.grossProfit
    const marginDiff = newGrossMargin - original.grossMargin

    return {
      salePrice: newSalePrice,
      ingredientCost: newIngredientCost,
      packagingCost: newPackagingCost,
      wastage: newWastage,
      cost: newCost,
      grossProfit: newGrossProfit,
      grossMargin: newGrossMargin,
      profitDiff,
      marginDiff,
    }
  }, [original, adjustMode, salePriceAdj, ingredientCostAdj, packagingCostAdj, wastageAdj])

  const reset = () => {
    setSalePriceAdj('')
    setIngredientCostAdj('')
    setPackagingCostAdj('')
    setWastageAdj('')
  }

  const formatDiff = (value, isPercent = false) => {
    if (value === 0) return null
    const sign = value > 0 ? '+' : ''
    if (isPercent) {
      return `${sign}${(value * 100).toFixed(1)}%`
    }
    return `${sign}¥${value.toFixed(2)}`
  }

  return (
    <section className="panel calculator-panel">
      <div className="section-title">
        <h2>
          <Calculator size={18} />
          菜品毛利试算器
        </h2>
        <button type="button" className="icon-button" onClick={reset} title="重置调整">
          <RefreshCw size={14} />
          <span>重置</span>
        </button>
      </div>

      <div className="calculator-body">
        <label className="full-width">
          选择规格
          <select value={selectedSpecId} onChange={(e) => { setSelectedSpecId(e.target.value); reset() }}>
            <option value="">请选择要试算的规格</option>
            {specifications.map((spec) => {
              const dish = dishes.find((d) => d.id === spec.dish_id)
              return (
                <option key={spec.id} value={spec.id}>
                  {dish?.name || '未知'} - {spec.name}
                </option>
              )
            })}
          </select>
        </label>

        {selectedSpec && original && (
          <>
            <div className="calc-safe-notice">
              <Info size={14} />
              <span>仅试算预览，不会修改正式规格数据</span>
            </div>

            <div className="calc-original">
              <span className="calc-label">原始数据</span>
              <div className="calc-original-grid">
                <div>
                  <span>售价</span>
                  <strong>¥{original.salePrice.toFixed(2)}</strong>
                </div>
                <div>
                  <span>原料成本</span>
                  <strong>¥{original.ingredientCost.toFixed(2)}</strong>
                </div>
                <div>
                  <span>包装成本</span>
                  <strong>¥{original.packagingCost.toFixed(2)}</strong>
                </div>
                <div>
                  <span>损耗</span>
                  <strong>¥{original.wastage.toFixed(2)}</strong>
                </div>
                <div>
                  <span>毛利</span>
                  <strong>¥{original.grossProfit.toFixed(2)}</strong>
                </div>
                <div>
                  <span>毛利率</span>
                  <strong>{(original.grossMargin * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            <div className="calc-adjust">
              <div className="calc-adjust-header">
                <span className="calc-label">调整参数</span>
                <div className="mode-switch">
                  <button
                    type="button"
                    className={adjustMode === 'absolute' ? 'active' : ''}
                    onClick={() => setAdjustMode('absolute')}
                  >
                    绝对值
                  </button>
                  <button
                    type="button"
                    className={adjustMode === 'percent' ? 'active' : ''}
                    onClick={() => setAdjustMode('percent')}
                  >
                    百分比
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  售价调整 {adjustMode === 'percent' ? '(%)' : '(¥)'}
                  <input
                    type="number"
                    step="0.1"
                    value={salePriceAdj}
                    onChange={(e) => setSalePriceAdj(e.target.value)}
                    placeholder="正数上调，负数下调"
                  />
                </label>
                <label>
                  原料成本调整 {adjustMode === 'percent' ? '(%)' : '(¥)'}
                  <input
                    type="number"
                    step="0.1"
                    value={ingredientCostAdj}
                    onChange={(e) => setIngredientCostAdj(e.target.value)}
                    placeholder="正数增加，负数减少"
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  包装成本调整 {adjustMode === 'percent' ? '(%)' : '(¥)'}
                  <input
                    type="number"
                    step="0.1"
                    value={packagingCostAdj}
                    onChange={(e) => setPackagingCostAdj(e.target.value)}
                    placeholder="正数增加，负数减少"
                  />
                </label>
                <label>
                  损耗调整 {adjustMode === 'percent' ? '(占原料%)' : '(¥)'}
                  <input
                    type="number"
                    step="0.1"
                    value={wastageAdj}
                    onChange={(e) => setWastageAdj(e.target.value)}
                    placeholder={adjustMode === 'percent' ? '例如 5 表示占原料5%' : '正数为额外损耗成本'}
                  />
                </label>
              </div>
            </div>

            {calculated && (
              <div className="calc-result">
                <span className="calc-label">试算结果</span>
                <div className="calc-result-grid">
                  <div className="result-item">
                    <span>新售价</span>
                    <div className="result-value">
                      <strong>¥{calculated.salePrice.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>新原料成本</span>
                    <div className="result-value">
                      <strong>¥{calculated.ingredientCost.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>新包装成本</span>
                    <div className="result-value">
                      <strong>¥{calculated.packagingCost.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>新损耗</span>
                    <div className="result-value">
                      <strong>¥{calculated.wastage.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>新成本合计</span>
                    <div className="result-value">
                      <strong>¥{calculated.cost.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="result-item highlight">
                    <span>预估毛利</span>
                    <div className="result-value">
                      <strong>¥{calculated.grossProfit.toFixed(2)}</strong>
                      {calculated.profitDiff !== 0 && (
                        <span className={`diff ${calculated.profitDiff > 0 ? 'up' : 'down'}`}>
                          {calculated.profitDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {formatDiff(calculated.profitDiff)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="result-item highlight">
                    <span>预估毛利率</span>
                    <div className="result-value">
                      <strong>{(calculated.grossMargin * 100).toFixed(1)}%</strong>
                      {calculated.marginDiff !== 0 && (
                        <span className={`diff ${calculated.marginDiff > 0 ? 'up' : 'down'}`}>
                          {calculated.marginDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {formatDiff(calculated.marginDiff, true)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedSpec && (
          <div className="calc-hint">
            <p>选择一个规格开始试算</p>
            <small>调整售价、成本或损耗，实时查看毛利变化</small>
          </div>
        )}
      </div>
    </section>
  )
}
