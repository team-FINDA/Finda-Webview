import styled from '@emotion/styled'
import { useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

type AttendanceDatum = {
  month: string
  value: number
}

const yAxisTicks = [0, 25, 50, 75, 100]
const chartDataLength = 5

function parseChartData(rawData: string | null): AttendanceDatum[] | null {
  if (!rawData) {
    return null
  }

  try {
    const parsedData = JSON.parse(rawData) as unknown

    if (!Array.isArray(parsedData)) {
      return null
    }

    const chartData = parsedData.map((item) => {
      if (
        !item ||
        typeof item !== 'object' ||
        !('month' in item) ||
        !('value' in item)
      ) {
        return null
      }

      const month = (item as { month: unknown }).month
      const value = (item as { value: unknown }).value

      if (typeof month !== 'string' || typeof value !== 'number' || !Number.isFinite(value)) {
        return null
      }

      return { month, value }
    })

    if (chartData.length !== chartDataLength || chartData.some((item) => item === null)) {
      return null
    }

    return chartData as AttendanceDatum[]
  } catch {
    return null
  }
}

function AttendanceChartPage() {
  const [searchParams] = useSearchParams()
  const title = searchParams.get('title') || '출석률'
  const data = parseChartData(searchParams.get('data'))

  if (!data) {
    return (
      <AttendanceChartScreen>
        <AttendanceChartError>그래프 데이터를 불러올 수 없습니다.</AttendanceChartError>
      </AttendanceChartScreen>
    )
  }

  return (
    <AttendanceChartScreen>
      <AttendanceChartContainer aria-label={title}>
        <AttendanceChartTitle>{title}</AttendanceChartTitle>
        <AttendanceChartBody>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#d1d5db" strokeDasharray="4 2" strokeWidth={1.2} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: '#1f2937',
                  fontFamily: 'var(--sans)',
                  fontSize: 12,
                  fontWeight: 400,
                }}
              />
              <YAxis
                width={30}
                ticks={yAxisTicks}
                domain={[0, 100]}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: '#1f2937',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: 400,
                }}
              />
              <Area
                type="linear"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                fill="#2563eb"
                fillOpacity={0.12}
                dot={({ cx, cy }) => (
                  <circle cx={cx} cy={cy} r={3} fill="#ffffff" stroke="#2563eb" strokeWidth={2} />
                )}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </AttendanceChartBody>
      </AttendanceChartContainer>
    </AttendanceChartScreen>
  )
}

export default AttendanceChartPage

const AttendanceChartScreen = styled.main`
  width: 100%;
  height: 100svh;
  min-height: 180px;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
  background: #ffffff;
`

const AttendanceChartContainer = styled.section`
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px 18px;
  border-radius: 10px;
  background: #f7f7f7;
`

const AttendanceChartTitle = styled.p`
  flex: 0 0 auto;
  color: #1f2937;
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
`

const AttendanceChartBody = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 8px 0 0 8px;
`

const AttendanceChartError = styled.p`
  margin: auto;
  color: #1f2937;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  text-align: center;
`
