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
  const savedTransactions = localStorage.getItem('transactions');
  if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);

    // 카테고리 필드 검증 및 초기화
    Object.values(transactions).forEach(dayTransactions => {
      dayTransactions.forEach(transaction => {
        if (transaction.type === 'expense' && !transaction.category) {
          transaction.category = '기타'; // 기본 카테고리 설정
        }
      });
    });
  }

  const savedRegularItems = localStorage.getItem('regularItems');
  if (savedRegularItems) {
    const regularItems = JSON.parse(savedRegularItems);
    integrateRegularItems(regularItems); // 정기 항목 반영
  }

  updateSummary(); // 수입/지출 합계 업데이트
}

function integrateRegularItems(regularItems) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  regularItems.forEach(item => {
    const dateKey = `${year}-${month + 1}-${item.day.replace('일', '').padStart(2, '0')}`;
    if (!transactions[dateKey]) {
      transactions[dateKey] = [];
    }

    // 디버깅: item 전체 정보 출력
    console.log('현재 처리 중인 item:', item);

    const newTransaction = {
      type: item.type, // 'income' 또는 'expense'를 그대로 사용
      description: item.name,
      amount: item.amount,
      category: item.type === 'income' ? '수입' : '정기결제', // type에 따라 category 설정
    };

    // 중복 방지 로직
    const isDuplicate = transactions[dateKey].some(
      t => t.description === item.name && t.amount === item.amount && t.type === item.type
    );

    if (!isDuplicate) {
      transactions[dateKey].push(newTransaction);

      // 디버깅: 추가된 거래 내역 확인
      console.log('추가된 거래 내역:', newTransaction);
    }
  });

  // 디버깅: 통합된 거래내역 상태 확인
  console.log('통합된 거래내역:', transactions);
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
    const dateKey = `${year}-${month + 1}-${String(day).padStart(2, '0')}`;
    const dayTransactions = transactions[dateKey] || [];

    let income = 0;
    let expense = 0;
    dayTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });

    calendar.innerHTML += `
      <div class="calendar-day" onclick="openModal('${dateKey}')">
        <div class="day-number">${day}</div>
        <div class="day-summary">
          ${income > 0 ? `<div class="income">+${formatCurrency(income)}</div>` : ''}
          ${expense > 0 ? `<div class="expense">-${formatCurrency(expense)}</div>` : ''}
        </div>
      </div>
    `;
  }

  console.log('캘린더 렌더링 완료:', transactions); // 디버깅용
}

// 정기 항목 가져오기
function getRegularItemsForDay(day) {
  const regularItems = JSON.parse(localStorage.getItem('regularItems')) || [];
  return regularItems.filter(item => parseInt(item.day) === day);
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

  // 날짜 제목 설정
  const [year, month, day] = dateKey.split('-').map(Number);
  modalTitle.textContent = `${year}년 ${month}월 ${day}일 거래내역`;

  // 폼 초기화
  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.style.display = 'grid'; // 폼이 보이도록 설정
    transactionForm.reset(); // 폼 초기화
  } else {
    console.error('거래내역 폼(transaction-form)이 존재하지 않습니다.');
  }

  // 버튼 상태 초기화
  const incomeBtn = document.getElementById('income-btn');
  const expenseBtn = document.getElementById('expense-btn');
  if (incomeBtn && expenseBtn) {
    incomeBtn.classList.remove('active');
    expenseBtn.classList.remove('active');
  } else {
    console.error('거래 유형 버튼이 존재하지 않습니다.');
  }

  // 카테고리 관련 초기화
  const categoryContainer = document.getElementById('category-container');
  const customCategory = document.getElementById('custom-category');
  if (categoryContainer && customCategory) {
    categoryContainer.style.display = 'none';
    customCategory.style.display = 'none';
  }

  // 해당 날짜의 거래내역 렌더링
  renderDayTransactions(dateKey);

  // 모달 표시
  if (modal) {
    modal.style.display = 'block';
  } else {
    console.error('모달(transactionModal)이 존재하지 않습니다.');
  }
}

function closeModal() {
  document.getElementById('transactionModal').style.display = 'none';
  document.getElementById('transaction-form').reset();
}

// 날짜별 거래내역 표시 (정기 항목 포함)
function renderDayTransactions(dateKey) {
  const listElement = document.getElementById('day-transactions');
  const dayTransactions = transactions[dateKey] || [];

  if (!listElement) {
    console.error('day-transactions 요소가 존재하지 않습니다.');
    return;
  }

  if (dayTransactions.length === 0) {
    listElement.innerHTML = '<p>등록된 거래내역이 없습니다.</p>';
    return;
  }

  listElement.innerHTML = dayTransactions
    .map(t => `
      <div class="transaction-item">
        <div>
          <strong>${t.type === 'income' ? '수입' : '지출'}</strong>: ${t.description} 
          ${t.category === '정기결제' || t.category === '수입' ? '<span class="tag">(정기)</span>' : ''}
        </div>
        <div class="${t.type === 'income' ? 'income' : 'expense'}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </div>
      </div>
    `)
    .join('');
}

