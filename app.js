// =============================================
//   AURA — AI Wellness App
//   OpenRouter AI + Web Speech API
// =============================================

const API_KEY_STORAGE = 'aura_api_key';
const PROFILE_STORAGE = 'aura_profile';
const STREAK_STORAGE = 'aura_streak';
const DEFAULT_API_KEY = '';

// ---- State ----
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let seconds = 0;
let isRecording = false;
let audioBlob = null;
let selectedAvatar = '😊';
let selectedGoals = [];
let selectedWakeup = '';
let prevScreen = 'landing';
let speechRecognition = null;
let transcribedText = '';

// ---- DOM ----
const screens = {
  auth: document.getElementById('authScreen'),
  landing: document.getElementById('landing'),
  recording: document.getElementById('recordingScreen'),
  loading: document.getElementById('loadingScreen'),
  results: document.getElementById('resultsScreen'),
  profile: document.getElementById('profileScreen'),
  profileScreen: document.getElementById('profileScreen'),
  historyScreen: document.getElementById('historyScreen'),
  dashboardScreen: document.getElementById('dashboardScreen'),
};

// ---- Show Screen ----
function showScreen(name) {
  Object.values(screens).forEach(s => {
    if (s) {
      s.classList.remove('active');
      s.style.display = 'none';
    }
  });
  if (screens[name]) {
    screens[name].style.display = 'flex';
    setTimeout(() => screens[name].classList.add('active'), 10);
  }
  if (name !== 'loading') prevScreen = name;

  // Toggle navigation visibility
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    const NAV_HIDDEN = ['auth', 'recordingScreen', 'loadingScreen'];
    if (NAV_HIDDEN.includes(name)) {
      bottomNav.classList.remove('visible');
    } else {
      bottomNav.classList.add('visible');
      // Update active nav item
      document.querySelectorAll('.bnav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === name);
      });
    }
  }
}

// ---- API Key ----
function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY;
}

// ---- SETTINGS MODAL ----
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const supabaseUrlInput = document.getElementById('supabaseUrlInput');
const supabaseKeyInput = document.getElementById('supabaseKeyInput');

document.getElementById('openSettings').addEventListener('click', () => {
  apiKeyInput.value = getApiKey();
  const keys = auraDb.getKeys();
  supabaseUrlInput.value = keys.url;
  supabaseKeyInput.value = keys.key;
  settingsModal.classList.remove('hidden');
});
document.getElementById('closeSettings').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});
document.getElementById('toggleKey').addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});
document.getElementById('saveKey').addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }

  const sUrl = supabaseUrlInput.value.trim();
  const sKey = supabaseKeyInput.value.trim();
  auraDb.updateKeys(sUrl, sKey);

  settingsModal.classList.add('hidden');
  showToast('💾 تم حفظ الإعدادات بنجاح!');
  checkAuth();
});
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

// ---- NAVIGATION ----
document.getElementById('startBtn').addEventListener('click', () => {
  showScreen('recording');
});
document.getElementById('backToLanding').addEventListener('click', () => {
  stopRecording();
  showScreen('landing');
});
document.getElementById('newAnalysisBtn').addEventListener('click', () => {
  resetRecording();
  showScreen('recording');
});
document.getElementById('goProfileBtn').addEventListener('click', () => {
  renderProfileView();
  showScreen('profile');
});
document.getElementById('backFromProfile').addEventListener('click', () => {
  showScreen('landing');
});

// ---- PROFILE MODAL ----
const profileModal = document.getElementById('profileModal');

document.getElementById('openProfile').addEventListener('click', () => {
  openProfileModal();
});
document.getElementById('closeProfile').addEventListener('click', () => {
  profileModal.classList.add('hidden');
});
profileModal.addEventListener('click', e => {
  if (e.target === profileModal) profileModal.classList.add('hidden');
});

function openProfileModal() {
  const saved = getSavedProfile();
  selectedAvatar = saved.avatar || '😊';
  selectedGoals = saved.goals ? [...saved.goals] : [];
  selectedWakeup = saved.wakeup || '';

  document.getElementById('profileName').value = saved.name || '';
  document.getElementById('profileAge').value = saved.age || '';
  document.getElementById('avatarDisplay').textContent = selectedAvatar;

  document.querySelectorAll('.av-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.av === selectedAvatar);
    el.onclick = () => {
      selectedAvatar = el.dataset.av;
      document.getElementById('avatarDisplay').textContent = selectedAvatar;
      document.querySelectorAll('.av-item').forEach(a => a.classList.remove('selected'));
      el.classList.add('selected');
    };
  });

  document.querySelectorAll('.goal-item').forEach(el => {
    el.classList.toggle('selected', selectedGoals.includes(el.dataset.goal));
    el.onclick = () => {
      const g = el.dataset.goal;
      if (selectedGoals.includes(g)) {
        selectedGoals = selectedGoals.filter(x => x !== g);
        el.classList.remove('selected');
      } else {
        selectedGoals.push(g);
        el.classList.add('selected');
      }
    };
  });

  document.querySelectorAll('.time-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.time === selectedWakeup);
    el.onclick = () => {
      selectedWakeup = el.dataset.time;
      document.querySelectorAll('.time-opt').forEach(t => t.classList.remove('selected'));
      el.classList.add('selected');
    };
  });

  profileModal.classList.remove('hidden');
}

