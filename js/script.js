// ============================================
//  EXPENSE & BUDGET VISUALIZER - script.js
//  Semua fitur ada di sini!
// ============================================

// ---- KONFIGURASI ----
const SPENDING_LIMIT = 100000; // Highlight jika > Rp 100.000 per item

// Warna untuk setiap kategori di chart
const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Fun: '#8b5cf6',
  Custom: '#10b981',
};

// ---- AMBIL ELEMEN HTML ----
const form = document.getElementById('transactionForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const errorMsg = document.getElementById('errorMsg');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const chartEmptyMsg = document.getElementById('chartEmpty');

// ---- DATA: Ambil dari localStorage atau mulai kosong ----
// localStorage itu seperti "memori" browser — data tetap ada walau refresh!
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// ---- PIE CHART SETUP ----
const ctx = document.getElementById('expenseChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (item) => {
            return ` Rp ${item.raw.toLocaleString('id-ID')}`;
          }
        }
      }
    }
  }
});

// ---- FUNGSI SIMPAN KE LOCALSTORAGE ----
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ---- FUNGSI FORMAT RUPIAH ----
function formatRupiah(number) {
  return 'Rp ' + number.toLocaleString('id-ID');
}

// ---- FUNGSI UPDATE TOTAL SALDO ----
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  totalBalanceEl.textContent = formatRupiah(total);
}

// ---- FUNGSI UPDATE PIE CHART ----
function updateChart() {
  // Hitung total per kategori
  const categoryTotals = {};
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const colors = labels.map(l => CATEGORY_COLORS[l] || '#94a3b8');

  if (labels.length === 0) {
    chartEmptyMsg.style.display = 'block';
    document.getElementById('expenseChart').style.display = 'none';
  } else {
    chartEmptyMsg.style.display = 'none';
    document.getElementById('expenseChart').style.display = 'block';
  }

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = colors;
  chart.update();
}

// ---- FUNGSI RENDER DAFTAR TRANSAKSI ----
function renderTransactions() {
  // Ambil nilai sort
  const sortSelect = document.getElementById('sortSelect');
  const sortValue = sortSelect ? sortSelect.value : 'newest';

  // Buat salinan array untuk di-sort
  let sorted = [...transactions];
  if (sortValue === 'amount-desc') {
    sorted.sort((a, b) => b.amount - a.amount);
  } else if (sortValue === 'amount-asc') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortValue === 'category') {
    sorted.sort((a, b) => a.category.localeCompare(b.category));
  }
  // 'newest' = urutan default (terbaru di atas)

  if (sorted.length === 0) {
    transactionList.innerHTML = '<p class="empty-msg">Belum ada transaksi. Yuk tambah!</p>';
    return;
  }

  transactionList.innerHTML = sorted.map(t => {
    const isOverLimit = t.amount > SPENDING_LIMIT;
    const emoji = { Food: '🍔', Transport: '🚗', Fun: '🎮', Custom: '⭐' };
    return `
      <div class="transaction-item ${isOverLimit ? 'over-limit' : ''}" data-id="${t.id}">
        <div class="category-dot ${t.category}"></div>
        <div class="transaction-info">
          <div class="transaction-name">${t.name}</div>
          <div class="transaction-category">${emoji[t.category] || '📦'} ${t.category} ${isOverLimit ? '🔴 Melebihi limit!' : ''}</div>
        </div>
        <span class="transaction-amount">-${formatRupiah(t.amount)}</span>
        <button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Hapus">🗑️</button>
      </div>
    `;
  }).join('');
}

// ---- FUNGSI UPDATE SEMUA (dipanggil tiap ada perubahan) ----
function updateAll() {
  saveData();
  updateBalance();
  updateChart();
  renderTransactions();
}

// ---- FUNGSI HAPUS TRANSAKSI ----
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateAll();
}

// ---- FORM SUBMIT: Tambah Transaksi Baru ----
form.addEventListener('submit', function(e) {
  e.preventDefault(); // Cegah halaman refresh

  const name = itemNameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  // VALIDASI: semua field harus diisi
  if (!name || !amount || !category) {
    errorMsg.textContent = '⚠️ Semua field wajib diisi ya!';
    return;
  }
  if (amount <= 0) {
    errorMsg.textContent = '⚠️ Jumlah harus lebih dari 0!';
    return;
  }
  errorMsg.textContent = ''; // Hapus pesan error

  // Buat objek transaksi baru
  const newTransaction = {
    id: Date.now().toString(), // ID unik berdasarkan waktu
    name: name,
    amount: amount,
    category: category,
    date: new Date().toISOString(),
  };

  // Tambah ke array (paling atas)
  transactions.unshift(newTransaction);
  updateAll();

  // Reset form
  form.reset();
});

// ---- DARK MODE TOGGLE ----
// Ambil preferensi tersimpan atau default terang
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);

  // Update teks tombol
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️ Terang' : '🌙 Gelap';
}

// ---- INISIALISASI SAAT HALAMAN DIBUKA ----
updateAll();
console.log('Budget Tracker siap digunakan! 🚀');