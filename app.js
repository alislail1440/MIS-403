const STORAGE_KEY = 'crumbCart';

const menuItems = [
  {
    id: 'croissant',
    name: 'Butter Croissant',
    price: 8,
    image: './assets/menu/butter_croissant.jpg'
  },
  {
    id: 'choc_cake',
    name: 'Chocolate Cake',
    price: 12,
    image: './assets/menu/chocolate_cake.jpg'
  },
  {
    id: 'sourdough',
    name: 'Sourdough Bread',
    price: 6.0,
    image: './assets/menu/sourdough_bread.jpg'
  },
  {
    id: 'almond_buns',
    name: 'Almond Buns',
    price: 30,
    image: './assets/menu/almond_bun.jpg'
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    price: 15,
    image: './assets/menu/tiramisu.jpg'
  },
  {
    id: 'souffle',
    name: 'Souffle',
    price: 18,
    image: './assets/menu/souffle.jpg'
  }
];

function getCart() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {};
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function addItemToCart(productId) {
  const cart = getCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
}

function removeItemFromCart(productId) {
  const cart = getCart();
  delete cart[productId];
  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  if (quantity < 1) {
    delete cart[productId];
  } else {
    cart[productId] = quantity;
  }
  saveCart(cart);
}

function getCartDetails() {
  const cart = getCart();
  return Object.entries(cart).map(([productId, quantity]) => {
    const item = menuItems.find(product => product.id === productId);
    return {
      ...item,
      quantity
    };
  });
}

function getTotalItems() {
  return Object.values(getCart()).reduce((total, qty) => total + qty, 0);
}

function getTotalPrice() {
  return getCartDetails().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function formatPrice(value) {
  return `SAR ${value.toFixed(2)}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function calculatePrepMinutes() {
  const itemCount = getTotalItems();
  return 15 + itemCount * 5;
}

function getEarliestPickupTime() {
  const now = new Date();
  const minutesToAdd = calculatePrepMinutes();
  now.setMinutes(now.getMinutes() + minutesToAdd);
  return now;
}


function renderHeroSlideshow() {
  const container = document.getElementById('hero-slides');
  const dotsContainer = document.getElementById('hero-dots');
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  if (!container || !dotsContainer) return;

  const slides = menuItems.slice();
  container.innerHTML = slides.map(s => `<img src="${s.image}" alt="${s.name}">`).join('');
  dotsContainer.innerHTML = slides.map((_, i) => `<button data-index="${i}" aria-label="Slide ${i+1}"></button>`).join('');

  const track = container;
  const dots = Array.from(dotsContainer.querySelectorAll('button'));
  let current = 0;
  let timer = null;

  function update() {
    const wrapper = track.parentElement || track;
    const slideWidth = wrapper.clientWidth || track.clientWidth || 0;
    track.style.transform = `translateX(-${current * slideWidth}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() {
    current = (current + 1) % slides.length;
    update();
  }

  function prev() {
    current = (current - 1 + slides.length) % slides.length;
    update();
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, 4000);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  nextBtn?.addEventListener('click', () => { next(); startAuto(); });
  prevBtn?.addEventListener('click', () => { prev(); startAuto(); });
  dots.forEach(d => d.addEventListener('click', (e) => {
    const i = Number(e.currentTarget.dataset.index);
    current = i;
    update();
    startAuto();
  }));

  window.addEventListener('resize', update);
  update();
  startAuto();
}

function highlightActiveNav() {
  const pathname = window.location.pathname;
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.getAttribute('href') === pathname.split('/').pop() || link.getAttribute('href') === pathname) {
      link.classList.add('active');
    }
  });
}