document.getElementById('saveProfile').addEventListener('click', async () => {
  const name = document.getElementById('profileName').value.trim();
  const age = document.getElementById('profileAge').value.trim();
  if (!name) { showToast('⚠️ اكتب اسمك الأول!'); return; }
  const profile = { name, age, avatar: selectedAvatar, goals: selectedGoals, wakeup: selectedWakeup };
  await auraDb.saveProfile(profile);
  profileModal.classList.add('hidden');
  updateLandingGreeting(profile);
  showToast('✨ تم حفظ البروفايل!');
});

function getSavedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_STORAGE)) || {}; } catch { return {}; }
}

function updateLandingGreeting(profile) {
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && profile.name) {
    heroTitle.innerHTML = 'أهلاً ' + profile.name + '! 👋<br/><span class="gradient-text">اعرف نفسك كل يوم</span>';
  }
}

// ---- PROFILE VIEW ----
function renderProfileView() {
  const profile = getSavedProfile();
  const streak = getStreak();
  const container = document.getElementById('profileViewContainer');
  const name = profile.name || 'صديقي';
  const avatar = profile.avatar || '😊';
  const age = profile.age ? profile.age + ' سنة' : '';
  const wakeup = profile.wakeup || 'غير محدد';
  const goals = profile.goals || [];
  const totalSessions = parseInt(localStorage.getItem('aura_sessions') || '0');
  const avgEnergy = parseInt(localStorage.getItem('aura_avg_energy') || '0');
  const streakMsg = streak >= 7 ? '💪 أسطورة! استمر!' : streak >= 3 ? '🔥 ماشي تمام — لا توقف!' : '🚀 ابدأ streak جديد!';

  const goalsHTML = goals.length > 0
    ? '<div class="goals-tags-section"><div class="section-title">🎯 أهدافك الشخصية</div><div class="goals-tags">' + goals.map(g => '<span class="goal-tag">' + g + '</span>').join('') + '</div></div>'
    : '';

  container.innerHTML =
    '<div class="profile-hero">' +
      '<div class="profile-avatar-big">' + avatar + '</div>' +
      '<div class="profile-name-big">' + name + '</div>' +
      '<div class="profile-sub">' + (age ? age + ' • ' : '') + 'عضو AURA</div>' +
      '<button class="profile-edit-btn" id="editProfileBtn">✏️ تعديل البروفايل</button>' +
    '</div>' +
    '<div class="streak-card">' +
      '<div class="streak-num">' + streak + '</div>' +
      '<div class="streak-label">🔥 يوم streak متتالي</div>' +
      '<div class="streak-msg">' + streakMsg + '</div>' +
    '</div>' +
    '<div class="profile-stats-grid">' +
      '<div class="pstat-card"><div class="pstat-icon">🎯</div><div class="pstat-num">' + totalSessions + '</div><div class="pstat-label">جلسة تحليل</div></div>' +
      '<div class="pstat-card"><div class="pstat-icon">⚡</div><div class="pstat-num">' + (avgEnergy > 0 ? avgEnergy + '%' : '--') + '</div><div class="pstat-label">متوسط الطاقة</div></div>' +
      '<div class="pstat-card"><div class="pstat-icon">🔥</div><div class="pstat-num">' + streak + '</div><div class="pstat-label">Streak</div></div>' +
    '</div>' +
    '<div class="wakeup-info"><div class="wakeup-icon">⏰</div><div class="wakeup-text"><h4>وقت الصحيان</h4><p>' + wakeup + '</p></div></div>' +
    goalsHTML +
    '<button class="profile-start-btn" id="profileStartAnalysis">🎤 ابدأ تحليل يومي جديد</button>' +
    '<button class="profile-logout-btn" id="profileLogoutBtn">🚪 تسجيل الخروج</button>';

  document.getElementById('editProfileBtn').addEventListener('click', openProfileModal);
  document.getElementById('profileStartAnalysis').addEventListener('click', () => {
    resetRecording();
    showScreen('recording');
  });
  document.getElementById('profileLogoutBtn').addEventListener('click', () => {
    auraDb.signOut();
    showToast('🚪 تم تسجيل الخروج');
    checkAuth();
  });
}

// ---- STREAK LOGIC ----
function getStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE)) || {};
    return data.count || 0;
  } catch { return 0; }
}

function updateStreak() {
  try {
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem(STREAK_STORAGE)) || {};
    if (data.lastDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const count = data.lastDate === yesterday ? (data.count || 0) + 1 : 1;
    localStorage.setItem(STREAK_STORAGE, JSON.stringify({ count, lastDate: today }));
  } catch {}
}

function updateSessionStats(energyLevel) {
  const sessions = parseInt(localStorage.getItem('aura_sessions') || '0') + 1;
  localStorage.setItem('aura_sessions', sessions);
  const prevAvg = parseInt(localStorage.getItem('aura_avg_energy') || '0');
  const newAvg = Math.round((prevAvg * (sessions - 1) + energyLevel) / sessions);
  localStorage.setItem('aura_avg_energy', newAvg);
  updateStreak();
}

