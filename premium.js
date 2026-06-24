// =============================================
//   AURA — Premium & Payment System
// =============================================

// ---- Config ----
const PAYMENT_CONFIG = {
  instapayUsername: 'mahmsaeid1@instapay',
  instapayNumber:   '01108133798',
  vodafoneNumber:   '01108133798',
  orangeNumber:     '01108133798',
  etisalatNumber:   '01108133798',
  ownerWhatsapp:    '201108133798',   // رقم واتساب المالك (بدون +)
};

// ---- Activation Codes (100 كود) ----
const VALID_CODES = [
  'AURA-A1B2', 'AURA-C3D4', 'AURA-E5F6', 'AURA-G7H8', 'AURA-I9J0',
  'AURA-K1L2', 'AURA-M3N4', 'AURA-O5P6', 'AURA-Q7R8', 'AURA-S9T0',
  'AURA-U1V2', 'AURA-W3X4', 'AURA-Y5Z6', 'AURA-7A8B', 'AURA-9C0D',
  'AURA-2E3F', 'AURA-4G5H', 'AURA-6I7J', 'AURA-8K9L', 'AURA-0M1N',
  'AURA-3O4P', 'AURA-5Q6R', 'AURA-7S8T', 'AURA-9U0V', 'AURA-1W2X',
  'AURA-3Y4Z', 'AURA-5A6C', 'AURA-7B8D', 'AURA-9E0F', 'AURA-2G3I',
  'AURA-4H5K', 'AURA-6J7M', 'AURA-8L9O', 'AURA-0N1Q', 'AURA-3P4S',
  'AURA-5R6U', 'AURA-7T8W', 'AURA-9V0Y', 'AURA-1X2Z', 'AURA-4A3B',
  'AURA-6C5D', 'AURA-8E7F', 'AURA-0G9H', 'AURA-2I1J', 'AURA-4K3L',
  'AURA-6M5N', 'AURA-8O7P', 'AURA-0Q9R', 'AURA-2S1T', 'AURA-4U3V',
  'AURA-VIP01', 'AURA-VIP02', 'AURA-VIP03', 'AURA-VIP04', 'AURA-VIP05',
  'AURA-VIP06', 'AURA-VIP07', 'AURA-VIP08', 'AURA-VIP09', 'AURA-VIP10',
  'AURA-PRO11', 'AURA-PRO12', 'AURA-PRO13', 'AURA-PRO14', 'AURA-PRO15',
  'AURA-PRO16', 'AURA-PRO17', 'AURA-PRO18', 'AURA-PRO19', 'AURA-PRO20',
  'AURA-GLD21', 'AURA-GLD22', 'AURA-GLD23', 'AURA-GLD24', 'AURA-GLD25',
  'AURA-GLD26', 'AURA-GLD27', 'AURA-GLD28', 'AURA-GLD29', 'AURA-GLD30',
  'AURA-PLT31', 'AURA-PLT32', 'AURA-PLT33', 'AURA-PLT34', 'AURA-PLT35',
  'AURA-PLT36', 'AURA-PLT37', 'AURA-PLT38', 'AURA-PLT39', 'AURA-PLT40',
  'AURA-ELT41', 'AURA-ELT42', 'AURA-ELT43', 'AURA-ELT44', 'AURA-ELT45',
  'AURA-ELT46', 'AURA-ELT47', 'AURA-ELT48', 'AURA-ELT49', 'AURA-ELT50',
];

// ---- State ----
let selectedPlan = { plan: 'annual', price: 399, label: 'الخطة السنوية — 399 جنيه / سنة' };
let selectedWalletType = 'vodafone';

// ---- Register premium screens ----
screens.premium   = document.getElementById('premiumScreen');
screens.payMethod = document.getElementById('paymentMethodScreen');
screens.visa      = document.getElementById('visaScreen');
screens.instapay  = document.getElementById('instapayScreen');
screens.wallet    = document.getElementById('walletScreen');
screens.success   = document.getElementById('successScreen');

