let currentDate = new Date();
let selectedDate = null;
let transactions = {};

// 초기화 함수
function init() {
  loadData();
  renderCalendar();
  loadMonthlyGoal();
  enhancedWeeklyAnalysis();
  enhancedMonthlyAnalysis();
}

// 로컬 스토리지에서 데이터 로드
function loadData() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved);
  }
  updateSummary();
}

// 데이터 저장
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateSummary();
}

// 금액을 원화 형식으로 포맷팅
function formatCurrency(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

function renderCalendar() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  document.getElementById('calendar-title').innerText = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const calendar = document.getElementById('calendar-grid');
  calendar.innerHTML = '';

  // 요일 헤더 추가
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  daysOfWeek.forEach(day => {
    calendar.innerHTML += `<div class="calendar-day day-header">${day}</div>`;
  });

  // 빈 날짜 채우기
  for (let i = 0; i < firstDay.getDay(); i++) {
    calendar.innerHTML += `<div class="calendar-day empty"></div>`;
  }

  // 날짜 채우기
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateKey = `${year}-${month + 1}-${day}`;
    const dayTransactions = transactions[dateKey] || [];

    // 해당 날짜의 요일 계산
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay();

    let income = 0;
    let expense = 0;
    dayTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });

    calendar.innerHTML += `
          <div class="calendar-day ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}" onclick="openModal('${dateKey}')">
              <div class="day-number">${day}</div>
              <div class="day-summary">
                  ${income > 0 ? `<div class="income">+${formatCurrency(income)}</div>` : ''}
                  ${expense > 0 ? `<div class="expense">-${formatCurrency(expense)}</div>` : ''}
              </div>
          </div>
      `;
  }
}

function editMonthlyGoal() {
  const goal = document.getElementById('monthly-goal-text').value;
  if (goal !== null && goal.trim() !== '') {
    document.getElementById('monthly-goal-text').value = goal;
    localStorage.setItem('monthlyGoal', goal);
  }
}

function loadMonthlyGoal() {
  const savedGoal = localStorage.getItem('monthlyGoal');
  if (savedGoal) {
    document.getElementById('monthly-goal-text').value = savedGoal;
  }
}

// 월 변경
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
}

// 모달 관련 함수들
function openModal(dateKey) {
  selectedDate = dateKey;
  const modal = document.getElementById('transactionModal');
  const modalTitle = document.getElementById('modal-title');
  const [year, month, day] = dateKey.split('-');

  modalTitle.textContent = `${year}년 ${month}월 ${day}일 거래내역`;
  renderDayTransactions();

  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('transactionModal').style.display = 'none';
  document.getElementById('transaction-form').reset();
}

// 날짜별 거래내역 표시
function renderDayTransactions() {
  const listElement = document.getElementById('day-transactions');
  const dayTransactions = transactions[selectedDate] || [];

  // 거래 내역 HTML 렌더링
  listElement.innerHTML = dayTransactions.map((t, index) => `
    <div class="transaction-item">
      <div>
        <strong>${t.description}</strong>
        <div>${t.category}</div>
      </div>
      <div class="${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </div>
      <!-- 거래 삭제 버튼 추가 -->
      <button onclick="deleteTransaction('${selectedDate}', ${index})">삭제</button>
    </div>
  `).join('');
}

function deleteTransaction(dateKey, index) {
  // 해당 날짜의 거래 배열에서 index 위치의 거래를 제거
  transactions[dateKey].splice(index, 1);

  // 거래가 모두 삭제된 경우 날짜 키를 삭제
  if (transactions[dateKey].length === 0) {
    delete transactions[dateKey];
  }

  // 데이터 저장 및 UI 업데이트
  saveData();
  renderDayTransactions(); // 하루 거래 내역 다시 렌더링
  renderCalendar(); // 캘린더 UI 업데이트
}

// 거래 유형 선택
function selectTransactionType(type) {
  document.getElementById('transaction-type').value = type;
  document.getElementById('transaction-form').style.display = 'grid';

  // 버튼 활성화 상태 변경
  document.getElementById('income-btn').classList.remove('active');
  document.getElementById('expense-btn').classList.remove('active');
  document.getElementById(`${type}-btn`).classList.add('active');

  // 지출 카테고리 표시 여부
  const categoryContainer = document.getElementById('category-container');
  categoryContainer.style.display = type === 'expense' ? 'block' : 'none';

  // 폼 초기화
  document.getElementById('transaction-description').value = '';
  document.getElementById('transaction-amount').value = '';
  document.getElementById('transaction-category').value = '식비';
  document.getElementById('custom-category').style.display = 'none';
  document.getElementById('custom-category').value = '';
}

