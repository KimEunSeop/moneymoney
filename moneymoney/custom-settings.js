// 정기 항목 초기화 함수
function initCustomSettings() {
  const daySelect = document.getElementById('regular-date');

  // 1~31까지 옵션 생성
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i}일`;
    daySelect.appendChild(option);
  }

  // 폼 제출 이벤트 핸들링
  const form = document.getElementById('regular-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    registerRegularItem();
  });

  // 저장된 정기 항목 로드
  loadRegularItems();
}

// 정기 항목 등록 함수
function registerRegularItem() {
  const type = document.getElementById('regular-type').value;
  console.log(type);
  const day = document.getElementById('regular-date').value;
  const name = document.getElementById('regular-name').value.trim();
  const amount = parseInt(document.getElementById('regular-amount').value.trim(), 10);

  // 입력값 검증
  if (!type || !day || !name || isNaN(amount) || amount <= 0) {
    alert('모든 항목을 올바르게 입력해주세요.');
    return;
  }

  const newItem = {
    type: type, // 'expense' 또는 'income'
    day: `${day}일`,
    name,
    amount,
  };

  // 리스트에 추가
  addRegularItemToList(newItem);

  // 로컬 스토리지에 저장
  saveRegularItem(newItem);

  // 폼 초기화
  document.getElementById('regular-form').reset();
}

// 정기 항목 리스트에 추가
function addRegularItemToList(item) {
  const list = document.getElementById('regular-list');

  const listItem = document.createElement('div');
  listItem.className = 'regular-item';

  const typeText = item.type === 'expense' ? '정기 결제' : '정기 수입';

  listItem.innerHTML = `
    <p><strong>${typeText}</strong> - ${item.day} - ${item.name} - ${item.amount.toLocaleString()}원</p>
    <button class="delete-btn">삭제</button>
  `;

  // 삭제 버튼 이벤트 추가
  const deleteButton = listItem.querySelector('.delete-btn');
  deleteButton.addEventListener('click', () => removeRegularItem(item, listItem));

  list.appendChild(listItem);
}


// 정기 항목 삭제
function removeRegularItem(item, listItem) {
  const regularItems = JSON.parse(localStorage.getItem('regularItems')) || [];
  
  // 해당 항목을 제외한 새로운 배열 생성
  const updatedItems = regularItems.filter((savedItem) => {
    return !(
      savedItem.type === item.type &&
      savedItem.day === item.day &&
      savedItem.name === item.name &&
      savedItem.amount === item.amount
    );
  });

  // 로컬 스토리지 갱신
  localStorage.setItem('regularItems', JSON.stringify(updatedItems));

  // 리스트에서 항목 제거
  listItem.remove();

  // 빈 리스트 메시지 업데이트
  updateEmptyMessage();
}

// 로컬 스토리지에 항목 저장
function saveRegularItem(item) {
  const regularItems = JSON.parse(localStorage.getItem('regularItems')) || [];
  regularItems.push(item);
  localStorage.setItem('regularItems', JSON.stringify(regularItems));
}

// 로컬 스토리지에서 항목 로드
function loadRegularItems() {
  const regularItems = JSON.parse(localStorage.getItem('regularItems')) || [];

  // 기존 항목 리스트 초기화
  const list = document.getElementById('regular-list');
  list.innerHTML = '';

  // 항목이 없을 경우 빈 리스트 메시지 표시
  if (regularItems.length === 0) {
    updateEmptyMessage();
    return;
  }

  // 항목을 리스트에 추가
  regularItems.forEach((item) => {
    addRegularItemToList(item);
  });
}

// 빈 리스트 메시지 업데이트
function updateEmptyMessage() {
  const list = document.getElementById('regular-list');
}

// DOMContentLoaded 이벤트로 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  initCustomSettings();
});