// ---- Open Premium ----
function openPremium() {
  showScreenWithNav('premium');
  bottomNav.classList.remove('visible');
}

// ---- Plan Selection ----
document.getElementById('planMonthly').addEventListener('click', () => {
  selectedPlan = { plan: 'monthly', price: 49, label: 'الخطة الشهرية — 49 جنيه / شهر' };
  document.getElementById('planMonthly').classList.add('active');
  document.getElementById('planAnnual').classList.remove('active');
});
document.getElementById('planAnnual').addEventListener('click', () => {
  selectedPlan = { plan: 'annual', price: 399, label: 'الخطة السنوية — 399 جنيه / سنة' };
  document.getElementById('planAnnual').classList.add('active');
  document.getElementById('planMonthly').classList.remove('active');
});

// ---- Go to payment ----
document.getElementById('goToPayment').addEventListener('click', () => {
  document.getElementById('selectedPlanBadge').textContent = selectedPlan.label;
  showScreen('payMethod');
});

// ---- Back buttons ----
document.getElementById('backFromPremium').addEventListener('click', () => {
  showScreenWithNav('landing');
  bottomNav.classList.add('visible');
});
document.getElementById('backFromPayMethod').addEventListener('click', () => showScreen('premium'));
document.getElementById('backFromVisa').addEventListener('click', () => showScreen('payMethod'));
document.getElementById('backFromInstapay').addEventListener('click', () => showScreen('payMethod'));
document.getElementById('backFromWallet').addEventListener('click', () => showScreen('payMethod'));

// ---- Payment Method Selection ----
document.getElementById('payVisa').addEventListener('click', () => {
  document.getElementById('visaPlanBadge').textContent = selectedPlan.price + ' جنيه';
  showScreen('visa');
});

document.getElementById('payInstapay').addEventListener('click', () => {
  document.getElementById('ipNumber').textContent         = PAYMENT_CONFIG.instapayNumber;
  document.getElementById('ipAmount').textContent         = selectedPlan.price + ' جنيه';
  document.getElementById('instapayPlanBadge').textContent = selectedPlan.label;
  showScreen('instapay');
});

document.getElementById('payWallet').addEventListener('click', () => {
  updateWalletNumber('vodafone');
  document.getElementById('walletAmount').textContent    = selectedPlan.price + ' جنيه';
  document.getElementById('walletPlanBadge').textContent = selectedPlan.label;
  showScreen('wallet');
});

// ---- Wallet Type Switcher ----
document.querySelectorAll('.wallet-opt').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.wallet-opt').forEach(w => w.classList.remove('active'));
    el.classList.add('active');
    selectedWalletType = el.dataset.wallet;
    updateWalletNumber(selectedWalletType);
  });
});

function updateWalletNumber(type) {
  const nums = {
    vodafone: PAYMENT_CONFIG.vodafoneNumber,
    orange:   PAYMENT_CONFIG.orangeNumber,
    etisalat: PAYMENT_CONFIG.etisalatNumber,
  };
  document.getElementById('walletNumber').textContent = nums[type] || PAYMENT_CONFIG.vodafoneNumber;
}

// ---- Copy buttons ----
document.getElementById('copyIpNumber').addEventListener('click', () => {
  navigator.clipboard.writeText(PAYMENT_CONFIG.instapayNumber)
    .then(() => showToast('📋 تم نسخ الرقم!'));
});
document.getElementById('copyWalletNumber').addEventListener('click', () => {
  const nums = {
    vodafone: PAYMENT_CONFIG.vodafoneNumber,
    orange:   PAYMENT_CONFIG.orangeNumber,
    etisalat: PAYMENT_CONFIG.etisalatNumber,
  };
  navigator.clipboard.writeText(nums[selectedWalletType])
    .then(() => showToast('📋 تم نسخ الرقم!'));
});

// ---- VISA Card Form ----
const cardNumberEl = document.getElementById('cardNumber');
const cardHolderEl = document.getElementById('cardHolder');
const cardExpiryEl = document.getElementById('cardExpiry');