// 카테고리 변경 처리
function handleCategoryChange() {
  const categorySelect = document.getElementById('transaction-category');
  const customCategory = document.getElementById('custom-category');

  if (categorySelect.value === '기타') {
    customCategory.style.display = 'block';
    customCategory.required = true;
  } else {
    customCategory.style.display = 'none';
    customCategory.required = false;
  }
}

// 거래 추가 함수 수정
function addTransaction(e) {
  e.preventDefault();

  const type = document.getElementById('transaction-type').value;
  const description = document.getElementById('transaction-description').value;
  const amount = Number(document.getElementById('transaction-amount').value);

  let category = '';
  if (type === 'expense') {
    const categorySelect = document.getElementById('transaction-category');
    if (categorySelect.value === '기타') {
      category = document.getElementById('custom-category').value;
    } else {
      category = categorySelect.value;
    }
  }

  const transaction = {
    type: type,
    description: description,
    amount: amount,
    category: category
  };

  if (!transactions[selectedDate]) {
    transactions[selectedDate] = [];
  }

  transactions[selectedDate].push(transaction);
  saveData();
  renderDayTransactions();
  renderCalendar();

  // 폼 초기화 및 숨기기
  document.getElementById('transaction-form').style.display = 'none';
  document.getElementById('transaction-form').reset();
  document.getElementById('income-btn').classList.remove('active');
  document.getElementById('expense-btn').classList.remove('active');
}

// 모달 열기 함수 수정
function openModal(dateKey) {
  selectedDate = dateKey;
  const modal = document.getElementById('transactionModal');
  const modalTitle = document.getElementById('modal-title');
  const [year, month, day] = dateKey.split('-');

  modalTitle.textContent = `${year}년 ${month}월 ${day}일 거래내역`;

  // 폼 초기화
  document.getElementById('transaction-form').style.display = 'none';
  document.getElementById('transaction-form').reset();
  document.getElementById('income-btn').classList.remove('active');
  document.getElementById('expense-btn').classList.remove('active');
  document.getElementById('category-container').style.display = 'none';
  document.getElementById('custom-category').style.display = 'none';

  renderDayTransactions();
  modal.style.display = 'block';
}

// 총계 업데이트
function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  Object.values(transactions).forEach(dayTransactions => {
    dayTransactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });
  });

  document.getElementById('income-box').textContent = formatCurrency(totalIncome);
  document.getElementById('expense-box').textContent = formatCurrency(totalExpense);
  document.getElementById('balance-box').textContent = formatCurrency(totalIncome - totalExpense);
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', init);

// 모달 닫기 버튼 이벤트
document.querySelector('.close').addEventListener('click', closeModal);

// 모달 외

const CATEGORY_COLORS = {
  '식비': '#FF6384',
  '교통': '#36A2EB',
  '주거': '#FFCE56',
  '의료': '#4BC0C0',
  '문화': '#9966FF',
  '기타': '#FF9F40'
};

function calculateCategoryExpenses() {
  const categoryExpenses = {};

  // 모든 날짜의 거래 내역 순회
  Object.values(transactions).forEach(dayTransactions => {
    dayTransactions.forEach(transaction => {
      // 지출 거래만 계산
      if (transaction.type === 'expense') {
        const category = transaction.category;
        if (!categoryExpenses[category]) {
          categoryExpenses[category] = 0;
        }
        categoryExpenses[category] += transaction.amount;
      }
    });
  });

  // 카테고리 지출을 배열로 변환하고 정렬
  return Object.entries(categoryExpenses)
    .map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS['기타']
    }))
    .sort((a, b) => b.amount - a.amount);
}