// 사용자 입력 항목만 삭제
function deleteTransaction(dateKey, description) {
  const dayTransactions = transactions[dateKey] || [];
  transactions[dateKey] = dayTransactions.filter(t => t.description !== description);

  // 데이터 저장 및 UI 업데이트
  saveData();
  renderDayTransactions(dateKey);
  renderCalendar();
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
  const description = document.getElementById('transaction-description').value.trim();
  const amount = Number(document.getElementById('transaction-amount').value);

  let category = '';
  if (type === 'expense') {
    const categorySelect = document.getElementById('transaction-category');
    if (categorySelect.value === '기타') {
      category = document.getElementById('custom-category').value.trim();
    } else {
      category = categorySelect.value;
    }
  }

  if (!type || !description || isNaN(amount) || amount <= 0 || (type === 'expense' && !category)) {
    alert('모든 필드를 올바르게 입력해주세요.');
    return;
  }

  if (!transactions[selectedDate]) {
    transactions[selectedDate] = [];
  }

  transactions[selectedDate].push({
    type: type,
    description: description,
    amount: amount,
    category: category || '수입' // 수입은 기본적으로 '수입'으로 설정
  });

  saveData();
  renderDayTransactions(selectedDate);
  renderCalendar();

  // 폼 초기화
  document.getElementById('transaction-form').reset();
  document.getElementById('income-btn').classList.remove('active');
  document.getElementById('expense-btn').classList.remove('active');
}


// 모달 열기 함수 수정
function openModal(dateKey) {
  selectedDate = dateKey;
  const modal = document.getElementById('transactionModal');
  const modalTitle = document.getElementById('modal-title');

  // 날짜 제목 설정
  const [year, month, day] = dateKey.split('-').map(Number);
  modalTitle.textContent = `${year}년 ${month}월 ${day}일 거래내역`;

  // 폼 초기화
  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.style.display = 'grid'; // 폼이 보이도록 설정
    transactionForm.reset(); // 폼 초기화
  } else {
    console.error('거래내역 폼(transaction-form)이 존재하지 않습니다.');
  }

  // 버튼 상태 초기화
  document.getElementById('income-btn').classList.remove('active');
  document.getElementById('expense-btn').classList.remove('active');

  // 거래내역 렌더링
  renderDayTransactions(dateKey);

  // 모달 표시
  modal.style.display = 'block';
}


// 총계 업데이트
function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  Object.values(transactions).forEach(dayTransactions => {
    dayTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount; // 정기수입 포함
      } else if (t.type === 'expense') {
        totalExpense += t.amount; // 정기결제 포함
      }
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
  '기타': '#FF9F40',
  '정기결제': '#F9A455'
};

function calculateCategoryExpensesForMonth(year, month) {
  const categoryExpenses = {};
  const filteredTransactions = Object.entries(transactions).filter(([dateKey]) => {
    const [txnYear, txnMonth] = dateKey.split('-');
    return parseInt(txnYear) === year && parseInt(txnMonth) === month;
  });

  filteredTransactions.forEach(([_, dayTransactions]) => {
    dayTransactions.forEach(transaction => {
      if (transaction.type === 'expense') { // 지출만 포함
        const category = transaction.category || '기타';
        if (!categoryExpenses[category]) {
          categoryExpenses[category] = 0;
        }
        categoryExpenses[category] += transaction.amount;
      }
    });
  });

  return Object.entries(categoryExpenses)
    .map(([category, amount]) => ({
      category,
      amount
    }))
    .sort((a, b) => b.amount - a.amount);
}

let displayedYear = currentDate.getFullYear();
let displayedMonth = currentDate.getMonth() + 1;

function changeConsumptionMonth(direction) {
  displayedMonth += direction;

  // 이전/다음 연도로 이동
  if (displayedMonth < 1) {
    displayedMonth = 12;
    displayedYear -= 1;
  } else if (displayedMonth > 12) {
    displayedMonth = 1;
    displayedYear += 1;
  }

  // 새롭게 렌더링
  renderMonthlyConsumption(displayedYear, displayedMonth);
}