cardNumberEl.addEventListener('input', () => {
  let v = cardNumberEl.value.replace(/\D/g, '').slice(0, 16);
  cardNumberEl.value = v.replace(/(.{4})/g, '$1 ').trim();
  const preview = v.padEnd(16, '•').match(/.{1,4}/g).join(' ');
  document.getElementById('cardNumPreview').textContent = preview;
});

cardHolderEl.addEventListener('input', () => {
  const v = cardHolderEl.value.toUpperCase().slice(0, 26);
  cardHolderEl.value = v;
  document.getElementById('cardHolderPreview').textContent = v || 'FULL NAME';
});

cardExpiryEl.addEventListener('input', () => {
  let v = cardExpiryEl.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
  cardExpiryEl.value = v;
  document.getElementById('cardExpiryPreview').textContent = v || 'MM/YY';
});

// Submit Visa
document.getElementById('submitVisa').addEventListener('click', () => {
  const num  = cardNumberEl.value.replace(/\s/g, '');
  const name = cardHolderEl.value.trim();
  const exp  = cardExpiryEl.value;
  const cvv  = document.getElementById('cardCvv').value;

  if (num.length < 16) { showToast('⚠️ رقم الكارت غلط');        return; }
  if (!name)           { showToast('⚠️ اكتب الاسم على الكارت'); return; }
  if (exp.length < 5)  { showToast('⚠️ تاريخ الانتهاء غلط');    return; }
  if (cvv.length < 3)  { showToast('⚠️ CVV غلط');               return; }

  const btn = document.getElementById('submitVisa');
  const txt = document.getElementById('visaBtnText');
  btn.disabled = true;
  txt.textContent = '⏳ جاري المعالجة...';

  setTimeout(() => {
    btn.disabled = false;
    txt.textContent = 'ادفع الآن';
    activatePremium('visa');
    showScreen('success');
  }, 2500);
});

// ---- InstaPay Confirm ----
document.getElementById('confirmInstapay').addEventListener('click', () => {
  sendPaymentNotification('InstaPay', PAYMENT_CONFIG.instapayNumber);
});

// ---- Wallet Confirm ----
document.getElementById('confirmWallet').addEventListener('click', () => {
  const walletNames = { vodafone: 'Vodafone Cash', orange: 'Orange Money', etisalat: 'Etisalat Cash' };
  sendPaymentNotification(walletNames[selectedWalletType] || 'محفظة إلكترونية', PAYMENT_CONFIG[selectedWalletType + 'Number']);
});

// ---- Send WhatsApp notification + Show Pending Screen ----
function sendPaymentNotification(method, number) {
  const orderId  = 'ORD-' + Date.now().toString(36).toUpperCase();
  const profile  = getSavedProfile();
  const name     = profile.name || 'عميل';
  const plan     = selectedPlan.plan === 'annual' ? 'سنوي (399 جنيه)' : 'شهري (49 جنيه)';

  // Save pending order
  localStorage.setItem('aura_pending_order', JSON.stringify({
    orderId, name, plan: selectedPlan, method, number,
    submittedAt: new Date().toISOString(),
  }));

  // Build WhatsApp message to owner
  const msg = encodeURIComponent(
    `🔔 طلب اشتراك جديد!\n\n` +
    `👤 الاسم: ${name}\n` +
    `📦 الخطة: ${plan}\n` +
    `💳 طريقة الدفع: ${method}\n` +
    `📱 رقم التحويل: ${number}\n` +
    `🆔 رقم الطلب: ${orderId}\n\n` +
    `يرجى التحقق من التحويل وإرسال كود التفعيل للعميل.`
  );
  window.open(`https://wa.me/${PAYMENT_CONFIG.ownerWhatsapp}?text=${msg}`, '_blank');

  // Show pending screen
  showPendingScreen(orderId);
}