function renderConsumptionPieChart() {
  const ctx = document.getElementById('consumption-chart').getContext('2d');

  // 카테고리별 지출 계산
  const categoryExpenses = calculateCategoryExpenses();

  // 지출이 없는 경우 처리
  if (categoryExpenses.length === 0) {
    document.getElementById('consumption-chart').style.display = 'none';
    const chartContainer = document.getElementById('consumption-pattern');
    chartContainer.innerHTML += '<p>아직 지출 내역이 없습니다.</p>';
    return;
  }

  // 여기서 가장 많이 지출한 항목 추가
  const highestExpenseCategory = categoryExpenses[0];
  const totalExpense = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);

  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categoryExpenses.map(t => t.category),
      datasets: [{
        data: categoryExpenses.map(t => t.amount),
        backgroundColor: categoryExpenses.map(t => t.color)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const totalExpense = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
              return `${context.label}: ${value.toLocaleString()}원 (${(value / totalExpense * 100).toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });

  // 지출 내역 텍스트 추가
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'consumption-details-vertical';

  // 가장 많이 지출한 항목 강조 추가
  const highestExpenseItem = document.createElement('div');
  highestExpenseItem.className = 'highest-expense-category';
  highestExpenseItem.innerHTML = `
    <strong>가장 많이 지출한 항목: ${highestExpenseCategory.category}</strong>
    <div class="expense-details">
      ${highestExpenseCategory.amount.toLocaleString()}원 
      (전체 지출의 ${(highestExpenseCategory.amount / totalExpense * 100).toFixed(1)}%)
    </div>
  `;
  detailsContainer.appendChild(highestExpenseItem);

  categoryExpenses.forEach(transaction => {
    const percentage = (transaction.amount / totalExpense * 100).toFixed(1);
    const detailItem = document.createElement('div');
    detailItem.className = 'consumption-item';
    detailItem.innerHTML = `
      <div class="category-label">
        <span class="color-dot" style="background-color:${transaction.color};"></span>
        ${transaction.category}
      </div>
      <div class="category-amount">
        ${transaction.amount.toLocaleString()}원 
        <span class="category-percentage">(${percentage}%)</span>
      </div>
    `;
    detailsContainer.appendChild(detailItem);
  });

  // 총 지출 추가
  const totalItem = document.createElement('div');
  totalItem.className = 'total-expense';
  totalItem.innerHTML = `<strong>총 지출: ${totalExpense.toLocaleString()}원</strong>`;
  detailsContainer.appendChild(totalItem);

  // 기존 차트 컨테이너에 추가
  const chartContainer = document.getElementById('consumption-pattern');
  chartContainer.appendChild(detailsContainer);
}

// 주간 및 월간 분석을 위한 새로운 함수들

// 날짜 범위 내의 모든 거래 필터링
function getTransactionsInDateRange(startDate, endDate) {
  const filteredTransactions = {};

  Object.keys(transactions).forEach(dateKey => {
    const currentDate = new Date(dateKey); // transactions의 키를 Date 객체로 변환
    if (currentDate >= startDate && currentDate <= endDate) {
      filteredTransactions[dateKey] = transactions[dateKey];
    }
  });

  console.log('Filtered transactions:', filteredTransactions); // 디버깅용
  return filteredTransactions;
}


// 주간 분석 상세 기능
function enhancedWeeklyAnalysis() {
  const today = new Date();
  const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);

  const weekTransactions = getTransactionsInDateRange(oneWeekAgo, today);
  const dailyExpenses = {};
  let totalWeeklyExpense = 0;
  let mostExpensiveDay = null;
  let maxDailyExpense = 0;

  Object.entries(weekTransactions).forEach(([dateKey, dayTransactions]) => {
    const dailyExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // ISO 날짜 문자열 형식으로 키 생성
    const isoDateKey = new Date(dateKey).toISOString().split('T')[0];
    dailyExpenses[isoDateKey] = dailyExpense;
    totalWeeklyExpense += dailyExpense;

    if (dailyExpense > maxDailyExpense) {
      maxDailyExpense = dailyExpense;
      mostExpensiveDay = dateKey;
    }
  });

  // 지난 주와 비교
  const twoWeeksAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13);
  const lastWeekTransactions = getTransactionsInDateRange(twoWeeksAgo, oneWeekAgo);
  const lastWeekTotalExpense = Object.values(lastWeekTransactions)
    .flat()
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklyExpenseChange = lastWeekTotalExpense > 0 ?
    ((totalWeeklyExpense - lastWeekTotalExpense) / lastWeekTotalExpense * 100).toFixed(1) :
    0;

  // UI 업데이트
  document.getElementById('weekly-total-expense').textContent = `총 지출: ${totalWeeklyExpense.toLocaleString()}원`;
  document.getElementById('weekly-daily-avg').textContent = `일일 평균 지출: ${Math.floor(totalWeeklyExpense / 7).toLocaleString()}원`;
  document.getElementById('most-expensive-day').textContent = `가장 많이 쓴 날: ${mostExpensiveDay} (${maxDailyExpense.toLocaleString()}원)`;
  document.getElementById('weekly-expense-comparison').textContent = `지난 주 대비 ${weeklyExpenseChange}%`;

  // 막대 그래프 렌더링
  renderWeeklyBarChart(dailyExpenses);
}

function renderWeeklyBarChart(dailyExpenses) {
  const canvas = document.getElementById('weekly-bar-chart');
  const ctx = canvas.getContext('2d');

  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const today = new Date();
  const labels = [];
  const data = [];

  // 최근 7일의 날짜를 올바르게 매칭
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i+1); 
    const dateKey = date.toISOString().split('T')[0]; // 날짜를 YYYY-MM-DD 형식으로 변환
    labels.push(`${date.getMonth() + 1}/${date.getDate() - 1}`); // X축 라벨
    data.push(dailyExpenses[dateKey] || 0); // 해당 날짜의 지출 데이터
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '일일 지출',
        data: data,
        backgroundColor: '#F9A455', // 막대 배경 색상
        borderColor: '#F9A455', // 막대 테두리 색상
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '지출 (원)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `지출: ${context.raw.toLocaleString()}원`;
            }
          }
        }
      }
    }
  });
}


// 월간 분석 상세 기능
function enhancedMonthlyAnalysis() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 최근 6개월의 월별 수입/지출 계산
  const monthlyIncome = {};
  const monthlyExpenses = {};

  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // 해당 월의 거래 데이터 필터링
    const monthTransactions = Object.entries(transactions)
      .filter(([dateKey]) => {
        const date = new Date(dateKey);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .flatMap(([_, dayTransactions]) => dayTransactions);

    // 해당 월의 총 수입 계산
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 해당 월의 총 지출 계산
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 월 데이터를 저장
    monthlyIncome[`${year}-${month + 1}`] = totalIncome;
    monthlyExpenses[`${year}-${month + 1}`] = totalExpense;
  }

  // 현재 월과 비교
  const currentMonthIncome = monthlyIncome[`${currentYear}-${currentMonth + 1}`] || 0;
  const currentMonthExpense = monthlyExpenses[`${currentYear}-${currentMonth + 1}`] || 0;
  const lastMonthExpense = monthlyExpenses[`${currentYear}-${currentMonth}`] || 0;

  const monthlyExpenseChange = lastMonthExpense > 0
    ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)
    : 0;

  // 저축률 계산
  const monthlyBalance = currentMonthIncome - currentMonthExpense;
  const savingsRate = currentMonthIncome > 0
    ? ((monthlyBalance / currentMonthIncome) * 100).toFixed(2)
    : 0;

  // UI 업데이트
  document.getElementById('monthly-income').textContent = `총 수입: ${currentMonthIncome.toLocaleString()}원`;
  document.getElementById('monthly-expense').textContent = `총 지출: ${currentMonthExpense.toLocaleString()}원`;
  document.getElementById('monthly-balance').textContent = `잔액: ${monthlyBalance.toLocaleString()}원`;
  document.getElementById('monthly-savings-rate').textContent = `저축률: ${savingsRate}%`;
  document.getElementById('monthly-expense-comparison').textContent = `지난 달 대비 ${monthlyExpenseChange}%`;

  // 최근 6개월 그래프 렌더링
  renderMonthlyBarChart(monthlyIncome, monthlyExpenses);
}


function getMonthlyExpenseData(currentMonth, currentYear) {
  const monthlyExpenses = {};

  for (let i = 0; i < 30; i++) {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dateKey = date.toISOString().split('T')[0];

    const dayTransactions = transactions[dateKey] || [];
    const dailyExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyExpenses[dateKey] = dailyExpense;
  }

  return monthlyExpenses;
}


function renderMonthlyBarChart(monthlyExpenses) {
  const canvas = document.getElementById('monthly-bar-chart');
  const ctx = canvas.getContext('2d');

  // 월 데이터에서 라벨과 값 분리
  const labels = Object.keys(monthlyExpenses).map(key => {
    const [year, month] = key.split('-');
    return `${month}월`; // "1월", "2월" 형식
  });

  const data = Object.values(monthlyExpenses);

  // 차트 생성
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '월간 지출',
        data: data,
        backgroundColor: '#F9A455',
        borderColor: '#F9A455',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '지출 (원)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `지출: ${context.raw.toLocaleString()}원`;
            }
          }
        }
      }
    }
  });
}

// 네비게이션 스크롤 기능
function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({
    behavior: 'smooth'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderConsumptionPieChart();
  enhancedWeeklyAnalysis();
  enhancedMonthlyAnalysis();

  // 네비게이션 버튼에 이벤트 리스너 추가
  document.querySelector('.nav-links a[onclick="showMonthlyAnalysis()"]').addEventListener('click', () => {
    scrollToSection('consumption-pattern');
  });

  document.querySelector('.nav-links').children[1].querySelector('a').addEventListener('click', () => {
    scrollToSection('weekly-analysis');
  });

  document.querySelector('.nav-links').children[2].querySelector('a').addEventListener('click', () => {
    scrollToSection('monthly-analysis');
  });
});