function renderMonthlyConsumption(year, month) {
  const categoryExpenses = calculateCategoryExpensesForMonth(year, month);
  const ctx = document.getElementById('consumption-chart').getContext('2d');
  const labels = categoryExpenses.map(expense => expense.category);
  const data = categoryExpenses.map(expense => expense.amount);

  // 현재 년/월 텍스트 업데이트
  const currentMonthDisplay = document.getElementById('current-month');
  currentMonthDisplay.textContent = `${year}년 ${month}월`;

  // 기존 차트를 초기화하고 다시 생성
  if (window.consumptionChart) {
    window.consumptionChart.destroy();
  }

  window.consumptionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: labels.map(category => CATEGORY_COLORS[category] || CATEGORY_COLORS['기타']),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const total = data.reduce((sum, val) => sum + val, 0);
              return `${context.label}: ${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });

  // 소비 내역 렌더링
  renderConsumptionDetails(year, month);
}

function renderConsumptionPieChart() {
  const ctx = document.getElementById('consumption-chart').getContext('2d');
  const categoryExpenses = calculateCategoryExpenses();

  if (categoryExpenses.length === 0) {
    document.getElementById('consumption-chart').style.display = 'none';
    document.getElementById('consumption-pattern').innerHTML = '<p>아직 지출 내역이 없습니다.</p>';
    return;
  }

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
          display: true
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const total = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
              return `${context.label}: ${value.toLocaleString()}원 (${(value / total * 100).toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });
}

function renderConsumptionDetails(year, month) {
  const categoryExpenses = calculateCategoryExpensesForMonth(year, month);
  const detailsContainer = document.getElementById('consumption-details');
  const mostSpentCategory = categoryExpenses[0]?.category || '없음';

  detailsContainer.innerHTML = `
    <h3>가장 많이 소비한 카테고리: <strong>${mostSpentCategory}</strong></h3>
    <ul>
      ${categoryExpenses.map(expense => `
        <li>${expense.category}: ${formatCurrency(expense.amount)}</li>
      `).join('')}
    </ul>
  `;
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
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + 1);
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

  // 최근 6개월의 월별 지출 계산
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

    // 해당 월의 총 지출 계산
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyExpenses[`${year}-${month + 1}`] = totalExpense; // 월 데이터를 저장
  }

  // 현재 월의 데이터
  const currentMonthKey = `${currentYear}-${currentMonth + 1}`;
  const currentMonthExpense = monthlyExpenses[currentMonthKey] || 0;

  // 지난 달의 데이터
  const lastMonthKey = currentMonth - 1 >= 0 ?
    `${currentYear}-${currentMonth}` :
    `${currentYear - 1}-12`;

  const lastMonthExpense = monthlyExpenses[lastMonthKey] || 0;

  // 증감률 계산
  const monthlyExpenseChange = lastMonthExpense > 0 ?
    ((currentMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1) :
    0;

  // 현재 월 수입, 잔액 및 저축률 계산
  const currentMonthTransactions = Object.entries(transactions)
    .filter(([dateKey]) => {
      const date = new Date(dateKey);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    })
    .flatMap(([_, dayTransactions]) => dayTransactions);

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = currentMonthIncome - currentMonthExpense;
  const savingsRate = currentMonthIncome > 0 ?
    ((monthlyBalance / currentMonthIncome) * 100).toFixed(2) :
    0;

  // UI 업데이트
  document.getElementById('monthly-income').textContent = `총 수입: ${currentMonthIncome.toLocaleString()}원`;
  document.getElementById('monthly-expense').textContent = `총 지출: ${currentMonthExpense.toLocaleString()}원`;
  document.getElementById('monthly-balance').textContent = `잔액: ${monthlyBalance.toLocaleString()}원`;
  document.getElementById('monthly-savings-rate').textContent = `저축률: ${savingsRate}%`;
  document.getElementById('monthly-expense-comparison').textContent = `지난 달 대비 ${monthlyExpenseChange}%`;

  // 월간 지출 막대 그래프 렌더링
  renderMonthlyBarChart(monthlyExpenses);
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

  if (window.monthlyBarChart) {
    window.monthlyBarChart.destroy();
  }

  window.monthlyBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(monthlyExpenses).map(key => {
        const [year, month] = key.split('-');
        return `${month}월`;
      }),
      datasets: [{
        label: '월간 지출',
        data: Object.values(monthlyExpenses),
        backgroundColor: '#F9A455',
        borderColor: '#F9A455',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 비율 유지 안 함
      scales: {
        x: {
          ticks: {
            font: {
              size: 12 // 태블릿에 적합한 크기
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 12 // 태블릿에 적합한 크기
            }
          },
          title: {
            display: true,
            text: '지출 (원)',
            font: {
              size: 14 // 폰트 크기 조정
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: context => `지출: ${context.raw.toLocaleString()}원`
          }
        }
      }
    }
  });
}


// 네비게이션 스크롤 기능
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth', // 부드럽게 스크롤
      block: 'start' // 섹션의 상단으로 이동
    });
  } else {
    console.error(`섹션 ${sectionId}이(가) 존재하지 않습니다.`);
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0, // 화면의 맨 위로 이동
    behavior: 'smooth' // 부드럽게 스크롤
  });
}


document.addEventListener('DOMContentLoaded', () => {
  renderMonthlyConsumption(displayedYear, displayedMonth);
  //renderConsumptionPieChart();
  enhancedWeeklyAnalysis();
  enhancedMonthlyAnalysis();

  initCustomSettings()

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