// ---- RECORDING ----
const micBtn = document.getElementById('micBtn');
const recordBtn = document.getElementById('recordBtn');
const recordBtnIcon = document.getElementById('recordBtnIcon');
const recordBtnText = document.getElementById('recordBtnText');
const analyzeBtn = document.getElementById('analyzeBtn');
const timerDisplay = document.getElementById('timerDisplay');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-dot');
const visualizerWrapper = document.querySelector('.visualizer-wrapper');
const waveform = document.getElementById('waveform');

micBtn.addEventListener('click', toggleRecording);
recordBtn.addEventListener('click', toggleRecording);
analyzeBtn.addEventListener('click', analyzeAudio);

async function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    transcribedText = '';

    // Start Web Speech API for live transcription
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('❌ متصفحك لا يدعم تحويل الصوت لنص. استخدم الكتابة بدلاً من ذلك.');
      const fallback = document.getElementById('textFallback');
      if (fallback) {
        fallback.style.display = 'block';
        document.getElementById('textInput')?.focus();
      }
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = 'ar-EG';
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;

    const liveTranscript = document.getElementById('liveTranscript');
    if (liveTranscript) {
      liveTranscript.style.display = 'block';
      liveTranscript.textContent = '🎧 بسمعك... تكلم الآن';
    }

    speechRecognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      transcribedText = (finalText + interimText).trim();
      if (liveTranscript) {
        liveTranscript.textContent = transcribedText || '🎧 بسمعك... تكلم الآن';
        liveTranscript.scrollTop = liveTranscript.scrollHeight;
      }
    };

    speechRecognition.onerror = (e) => {
      console.log('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        showToast('❌ إذن المايكروفون مرفوض. يرجى تفعيل إذن المايكروفون في متصفحك.');
      } else if (e.error === 'no-speech') {
        console.log('No speech detected.');
      } else {
        showToast(`⚠️ عذرًا، حدث خطأ في التقاط الصوت: ${e.error}`);
      }
    };

    speechRecognition.onend = () => {
      if (isRecording && speechRecognition) {
        try { speechRecognition.start(); } catch {}
      }
    };

    speechRecognition.start();
    isRecording = true;

    // UI updates
    micBtn.classList.add('active');
    visualizerWrapper.classList.add('recording');
    waveform.classList.add('recording');
    statusDot.className = 'status-dot recording';
    statusText.textContent = 'جاري الاستماع...';
    recordBtnIcon.textContent = '⏹';
    recordBtnText.textContent = 'إيقاف التسجيل';
    recordBtn.classList.add('stopping');
    analyzeBtn.classList.add('hidden');

    // Start timer — auto stop at 60 seconds
    seconds = 0;
    updateTimer();
    recordingTimer = setInterval(() => {
      updateTimer();
      if (seconds >= 60) {
        stopRecording(true); // auto-stop
      }
    }, 1000);

  } catch (err) {
    console.error('Mic error:', err);
    showToast('❌ مش قادر أوصل للمايكروفون — تأكد من الإذن');
  }
}

function stopRecording(isAutoStop = false) {
  if (!isRecording) return;

  isRecording = false;
  clearInterval(recordingTimer);

  // Stop speech recognition
  if (speechRecognition) {
    try { speechRecognition.stop(); } catch {}
    speechRecognition = null;
  }

  // Hide live transcript
  const liveTranscript = document.getElementById('liveTranscript');
  if (liveTranscript) liveTranscript.style.display = 'none';

  // UI updates
  micBtn.classList.remove('active');
  visualizerWrapper.classList.remove('recording');
  waveform.classList.remove('recording');
  recordBtn.classList.remove('stopping');

  statusDot.className = 'status-dot done';
  statusText.textContent = '✅ تم التسجيل!';
  recordBtnIcon.textContent = '🔄';
  recordBtnText.textContent = 'سجل مرة تانية';

  // If speech recognition gathered text, show the analyze button, otherwise show the text input fallback
  if (transcribedText.trim()) {
    analyzeBtn.classList.remove('hidden');
    if (isAutoStop) {
      showToast('✅ ممتاز! دقيقة كاملة — جاهز تحليل');
    } else if (seconds >= 5) {
      showToast('✅ تم التسجيل — اضغط "حلل كلامي" عشان نبدأ');
    } else {
      showToast('💡 تسجيل قصير — كل ما تحكي أكتر، التحليل يبقى أدق');
    }
  } else {
    analyzeBtn.classList.add('hidden');
    showToast('⚠️ مقدرتش أفهم كلامك — اكتب اللي حاسس بيه هنا عشان نحلله');
    const fallback = document.getElementById('textFallback');
    if (fallback) {
      fallback.style.display = 'block';
      document.getElementById('textInput')?.focus();
    }
  }
}


function resetRecording() {
  isRecording = false;
  seconds = 0;
  transcribedText = '';
  clearInterval(recordingTimer);

  // Hide live transcript
  const liveTranscript = document.getElementById('liveTranscript');
  if (liveTranscript) { liveTranscript.style.display = 'none'; liveTranscript.textContent = ''; }


  micBtn.classList.remove('active');
  visualizerWrapper.classList.remove('recording');
  waveform.classList.remove('recording');
  statusDot.className = 'status-dot idle';
  statusText.textContent = 'اضغط للتسجيل';
  recordBtnIcon.textContent = '⏺';
  recordBtnText.textContent = 'ابدأ التسجيل';
  recordBtn.classList.remove('stopping');
  analyzeBtn.classList.add('hidden');
  timerDisplay.textContent = '00:00';
}

