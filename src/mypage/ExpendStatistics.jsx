import React, { useState, useEffect, useLayoutEffect } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import { Doughnut, Pie, Bar } from 'react-chartjs-2'
import axios from 'axios'
import './mypage.css'
import { useDispatch, useSelector } from 'react-redux'
import Tabs from '@mui/joy/Tabs'
import TabList from '@mui/joy/TabList'
import Tab from '@mui/joy/Tab'
import TabPanel from '@mui/joy/TabPanel'
/** 가계뷰 > 마이페이지 > 지출통계 ExpendStatistics  */

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
)

const ExpendStatistics = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  const defaultFromDate = `${currentYear}-${
    currentMonth < 10 ? '0' + currentMonth : currentMonth
  }-01`
  const defaultToDate = `${currentYear}-${
    currentMonth < 10 ? '0' + currentMonth : currentMonth
  }-${daysInMonth}`

  /** 시작날짜 */
  const [fromDate, setFromDate] = useState(defaultFromDate)
  /** 종료날짜 */
  const [toDate, setToDate] = useState(defaultToDate)
  /** 차트 Chart /* 지출 총 통계 */
  const [chartData, setChartData] = useState(null)
  /** 바 Chart /* 지출 결제 통계 */
  const [BarData, setBarData] = useState(null)
  /** 지출 차트 리스트 chart list */
  const [listexpense, setListExpense] = useState([])
  /** 지출 바 리스트 Bar list */
  const [listexpensepay, setListExpensePay] = useState([])
  /** 로그인 session */
  const dispatch = useDispatch()
  const { userInfo, isLoading, error } = useSelector((store) => store.login)
  /** 지출 총 금액 */
  const [totalexpense, setTotalExpense] = useState(0)

  useEffect(() => {
    search() // 초기화면 * onload
  }, [])

  useLayoutEffect(() => {
    console.log('userInfo start')
    console.log(userInfo)
  }, [userInfo])

  /** 날짜 조회 검색 btn click */
  const search = async () => {
    let params = new URLSearchParams()
    params.append('from_date', fromDate) /** 시작날짜 */
    params.append('to_date', toDate) /** 종료날짜 */
    params.append('mn_use_dvs', '1') /** 1:지출 2:수입 */
    params.append('mn_rgst_id', userInfo.loginId) /** 로그인ID */

    await axios
      .post('/mypage/selectgagevueChart.do', params)
      .then((res) => {
        console.log('pie char succ 성공 ')
        setListExpense(res.data.gagevueListChart)
        setTotalExpense(res.data.gagevueChartTotal)
        setListExpensePay(res.data.gagevueListPay)

        /** 지출 라벨 labels */
        const labels = res.data.gagevueListChart.map((item) => item.detail_name)
        /** 지출 금액 amount */
        const data = res.data.gagevueListChart.map((item) => item.sum_amount)

        /** 지출 라벨 labels */
        const paylabels = res.data.gagevueListPay.map(
          (item) => item.week_number,
        )
        /** 지출 금액 amount */
        const paydata = res.data.gagevueListPay.map((item) => item.sum_amount)

        /** 차트 배경 색상 랜덤으로 돌리기 chart background */
        const getRandomColor = () => {
          const r = Math.floor(Math.random() * 256)
          const g = Math.floor(Math.random() * 256)
          const b = Math.floor(Math.random() * 256)
          return `rgb(${r}, ${g}, ${b})`
        }
        const backgroundColors = Array.from({ length: labels.length }, () =>
          getRandomColor(),
        )

        // 도넛 차트 start
        setChartData({
          labels: labels,
          datasets: [
            {
              label: labels,
              data: data,
              backgroundColor: backgroundColors,
              hoverOffset: 2,
            },
          ],
        })

        const weekLabels = ['1주', '2주', '3주', '4주', '5주']
        // 받아온 데이터를 기반으로 weekData 생성
        const weekData = res.data.gagevueListPay.map((item) => ({
          week_number: item.week_number,
          sum_amount_pay_card: item.sum_amount_pay_card,
          sum_amount_pay_money: item.sum_amount_pay_money,
        }))

        console.log('weekData', weekData)

        // 주차별 데이터를 집계할 객체 생성
        const dataByWeek = {}
        weekData.forEach((row) => {
          const weekNumber = row.week_number
          if (!dataByWeek[weekNumber]) {
            dataByWeek[weekNumber] = {
              sum_amount_pay_card: row.sum_amount_pay_card,
              sum_amount_pay_money: row.sum_amount_pay_money,
            }
          } else {
            dataByWeek[weekNumber].sum_amount_pay_card +=
              row.sum_amount_pay_card
            dataByWeek[weekNumber].sum_amount_pay_money +=
              row.sum_amount_pay_money
          }
        })

        // 바 차트 start
        setBarData({
          labels: weekLabels,
          datasets: [
            {
              label: '카드',
              data: weekLabels.map(
                (week) => dataByWeek[week]?.sum_amount_pay_card || 0,
              ),
              backgroundColor: 'yellow',
              hoverOffset: 2,
            },
            {
              label: '현금',
              data: weekLabels.map(
                (week) => dataByWeek[week]?.sum_amount_pay_money || 0,
              ),
              backgroundColor: 'green',
              hoverOffset: 2,
            },
          ],
        })
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  return (
    <div id='content'>
      <p class='Location'>
        <a href='/dashboard/home' class='btn_set home'></a>
        <span class='btn_nav bold'>가계부</span>
        <span class='btn_nav bold'>마이페이지</span>
        <span class='btn_nav bold'>지출통계</span>
        <a
          href='/dashboard/mypage/ExpendStatistics'
          class='btn_set refresh'
        ></a>
      </p>
      <div>
        <Tabs aria-label='Basic tabs' defaultValue={0}>
          <TabList>
            <Tab>지출 항목</Tab>
            <Tab>지출 결제</Tab>
            <Tab>지출 총 합계</Tab>
          </TabList>
          <TabPanel value={0}>
            <div id='searchArea' class='d-flex justify-content-around'>
              <input
                type='date'
                id='from_date'
                name='from_date'
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              ~
              <input
                type='date'
                id='to_date'
                name='to_date'
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button
                id='searchBtn'
                type='button'
                className='btn btn-primary'
                onClick={search}
              >
                검색
              </button>
            </div>
            <div id='piechartArea'>
              {chartData && (
                <Doughnut
                  data={chartData}
                  options={{
                    plugins: {
                      legend: {
                        display: true,
                        position: 'right', // 라벨 위치 설정 (top, bottom, left, right)
                        labels: {
                          generateLabels: function (chart) {
                            const data = chart.data
                            if (data.labels.length && data.datasets.length) {
                              return data.labels.map(function (label, i) {
                                const meta = chart.getDatasetMeta(0)
                                const ds = data.datasets[0]
                                const arc = meta.data[i]
                                const value = ds.data[i]
                                const formattedValue =
                                  value.toLocaleString() + '원' // 값 포맷 설정
                                return {
                                  text: `${label}: ${formattedValue}`,
                                  fillStyle: ds.backgroundColor[i],
                                  hidden:
                                    isNaN(ds.data[i]) || meta.data[i].hidden,
                                  index: i,
                                }
                              })
                            }
                            return []
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
            {listexpense.length > 0 && (
              <table className='col'>
                <thead>
                  <tr>
                    <th scope='col'>지출항목</th>
                    <th scope='col'>금 액</th>
                    <th scope='col'>%</th>
                  </tr>
                </thead>
                <tbody>
                  {listexpense.map((list, index) => (
                    <tr key={index}>
                      <td>{list.detail_name}</td>
                      <td>{list.sum_amount.toLocaleString()}원</td>
                      <td>{list.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {listexpense.length === 0 && <p>결과가 없습니다.</p>}
          </TabPanel>
          <TabPanel value={1}>
            <div id='searchArea' class='d-flex justify-content-around'>
              <input
                type='date'
                id='from_date'
                name='from_date'
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              ~
              <input
                type='date'
                id='to_date'
                name='to_date'
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button
                id='searchBtn'
                type='button'
                className='btn btn-primary'
                onClick={search}
              >
                검색
              </button>
            </div>
            <div>
              <Bar data={BarData} />
            </div>
          </TabPanel>
          <TabPanel value={2}>
            {' '}
            <div class='intro_section1'>
              <span class='intro_section1'>
                지출 총 합계
                <br />
                <br /> {totalexpense.toLocaleString() + '원'}{' '}
              </span>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

export default ExpendStatistics
