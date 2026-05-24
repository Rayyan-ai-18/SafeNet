import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function ScreenTimeChart({ used = 120, limit = 180 }) {
  const data = [
    { name: 'Used', value: Math.min(used, limit), fill: used > limit ? '#DC2626' : '#0F7B4D' },
  ]
  const percentage = Math.round((used / limit) * 100)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[160px] h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={16}
            data={data}
            startAngle={180}
            endAngle={-180}
          >
            <PolarAngleAxis type="number" domain={[0, limit]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#F1F5F9' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-safenet-text">{used}</span>
          <span className="text-xs text-safenet-text-3">of {limit} min</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <div className={`w-2 h-2 rounded-full ${percentage > 90 ? 'bg-safenet-danger' : 'bg-safenet-primary'}`} />
        <span className="text-xs text-safenet-text-3">{percentage}% used</span>
      </div>
    </div>
  )
}