function updateTimer() {
  seconds++;
  timerDisplay.textContent = formatTime(seconds);
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ---- DAILY LIMIT CHECK ----
function getDailyAnalysisCount() {
  try {
    const data = JSON.parse(localStorage.getItem('aura_daily_analysis') || '{}');
    const today = new Date().toDateString();
    if (data.date === today) return data.count || 0;
    return 0;
  } catch { return 0; }
}

function getLastAnalysisTime() {
  try {
    const data = JSON.parse(localStorage.getItem('aura_daily_analysis') || '{}');
    return data.lastTime || 0;
  } catch { return 0; }
}

function incrementDailyAnalysis() {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem('aura_daily_analysis') || '{}');
  if (data.date === today) {
    data.count = (data.count || 0) + 1;
  } else {
    data.date = today;
    data.count = 1;
  }
  data.lastTime = Date.now();
  localStorage.setItem('aura_daily_analysis', JSON.stringify(data));
}

function canAnalyzeToday() {
  if (isPremium()) {
    // Premium users: unlimited
    return true;
  }
  // Free users: 3 per day
  return getDailyAnalysisCount() < 3;
}

function getRemainingTime() {
  // Not needed anymore, but keep for compatibility
  return '';
}

// ---- ANALYZE (Web Speech → Text → Gemini AI) ----
function analyzeFromText(text) {
  transcribedText = text;
  analyzeAudio();
}

// Wire text fallback button
document.getElementById('analyzeTextBtn')?.addEventListener('click', () => {
  const textInput = document.getElementById('textInput');
  const text = textInput?.value?.trim();
  if (!text) {
    showToast('⚠️ اكتب كلامك الأول');
    return;
  }
  analyzeFromText(text);
});

async function analyzeAudio() {
  // Check if we have transcribed text
  const textToAnalyze = transcribedText.trim();
  
  if (!textToAnalyze) {
    // Show text fallback input instead of just error
    showToast('⚠️ مقدرتش أفهم الكلام — اكتب اللي حاسس بيه بدل كده');
    const fallback = document.getElementById('textFallback');
    if (fallback) {
      fallback.style.display = 'block';
      document.getElementById('textInput')?.focus();
    }
    return;
  }

  // Hide text fallback if visible
  const fallback = document.getElementById('textFallback');
  if (fallback) fallback.style.display = 'none';


  // Check daily limit
  if (!canAnalyzeToday()) {
    showToast('⚠️ استخدمت تحليلاتك المجانية النهارده (3 مرات) — اشترك في Premium لتحليلات بلا حدود! 👑');
    openPremium();
    return;
  }

  showScreen('loading');
  startLoadingAnimation();

  const apiKey = getApiKey();

  const prompt = `أنت AURA، مساعد ذكاء اصطناعي متخصص في تحليل المشاعر والحالة النفسية. أنت بتشتغل زي دكتور نفسي ذكي ومتفهم.

المستخدم قال الكلام التالي (تم تحويله من تسجيل صوتي):
"${textToAnalyze}"

حلل كلامه بعمق واستخرج مشاعره، حالته النفسية، مستوى طاقته، ومستوى التوتر من خلال الكلمات والمحتوى.

أرجع الرد بصيغة JSON فقط (بدون أي نص إضافي وبدون markdown وبدون code blocks) بهذا الشكل بالضبط:

{
  "energyLevel": 75,
  "mood": "نشيط ومتفائل",
  "moodEmoji": "😊",
  "stressLevel": "منخفض",
  "stressEmoji": "😌",
  "focusTime": "صباحاً",
  "focusEmoji": "🧠",
  "keyInsight": "جملة واحدة مختصرة عن أهم ما لاحظته في كلام الشخص",
  "schedule": [
    { "time": "8:00 ص", "emoji": "🌅", "task": "مهمة صباحية مناسبة لحالته" },
    { "time": "10:00 ص", "emoji": "💼", "task": "وقت التركيز الأمثل" },
    { "time": "1:00 م", "emoji": "🍽️", "task": "استراحة وغداء" },
    { "time": "3:00 م", "emoji": "⚡", "task": "مهمة متوسطة" },
    { "time": "6:00 م", "emoji": "🏃", "task": "نشاط بدني" },
    { "time": "9:00 م", "emoji": "🌙", "task": "روتين مسائي" }
  ],
  "advice": [
    "نصيحة عملية مخصصة بناءً على كلامه",
    "نصيحة ثانية عملية ومفيدة",
    "نصيحة ثالثة عملية ومفيدة"
  ],
  "generalVibe": "جملة تشجيعية دافئة ومخصصة للشخص بناءً على كلامه"
}

ملاحظات مهمة:
- energyLevel: رقم من 0 إلى 100 بناءً على محتوى الكلام ونوع المشاعر المعبر عنها
- إذا كان الشخص يعبر عن تعب أو إرهاق أو حزن، خفف المهام وقدم نصائح داعمة ومتعاطفة
- إذا كان نشيطاً ومتحمساً، زد من المهام الإنتاجية
- كن متعاطفاً ومشجعاً كأنك دكتور نفسي بيساعد الشخص
- الرد يكون باللغة العربية (المصرية) فقط`;

  try {
    let url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json'
    };
    const requestBody = {
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: 'أنت AURA، مساعد ذكاء اصطناعي متخصص في تحليل المشاعر والحالة النفسية. ترد دائماً بصيغة JSON فقط بدون أي نص إضافي وبدون code blocks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    };

    if (apiKey) {
      headers['Authorization'] = 'Bearer ' + apiKey;
      headers['HTTP-Referer'] = window.location.href;
      headers['X-Title'] = 'AURA Wellness App';
    } else {
      // Completely free, keyless fallback using Pollinations AI (openai-fast 20B reasoning model)
      url = 'https://text.pollinations.ai/v1/chat/completions';
      requestBody.model = 'openai-fast';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('API Error:', errData);
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const result = JSON.parse(jsonMatch[0]);

    await finishLoading();
    showResults(result);

  } catch (err) {
    console.error('Analysis error:', err);
    await finishLoading();
    showScreen('recording');

    if (apiKey && (err.message.includes('API') || err.message.includes('401') || err.message.includes('403') || err.message.includes('key'))) {
      showToast('❌ مشكلة في الـ API Key — افتح الإعدادات وحط مفتاح OpenRouter أو سيبه فاضي للمجاني');
    } else if (err.message.includes('429') || err.message.includes('rate') || err.message.includes('limit') || err.message.includes('limit exceeded')) {
      showToast('⚠️ تم تجاوز الحد — جرب تاني بعد دقيقة أو سيب الـ API Key فاضي للاستخدام المجاني');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showToast('❌ مشكلة في الاتصال بالإنترنت — جرب تاني');
    } else {
      showToast(`❌ خطأ: ${err.message}`);
    }
  }
}


// ---- LOADING ANIMATION ----
let loadingProgress = 0;
let loadingInterval = null;

function startLoadingAnimation() {
  loadingProgress = 0;
  const bar = document.getElementById('loadingBar');
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
  ];
  steps.forEach(s => { s.className = 'load-step'; });
  steps[0].classList.add('active');
  bar.style.width = '0%';

  let phase = 0;
  loadingInterval = setInterval(() => {
    loadingProgress += 2;
    bar.style.width = Math.min(loadingProgress, 95) + '%';

    if (loadingProgress === 33) {
      steps[0].className = 'load-step done';
      steps[1].classList.add('active');
      phase = 1;
    }
    if (loadingProgress === 66) {
      steps[1].className = 'load-step done';
      steps[2].classList.add('active');
      phase = 2;
    }
  }, 80);
}