// ---- Pending Confirmation Screen ----
function showPendingScreen(orderId) {
  // Remove old if exists
  const old = document.getElementById('pendingOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pendingOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(5,5,15,0.98);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.4s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(145deg, #0f0f1e, #1a1a2e);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 28px;
      padding: 36px 28px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7);
    ">
      <!-- Waiting Animation -->
      <div style="position:relative; width:100px; height:100px; margin: 0 auto 24px;">
        <div style="
          position:absolute; inset:0; border-radius:50%;
          border: 3px solid rgba(124,58,237,0.2);
        "></div>
        <div style="
          position:absolute; inset:0; border-radius:50%;
          border: 3px solid transparent;
          border-top-color: #a78bfa;
          animation: spin 1s linear infinite;
        "></div>
        <div style="
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          font-size: 38px;
        ">⏳</div>
      </div>

      <h2 style="font-size:24px; font-weight:900; margin-bottom:12px; font-family:Cairo,sans-serif;">
        تم إرسال طلبك!
      </h2>
      <p style="color:rgba(241,241,245,0.6); font-size:15px; line-height:1.7; margin-bottom:20px; font-family:Cairo,sans-serif;">
        تم فتح واتساب لإعلامنا بطلبك ✅<br/>
        <strong style="color:#a78bfa;">يرجى انتظار تأكيد الدفع</strong><br/>
        هنبعتلك كود التفعيل خلال ساعة على واتساب
      </p>

      <!-- Order ID -->
      <div style="
        background: rgba(124,58,237,0.1);
        border: 1px solid rgba(124,58,237,0.25);
        border-radius: 14px;
        padding: 14px;
        margin-bottom: 24px;
      ">
        <div style="font-size:12px; color:rgba(255,255,255,0.4); margin-bottom:6px; letter-spacing:1px; font-family:Inter,sans-serif;">رقم طلبك</div>
        <div style="font-size:20px; font-weight:900; color:#a78bfa; letter-spacing:3px; font-family:Inter,monospace;">${orderId}</div>
      </div>

      <!-- Activation Code Input -->
      <div style="margin-bottom:16px;">
        <p style="font-size:14px; color:rgba(255,255,255,0.5); margin-bottom:10px; font-family:Cairo,sans-serif;">
          عندك كود تفعيل؟ ادخله هنا:
        </p>
        <input
          type="text"
          id="activationCodeInput"
          placeholder="AURA-XXXX"
          style="
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            padding: 14px 16px;
            border-radius: 12px;
            font-size: 18px;
            font-family: Inter, monospace;
            text-align: center;
            letter-spacing: 3px;
            outline: none;
            box-sizing: border-box;
            direction: ltr;
            text-transform: uppercase;
            transition: border 0.3s;
          "
        />
        <button id="activateCodeBtn" style="
          width: 100%;
          margin-top: 10px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          font-family: Cairo, sans-serif;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(124,58,237,0.4);
          transition: all 0.3s;
        ">✅ تفعيل الاشتراك</button>
      </div>

      <button id="pendingWhatsappBtn" style="
        width: 100%;
        background: rgba(37,211,102,0.12);
        border: 1px solid rgba(37,211,102,0.3);
        color: #25d366;
        padding: 13px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        font-family: Cairo, sans-serif;
        cursor: pointer;
        margin-bottom: 10px;
        transition: all 0.3s;
      ">📲 إعادة فتح واتساب</button>

      <button id="pendingCloseBtn" style="
        background: none;
        border: none;
        color: rgba(255,255,255,0.3);
        font-size: 14px;
        font-family: Cairo, sans-serif;
        cursor: pointer;
        padding: 8px;
      ">رجوع للرئيسية</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Activate code button
  document.getElementById('activateCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('activationCodeInput').value.trim().toUpperCase();
    verifyActivationCode(code, overlay);
  });

  // Reopen WhatsApp
  document.getElementById('pendingWhatsappBtn').addEventListener('click', () => {
    const order = JSON.parse(localStorage.getItem('aura_pending_order') || '{}');
    const msg = encodeURIComponent(
      `🔔 طلب اشتراك جديد!\n\n` +
      `👤 الاسم: ${order.name || 'عميل'}\n` +
      `📦 الخطة: ${order.plan?.plan === 'annual' ? 'سنوي (399ج)' : 'شهري (49ج)'}\n` +
      `🆔 رقم الطلب: ${orderId}`
    );
    window.open(`https://wa.me/${PAYMENT_CONFIG.ownerWhatsapp}?text=${msg}`, '_blank');
  });

  // Close
  document.getElementById('pendingCloseBtn').addEventListener('click', () => {
    overlay.remove();
    showScreenWithNav('landing');
    bottomNav.classList.add('visible');
    showToast('📲 هنتواصل معاك لتأكيد الدفع');
  });

  // Focus code input
  setTimeout(() => document.getElementById('activationCodeInput')?.focus(), 300);
}