function renderMenuPage() {
  const menuGrid = document.getElementById('menu-grid');
  if (!menuGrid) return;

  const cart = getCart();
  menuGrid.innerHTML = menuItems.map(item => {
    const qty = cart[item.id] || 0;
    const controlHtml = qty > 0 ? `
        <div class="quantity-controls" data-product-id="${item.id}">
          <button type="button" data-action="decrease" data-product-id="${item.id}">−</button>
          <span>${qty}</span>
          <button type="button" data-action="increase" data-product-id="${item.id}">+</button>
        </div>
      ` : `
        <button class="button button-primary" type="button" data-product-id="${item.id}">Add to Box</button>
      `;

    return `
    <article class="card menu-card">
      <img src="${item.image}" alt="${item.name}" class="card-image">
      <div class="card-content">
        <div class="price-row">
          <h3>${item.name}</h3>
          <span class="price-badge">${formatPrice(item.price)}</span>
        </div>
        <p>Freshly baked and packaged for quick pickup.</p>
        ${controlHtml}
      </div>
    </article>
  `;
  }).join('');

  menuGrid.onclick = event => {
    const target = event.target;
    const productId = target.dataset.productId || target.closest('[data-product-id]')?.dataset.productId;
    if (!productId) return;

    const action = target.dataset.action;

    if (!action) {
  
      addItemToCart(productId);
      renderMenuPage();
      renderCheckoutPage();
      return;
    }

    if (action === 'increase') {
      addItemToCart(productId);
      renderMenuPage();
      renderCheckoutPage();
    }

    if (action === 'decrease') {
      const currentQuantity = getCart()[productId] || 0;
      if (currentQuantity > 1) {
        updateCartQuantity(productId, currentQuantity - 1);
      } else {
        removeItemFromCart(productId);
      }
      renderMenuPage();
      renderCheckoutPage();
    }
  };
}

function renderCheckoutPage() {
  const cartContainer = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  const pickupInput = document.getElementById('pickup-time');
  const feedback = document.getElementById('pickup-feedback');
  const orderForm = document.getElementById('order-form');
  const errorBox = document.getElementById('form-error');

  if (!cartContainer || !totalElement || !pickupInput || !feedback || !orderForm || !errorBox) return;

  const cartDetails = getCartDetails();

  if (cartDetails.length === 0) {
    cartContainer.innerHTML = '<div class="cart-item"><p>Your box is empty. Add treats from the menu to continue.</p></div>';
    totalElement.textContent = formatPrice(0);
    pickupInput.disabled = true;
    pickupInput.value = '';
    pickupInput.removeAttribute('min');
    feedback.textContent = 'Add items to your box to see pickup availability.';
    return;
  }

  cartContainer.innerHTML = cartDetails.map(item => `
    <article class="cart-item">
      <div class="cart-item-details">
        <div>
          <h3>${item.name}</h3>
          <p>${formatPrice(item.price)} each</p>
        </div>
        <div class="cart-meta">
          <div class="quantity-controls" data-product-id="${item.id}">
            <button type="button" data-action="decrease">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="increase">+</button>
          </div>
          <button class="cart-remove" type="button" data-action="remove" data-product-id="${item.id}">Remove</button>
        </div>
      </div>
      <p>Line total: ${formatPrice(item.price * item.quantity)}</p>
    </article>
  `).join('');

  totalElement.textContent = formatPrice(getTotalPrice());
  const earliest = getEarliestPickupTime();
  const earliestValue = formatTime(earliest);
  pickupInput.disabled = false;
  pickupInput.min = earliestValue;
  pickupInput.value = earliestValue;
  feedback.textContent = `Your order has ${getTotalItems()} items. Baking & packing prep time: ${calculatePrepMinutes()} minutes. Earliest pickup: ${earliestValue}.`;

  cartContainer.onclick = event => {
    const target = event.target;
    const action = target.dataset.action;
    const productId = target.dataset.productId || target.closest('[data-product-id]')?.dataset.productId;
    if (!action || !productId) return;

    const currentQuantity = getCart()[productId] || 0;

    if (action === 'increase') {
      updateCartQuantity(productId, currentQuantity + 1);
      renderCheckoutPage();
    }
    if (action === 'decrease') {
      if (currentQuantity > 1) {
        updateCartQuantity(productId, currentQuantity - 1);
      } else {
        removeItemFromCart(productId);
      }
      renderCheckoutPage();
    }
    if (action === 'remove') {
      removeItemFromCart(productId);
      renderCheckoutPage();
    }
  };

  orderForm.onsubmit = event => {
    event.preventDefault();
    errorBox.textContent = '';

    const selectedTime = pickupInput.value;
    const minAllowed = pickupInput.min;

    if (getTotalItems() === 0) {
      errorBox.textContent = 'Your cart is empty. Please add at least one item before placing the order.';
      return;
    }

    if (!selectedTime) {
      errorBox.textContent = 'Please choose a pickup time.';
      return;
    }

    if (selectedTime < minAllowed) {
      errorBox.textContent = `Please select a pickup time no earlier than ${minAllowed}.`;
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    alert('Thank you! Your order is confirmed for pickup.');
    window.location.href = 'index.html';
  };
}

window.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  renderHeroSlideshow();
  renderMenuPage();
  renderCheckoutPage();
});