async function finishLoading() {
  clearInterval(loadingInterval);
  const bar = document.getElementById('loadingBar');
  bar.style.width = '100%';
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
  ];
  steps.forEach(s => s.className = 'load-step done');
  await sleep(600);
}

// ---- SHOW RESULTS ----
function showResults(data) {
  const container = document.getElementById('resultsContainer');
  const dateBadge = document.getElementById('dateBadge');

  // Date
  const now = new Date();
  dateBadge.textContent = now.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Build HTML
  container.innerHTML = `
    <!-- Energy Card -->
    <div class="energy-card">
      <div class="energy-label">مستوى الطاقة اليوم</div>
      <div>
        <span class="energy-value" id="energyNum">0</span>
        <span class="energy-unit">%</span>
      </div>
      <div class="energy-bar-wrap">
        <div class="energy-bar" id="energyBar"></div>
      </div>
      <div class="energy-mood">${data.moodEmoji} ${data.mood}</div>
    </div>

    <!-- Key Insight -->
    <div class="advice-card" style="margin-bottom:16px; background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.2);">
      <div class="advice-title" style="color: var(--purple-light);">✨ ملاحظة AURA</div>
      <p style="font-size:16px; line-height:1.7; color: var(--text);">"${data.keyInsight}"</p>
      <p style="margin-top:12px; font-size:15px; color: var(--text-muted);">${data.generalVibe}</p>
    </div>

    <!-- Insights Grid -->
    <div class="insights-grid">
      <div class="insight-card">
        <div class="insight-icon">${data.moodEmoji}</div>
        <div class="insight-label">المزاج</div>
        <div class="insight-value">${data.mood}</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">${data.stressEmoji}</div>
        <div class="insight-label">التوتر</div>
        <div class="insight-value">${data.stressLevel}</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">${data.focusEmoji}</div>
        <div class="insight-label">أفضل تركيز</div>
        <div class="insight-value">${data.focusTime}</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">⚡</div>
        <div class="insight-label">الطاقة</div>
        <div class="insight-value">${data.energyLevel}%</div>
      </div>
    </div>

    <!-- Daily Schedule -->
    <div class="schedule-card">
      <div class="schedule-title">📅 خطة يومك المخصصة</div>
      <div class="schedule-items">
        ${data.schedule.map(item => `
          <div class="schedule-item">
            <span class="schedule-emoji">${item.emoji}</span>
            <span class="schedule-time">${item.time}</span>
            <span class="schedule-task">${item.task}</span>
          </div>
        `).join('')}
      </div>
    </div>


    <!-- Advice -->
    <div class="advice-card">
      <div class="advice-title">💡 نصائح مخصصة ليك</div>
      <ul class="advice-list">
        ${data.advice.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  `;

  showScreen('results');
  updateSessionStats(data.energyLevel);
  saveSessionToHistory(data);
  incrementDailyAnalysis(); // Count this successful analysis

  // Update bottom nav active
  const bNav = document.getElementById('bottomNav');
  if (bNav) {
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    bNav.classList.add('visible');
  }

  // Animate energy counter
  setTimeout(() => {
    animateCounter('energyNum', 0, data.energyLevel, 1200);
    document.getElementById('energyBar').style.width = data.energyLevel + '%';
  }, 300);
}