// ---- Verify Activation Code ----
function verifyActivationCode(code, overlay) {
  if (!code) { showToast('⚠️ ادخل الكود'); return; }

  // Check used codes
  const usedCodes = JSON.parse(localStorage.getItem('aura_used_codes') || '[]');
  if (usedCodes.includes(code)) {
    showToast('❌ الكود ده استُخدم قبل كده');
    return;
  }

  if (VALID_CODES.includes(code)) {
    // Mark code as used
    usedCodes.push(code);
    localStorage.setItem('aura_used_codes', JSON.stringify(usedCodes));

    // Activate premium
    const order = JSON.parse(localStorage.getItem('aura_pending_order') || '{}');
    if (order.plan) selectedPlan = order.plan;
    activatePremium('code-' + code);

    overlay.remove();
    showScreen('success');
    showToast('🎉 مبروك! تم تفعيل AURA Premium!');
  } else {
    // Shake animation
    const input = document.getElementById('activationCodeInput');
    input.style.borderColor = '#ef4444';
    input.style.animation = 'shake 0.4s ease';
    setTimeout(() => {
      input.style.borderColor = '';
      input.style.animation = '';
    }, 500);
    showToast('❌ الكود غلط — تأكد من الكود اللي اتبعتلك');
  }
}

// ---- Success ----
document.getElementById('goHomeFromSuccess').addEventListener('click', () => {
  showScreenWithNav('landing');
  bottomNav.classList.add('visible');
  showToast('👑 أهلاً بيك في AURA Premium!');
});

// ---- Activate Premium ----
async function activatePremium(method) {
  const expiry = new Date();
  if (selectedPlan.plan === 'annual') expiry.setFullYear(expiry.getFullYear() + 1);
  else expiry.setMonth(expiry.getMonth() + 1);

  const premium = {
    active: true,
    plan: selectedPlan.plan,
    price: selectedPlan.price,
    method,
    activatedAt: new Date().toISOString(),
    expiresAt: expiry.toISOString(),
  };

  await auraDb.activatePremium(premium);
  updatePremiumBadge();
}

function isPremium() {
  try {
    const p = JSON.parse(localStorage.getItem('aura_premium'));
    return p?.active && new Date(p.expiresAt) > new Date();
  } catch { return false; }
}

function updatePremiumBadge() {
  if (!isPremium()) return;
  const logoText = document.querySelector('.logo-text');
  if (logoText && !logoText.textContent.includes('👑')) {
    logoText.textContent = 'AURA 👑';
  }
}

// ---- Add Premium CTA Card to Landing ----
(function addPremiumCard() {
  const featRow = document.querySelector('.features-row');
  if (!featRow) return;
  // avoid duplicates
  if (document.getElementById('premiumFeatCard')) return;
  const premBtn = document.createElement('div');
  premBtn.className = 'feat-card';
  premBtn.id = 'premiumFeatCard';
  premBtn.style.cssText = 'cursor:pointer; background:rgba(245,158,11,0.08); border-color:rgba(245,158,11,0.3);';
  premBtn.innerHTML = '<span class="feat-icon">👑</span><span>Premium</span>';
  premBtn.addEventListener('click', openPremium);
  featRow.appendChild(premBtn);
})();

// Init
updatePremiumBadge();
