let deals = [];
let selectedIds = new Set(JSON.parse(localStorage.getItem('dgCart') || '[]'));
let currentCat = 'all';

async function loadDeals() {
  try {
    const res = await fetch(`deals.json?t=${Date.now()}`);
    const data = await res.json();
    deals = data.deals || [];
    document.getElementById('updated').textContent = `Updated: ${data.updated || 'Just now'}`;
    render();
  } catch (e) {
    document.getElementById('updated').textContent = 'Error loading deals.json';
  }
}

function updateCartBar() {
  let count = 0, total = 0;
  deals.forEach(d => {
    if (selectedIds.has(d.id)) {
      count++;
      total += Number(d.finalPrice || 0);
    }
  });
  document.getElementById('cart-count').textContent = `${count} item${count === 1 ? '' : 's'} checked`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)} est. total`;
  localStorage.setItem('dgCart', JSON.stringify([...selectedIds]));
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const list = document.getElementById('deals-list');
  const filtered = deals.filter(d => {
    const matchText = (d.title + ' ' + d.coupon).toLowerCase().includes(q);
    if (!matchText) return false;
    if (currentCat === 'all') return true;
    if (currentCat === 'under1') return Number(d.finalPrice) <= 1.00;
    return d.category === currentCat;
  });

  list.innerHTML = filtered.map(d => `
    <div class="card">
      <div class="card-top">
        <h2>${d.title}</h2>
        <span class="badge">${d.category}</span>
      </div>
      <p class="coupon-text">Coupon: ${d.coupon}</p>
      <div class="prices">
        <span>Shelf: $${Number(d.shelfPrice).toFixed(2)}</span>
        <span class="final-price">Pay: $${Number(d.finalPrice).toFixed(2)}</span>
      </div>
      <label class="check-label">
        <input type="checkbox" ${selectedIds.has(d.id) ? 'checked' : ''} onchange="toggleItem('${d.id}')">
        Add to my store trip
      </label>
    </div>
  `).join('') || '<p style="color:#888;text-align:center;">No matching deals found.</p>';

  updateCartBar();
}

function toggleItem(id) {
  selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  updateCartBar();
}

document.getElementById('search').addEventListener('input', render);
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter.active').classList.remove('active');
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    render();
  });
});
document.getElementById('clear-cart').addEventListener('click', () => {
  selectedIds.clear();
  render();
});

loadDeals();