// ---- SHARE ----
document.getElementById('shareBtn').addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({
      title: 'AURA — خطة يومي',
      text: 'شيلت تحليل يومي من AURA بالذكاء الاصطناعي! جرب انت كمان 🧠✨',
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('📋 تم نسخ الرابط!');
    });
  }
});

// ---- UTILS ----
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animateCounter(id, from, to, duration) {
  const el = document.getElementById(id);
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: rgba(20,20,35,0.95); color: #fff;
    padding: 14px 28px; border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.1);
    font-family: Cairo, sans-serif; font-size: 15px; font-weight: 600;
    z-index: 9999; backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: fadeUp 0.3s ease;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---- AUTHENTICATION AND LOGIN / SIGNUP ----
function checkAuth() {
  const user = auraDb.currentUser;
  const badge = document.getElementById('fallbackBadge');
  const bottomNav = document.getElementById('bottomNav');
  
  if (badge) {
    if (auraDb.isFallback) {
      badge.textContent = '🔄 وضع التشغيل: محلي (Offline)';
      badge.className = 'fallback-badge';
    } else {
      badge.textContent = '🟢 وضع التشغيل: سحابي متصل (Supabase)';
      badge.className = 'fallback-badge connected';
    }
  }

  if (user) {
    showScreen('landing');
    if (bottomNav) bottomNav.classList.add('visible');
    const profile = getSavedProfile();
    updateLandingGreeting(profile);
  } else {
    showScreen('auth');
    if (bottomNav) bottomNav.classList.remove('visible');
  }
}

// Switch tabs
document.getElementById('tabLoginBtn').addEventListener('click', () => {
  document.getElementById('tabLoginBtn').classList.add('active');
  document.getElementById('tabSignupBtn').classList.remove('active');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('signupForm').classList.add('hidden');
});

document.getElementById('tabSignupBtn').addEventListener('click', () => {
  document.getElementById('tabSignupBtn').classList.add('active');
  document.getElementById('tabLoginBtn').classList.remove('active');
  document.getElementById('signupForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
});

// Login submit
document.getElementById('submitLoginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  if (!email || !pass) { showToast('⚠️ يرجى ملء الحقول المطلوبة'); return; }

  const btn = document.getElementById('submitLoginBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'جاري الدخول...';

  try {
    await auraDb.signIn(email, pass);
    showToast('🔓 تم تسجيل الدخول بنجاح!');
    checkAuth();
  } catch (err) {
    showToast('❌ خطأ: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'دخول';
  }
});

// Signup submit
document.getElementById('submitSignupBtn').addEventListener('click', async () => {
  const name = document.getElementById('signupName').value.trim();
  const age = document.getElementById('signupAge').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPassword').value.trim();

  if (!name || !email || !pass) { showToast('⚠️ يرجى ملء الحقول المطلوبة'); return; }

  const btn = document.getElementById('submitSignupBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'جاري إنشاء الحساب...';

  try {
    await auraDb.signUp(email, pass, name, age);
    showToast('✨ تم إنشاء الحساب بنجاح!');
    checkAuth();
    // Open profile modal to complete detail setup
    setTimeout(() => openProfileModal(), 500);
  } catch (err) {
    showToast('❌ خطأ: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'إنشاء الحساب';
  }
});

// ---- INIT ----
// Clean up legacy invalid key if present to force migration to the new DEFAULT_API_KEY
const oldLegacyKey = 'AQ.Ab8RN6I1w6IrG_f8fLVANguv8HRg7g0dy3fvkAkWynnXITxwEg';
if (localStorage.getItem(API_KEY_STORAGE) === oldLegacyKey) {
  localStorage.removeItem(API_KEY_STORAGE);
}

checkAuth();

// =============================================
//   HISTORY & DASHBOARD
// =============================================

const HISTORY_STORAGE = 'aura_history';

// ---- Save Session to History ----
function saveSessionToHistory(data) {
  const history = getHistory();
  const now = new Date();
  const session = {
    id: Date.now(),
    dateRaw: now.toDateString(),
    dateDisplay: now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    timeDisplay: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    energyLevel: data.energyLevel,
    mood: data.mood,
    moodEmoji: data.moodEmoji,
    stressLevel: data.stressLevel,
    stressEmoji: data.stressEmoji,
    keyInsight: data.keyInsight,
    generalVibe: data.generalVibe,
    schedule: data.schedule,
    advice: data.advice,
  };
  history.unshift(session); // newest first
  // Keep max 60 sessions
  if (history.length > 60) history.pop();
  localStorage.setItem(HISTORY_STORAGE, JSON.stringify(history));

  // Sync to Database
  auraDb.addSession(session).catch(console.error);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_STORAGE)) || []; }
  catch { return []; }
}

// ---- BOTTOM NAV ----
const bottomNav = document.getElementById('bottomNav');

// Screens that show bottom nav
const NAV_SCREENS = ['landing', 'historyScreen', 'dashboardScreen', 'profileScreen', 'results'];
const NAV_HIDDEN  = ['recordingScreen', 'loadingScreen'];

// Override showScreen to handle nav visibility
const _showScreen = showScreen;
function showScreenWithNav(name) {
  _showScreen(name);
  if (NAV_HIDDEN.includes(name)) {
    bottomNav.classList.remove('visible');
  } else {
    bottomNav.classList.add('visible');
    // Update active nav item
    document.querySelectorAll('.bnav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === name);
    });
  }
}
// Replace calls — wire bottom nav buttons
document.querySelectorAll('.bnav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!auraDb.currentUser) {
      showToast('⚠️ يرجى تسجيل الدخول أو إنشاء حساب أولاً!');
      showScreen('auth');
      return;
    }
    const target = btn.dataset.screen;
    if (target === 'historyScreen') {
      renderHistory();
      showScreenWithNav('historyScreen');
    } else if (target === 'dashboardScreen') {
      renderDashboard();
      showScreenWithNav('dashboardScreen');
    } else if (target === 'profileScreen') {
      renderProfileView();
      showScreenWithNav('profileScreen');
    } else if (target === 'recordingScreen') {
      resetRecording();
      showScreenWithNav('recordingScreen');
    } else {
      showScreenWithNav('landing');
    }
  });
});

// ---- RENDER HISTORY ----
function renderHistory() {
  const history = getHistory();
  const container = document.getElementById('historyContainer');
  const countEl = document.getElementById('historyCount');
  countEl.textContent = history.length + ' جلسة';

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">📭</div>
        <h3>مفيش سجل بعد!</h3>
        <p>ابدأ أول تحليل صوتي وهيظهر هنا</p>
      </div>`;
    return;
  }

  const html = history.map((s, i) => {
    const eClass = s.energyLevel >= 70 ? 'energy-high' : s.energyLevel >= 40 ? 'energy-mid' : 'energy-low';
    return `
      <div class="history-card ${eClass}" style="animation: fadeUp 0.4s ease ${i * 0.06}s both;">
        <div class="hcard-top">
          <span class="hcard-date">${s.dateDisplay} • ${s.timeDisplay}</span>
          <span class="hcard-energy-badge">⚡ ${s.energyLevel}%</span>
        </div>
        <div class="hcard-mood">
          <span class="hcard-mood-emoji">${s.moodEmoji}</span>
          <div>
            <div class="hcard-mood-text">${s.mood}</div>
            <div class="hcard-stress">${s.stressEmoji} توتر: ${s.stressLevel}</div>
          </div>
        </div>
        <div class="hcard-energy-bar-wrap">
          <div class="hcard-energy-bar" style="width: ${s.energyLevel}%"></div>
        </div>
        <div class="hcard-insight">"${s.keyInsight}"</div>
      </div>`;
  }).join('');

  container.innerHTML = '<div class="history-list">' + html + '</div>';
}

// ---- RENDER DASHBOARD ----
function renderDashboard() {
  const history = getHistory();
  const container = document.getElementById('dashboardContainer');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="dash-empty">
        <div class="dash-empty-icon">📊</div>
        <h3>مفيش بيانات بعد!</h3>
        <p>سجّل أول تحليل صوتي وهيظهر الداشبورد هنا</p>
      </div>`;
    return;
  }

  // Calculate stats
  const totalSessions = history.length;
  const avgEnergy = Math.round(history.reduce((s, h) => s + h.energyLevel, 0) / totalSessions);
  const streak = getStreak();
  const bestSession = history.reduce((best, s) => s.energyLevel > best.energyLevel ? s : best, history[0]);

  // Last 7 unique days for chart
  const last7 = getLast7DaysData(history);

  // Mood frequency
  const moodMap = {};
  history.forEach(s => {
    const key = s.moodEmoji + ' ' + s.mood;
    moodMap[key] = (moodMap[key] || 0) + 1;
  });
  const moodSorted = Object.entries(moodMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxMood = moodSorted[0]?.[1] || 1;

  // AI tip based on average
  const tip = avgEnergy >= 70
    ? { icon: '🌟', title: 'طاقتك ممتازة!', text: 'استمر في روتينك الحالي — الـ pattern بتاعك صحي ومنتج. حاول تحافظ على وقت نومك ثابت.' }
    : avgEnergy >= 50
    ? { icon: '💡', title: 'طاقتك متوسطة', text: 'جرب تزود وقت النوم 30 دقيقة وتاخد استراحة كل 90 دقيقة عمل — هتلاحق فرق كبير في مستوى طاقتك.' }
    : { icon: '❤️', title: 'طاقتك محتاج رعاية', text: 'ركز على النوم والأكل الصحي أولاً. الجسم بيديلك إشارة — متتجاهلهاش وراح فترة راحة كافية.' };

  container.innerHTML = `
    <!-- Stats Row -->
    <div class="dash-stats-row">
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🎯</div>
        <div class="dash-stat-num">${totalSessions}</div>
        <div class="dash-stat-label">جلسة كاملة</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">⚡</div>
        <div class="dash-stat-num">${avgEnergy}%</div>
        <div class="dash-stat-label">متوسط الطاقة</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🔥</div>
        <div class="dash-stat-num">${streak}</div>
        <div class="dash-stat-label">Streak يوم</div>
      </div>
    </div>

    <!-- Energy Chart -->
    <div class="chart-card">
      <div class="chart-title">⚡ منحنى الطاقة — آخر 7 أيام</div>
      <div class="chart-canvas-wrap">
        <canvas id="energyCanvas" class="energy-chart"></canvas>
      </div>
      <div class="chart-labels" id="chartLabels"></div>
    </div>

    <!-- Best Day -->
    <div class="best-day-card">
      <div class="best-day-title">🏆 أفضل يوم عندك</div>
      <div class="best-day-info">${bestSession.moodEmoji} ${bestSession.mood} — ${bestSession.energyLevel}% طاقة</div>
      <div class="best-day-sub">📅 ${bestSession.dateDisplay}</div>
    </div>

    <!-- Mood Distribution -->
    <div class="chart-card">
      <div class="chart-title">😊 توزيع المزاج</div>
      <div class="mood-dist-list">
        ${moodSorted.map(([label, count]) => `
          <div class="mood-dist-item">
            <span class="mood-dist-emoji">${label.split(' ')[0]}</span>
            <span class="mood-dist-label">${label.split(' ').slice(1).join(' ')}</span>
            <div class="mood-dist-bar-wrap">
              <div class="mood-dist-bar" style="width: ${Math.round(count/maxMood*100)}%"></div>
            </div>
            <span class="mood-dist-count">${count}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- AI Tip -->
    <div class="dash-tip-card">
      <div class="dash-tip-icon">${tip.icon}</div>
      <div class="dash-tip-text">
        <h4>${tip.title}</h4>
        <p>${tip.text}</p>
      </div>
    </div>
  `;

  // Draw canvas chart
  setTimeout(() => drawEnergyChart(last7), 100);
}

// ---- GET LAST 7 DAYS DATA ----
function getLast7DaysData(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const sessions = history.filter(s => s.dateRaw === dateStr);
    const avg = sessions.length
      ? Math.round(sessions.reduce((s, h) => s + h.energyLevel, 0) / sessions.length)
      : null;
    const label = i === 0 ? 'اليوم' : d.toLocaleDateString('ar-EG', { weekday: 'short' });
    days.push({ label, avg, hasData: sessions.length > 0 });
  }
  return days;
}

// ---- DRAW ENERGY CHART (Canvas) ----
function drawEnergyChart(days) {
  const canvas = document.getElementById('energyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 180;
  const pad = { top: 20, right: 20, bottom: 10, left: 28 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [25, 50, 75, 100].forEach(v => {
    const y = pad.top + chartH - (v / 100) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(v + '%', pad.left - 4, y + 3);
  });

  // Filter points with data
  const pts = days.map((d, i) => ({
    x: pad.left + (i / (days.length - 1)) * chartW,
    y: d.hasData ? pad.top + chartH - (d.avg / 100) * chartH : null,
    label: d.label,
    avg: d.avg,
    hasData: d.hasData,
  }));

  // Gradient fill
  const filled = pts.filter(p => p.y !== null);
  if (filled.length >= 2) {
    const grad = ctx.createLinearGradient(0, pad.top, 0, H);
    grad.addColorStop(0, 'rgba(124,58,237,0.35)');
    grad.addColorStop(1, 'rgba(124,58,237,0.0)');

    ctx.beginPath();
    ctx.moveTo(filled[0].x, H);
    filled.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(filled[filled.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(filled[0].x, filled[0].y);
    for (let i = 1; i < filled.length; i++) {
      const prev = filled[i - 1];
      const curr = filled[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, curr.y, curr.x, curr.y);
    }
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, '#7c3aed');
    lineGrad.addColorStop(1, '#ec4899');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // Dots
  pts.forEach(p => {
    if (!p.hasData) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#a78bfa';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Value label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(p.avg + '%', p.x, p.y - 10);
  });

  // X labels
  const labelsEl = document.getElementById('chartLabels');
  if (labelsEl) {
    labelsEl.innerHTML = days.map(d =>
      `<span class="chart-label" style="${d.label === 'اليوم' ? 'color:#a78bfa;font-weight:700;' : ''}">${d.label}</span>`
    ).join('');
  }
}


// Wire results screen buttons to showScreenWithNav
document.getElementById('newAnalysisBtn').addEventListener('click', () => {
  resetRecording();
  showScreenWithNav('recordingScreen');
}, true); // capture=true to override existing listener? No — actually remove duplicate

// Wire back buttons
document.getElementById('backToLanding').addEventListener('click', () => {
  stopRecording();
  showScreenWithNav('landing');
});
document.getElementById('backFromProfile').addEventListener('click', () => {
  showScreenWithNav('landing');
});


// One-time migration: clear stored key to default to the free engine
if (!localStorage.getItem('aura_key_cleared_v1')) {
  localStorage.removeItem(API_KEY_STORAGE);
  localStorage.setItem('aura_key_cleared_v1', 'true');
}
