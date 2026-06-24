// =============================================
//   AURA — Database & Authentication Layer
// =============================================

const SUPABASE_URL_KEY = 'aura_supabase_url';
const SUPABASE_ANON_KEY_KEY = 'aura_supabase_anon_key';
const CURRENT_USER_SESSION = 'aura_current_user';

const auraDb = {
  supabase: null,
  isFallback: true,
  currentUser: null,

  init() {
    const url = localStorage.getItem(SUPABASE_URL_KEY) || '';
    const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY) || '';

    if (url && key && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(url, key);
        this.isFallback = false;
        console.log('⚡ Supabase Database client initialized successfully.');
      } catch (err) {
        console.error('⚠️ Failed to initialize Supabase, using local fallback:', err);
        this.isFallback = true;
      }
    } else {
      this.isFallback = true;
      console.log('📦 Supabase keys not set. Running in Local Fallback Mode.');
    }

    // Load active session from localStorage
    try {
      this.currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION)) || null;
    } catch {
      this.currentUser = null;
    }
  },

  updateKeys(url, key) {
    if (url) localStorage.setItem(SUPABASE_URL_KEY, url);
    else localStorage.removeItem(SUPABASE_URL_KEY);

    if (key) localStorage.setItem(SUPABASE_ANON_KEY_KEY, key);
    else localStorage.removeItem(SUPABASE_ANON_KEY_KEY);

    this.init();
  },

  getKeys() {
    return {
      url: localStorage.getItem(SUPABASE_URL_KEY) || '',
      key: localStorage.getItem(SUPABASE_ANON_KEY_KEY) || ''
    };
  },

  async signUp(email, password, name, age) {
    email = email.trim().toLowerCase();
    password = password.trim();

    if (this.isFallback) {
      // Local Fallback Logic
      const users = JSON.parse(localStorage.getItem('aura_local_users') || '[]');
      if (users.some(u => u.email === email)) {
        throw new Error('البريد الإلكتروني مسجل بالفعل');
      }

      const uid = 'usr_' + Date.now().toString(36);
      users.push({ email, password, uid });
      localStorage.setItem('aura_local_users', JSON.stringify(users));

      // Create initial profile
      const profile = { name, age: parseInt(age) || '', avatar: '😊', goals: [], wakeup: '' };
      const data = { profile, sessions: [], premium: { active: false } };
      localStorage.setItem(`aura_local_data_${uid}`, JSON.stringify(data));

      this.currentUser = { uid, email, name };
      localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(this.currentUser));
      return this.currentUser;
    } else {
      // Supabase Signup Logic
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل إنشاء الحساب');

      const uid = authData.user.id;

      // Insert profile record
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert([{
          id: uid,
          name,
          age: parseInt(age) || null,
          avatar: '😊',
          goals: [],
          wakeup: '',
          is_premium: false
        }]);

      if (profileError) console.error('Error inserting profile:', profileError);

      this.currentUser = { uid, email, name };
      localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  },

  async signIn(email, password) {
    email = email.trim().toLowerCase();
    password = password.trim();

    if (this.isFallback) {
      // Local Fallback Logic
      const users = JSON.parse(localStorage.getItem('aura_local_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }

      const data = JSON.parse(localStorage.getItem(`aura_local_data_${user.uid}`) || '{}');
      const name = data.profile?.name || 'مستخدم';

      this.currentUser = { uid: user.uid, email, name };
      localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(this.currentUser));

      // Sync active profile/sessions/premium to main LocalStorage for immediate UI usage
      this._syncLocalStateToLegacy(user.uid);
      return this.currentUser;
    } else {
      // Supabase Login Logic
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل تسجيل الدخول');

      const uid = authData.user.id;

      // Fetch profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (profileError) console.error('Error fetching profile:', profileError);

      const name = profile?.name || authData.user.user_metadata?.display_name || 'مستخدم';
      this.currentUser = { uid, email, name };
      localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(this.currentUser));

      // Pull all data from Supabase and sync to local state
      await this.pullFromSupabase(uid);
      return this.currentUser;
    }
  },

  signOut() {
    if (!this.isFallback && this.supabase) {
      this.supabase.auth.signOut().catch(console.error);
    }
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_SESSION);
    
    // Clear current user state
    localStorage.removeItem('aura_profile');
    localStorage.removeItem('aura_history');
    localStorage.removeItem('aura_premium');
    localStorage.removeItem('aura_sessions');
    localStorage.removeItem('aura_avg_energy');
    localStorage.removeItem('aura_streak');
  },

  async saveProfile(profile) {
    if (!this.currentUser) return;
    localStorage.setItem('aura_profile', JSON.stringify(profile));

    if (this.isFallback) {
      const data = JSON.parse(localStorage.getItem(`aura_local_data_${this.currentUser.uid}`) || '{}');
      data.profile = profile;
      localStorage.setItem(`aura_local_data_${this.currentUser.uid}`, JSON.stringify(data));
    } else {
      await this.supabase
        .from('profiles')
        .update({
          name: profile.name,
          age: parseInt(profile.age) || null,
          avatar: profile.avatar,
          goals: profile.goals,
          wakeup: profile.wakeup
        })
        .eq('id', this.currentUser.uid);
    }
  },

  async addSession(session) {
    if (!this.currentUser) return;
    
    // Load existing history
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('aura_history') || '[]');
    } catch {}
    
    history.unshift(session);
    localStorage.setItem('aura_history', JSON.stringify(history));

    if (this.isFallback) {
      const data = JSON.parse(localStorage.getItem(`aura_local_data_${this.currentUser.uid}`) || '{}');
      data.sessions = history;
      localStorage.setItem(`aura_local_data_${this.currentUser.uid}`, JSON.stringify(data));
    } else {
      await this.supabase
        .from('sessions')
        .insert([{
          user_id: this.currentUser.uid,
          energy_level: session.energyLevel,
          mood: session.mood,
          mood_emoji: session.moodEmoji,
          stress_level: session.stressLevel,
          stress_emoji: session.stressEmoji,
          key_insight: session.keyInsight
        }]);
    }
  },

  async activatePremium(premium) {
    if (!this.currentUser) return;
    localStorage.setItem('aura_premium', JSON.stringify(premium));

    if (this.isFallback) {
      const data = JSON.parse(localStorage.getItem(`aura_local_data_${this.currentUser.uid}`) || '{}');
      data.premium = premium;
      localStorage.setItem(`aura_local_data_${this.currentUser.uid}`, JSON.stringify(data));
    } else {
      await this.supabase
        .from('profiles')
        .update({
          is_premium: premium.active,
          premium_plan: premium.plan,
          premium_activated_at: premium.activatedAt,
          premium_expires_at: premium.expiresAt,
          premium_method: premium.method
        })
        .eq('id', this.currentUser.uid);
    }
  },

  // Helpers
  _syncLocalStateToLegacy(uid) {
    const data = JSON.parse(localStorage.getItem(`aura_local_data_${uid}`) || '{}');
    if (data.profile) localStorage.setItem('aura_profile', JSON.stringify(data.profile));
    if (data.sessions) {
      localStorage.setItem('aura_history', JSON.stringify(data.sessions));
      // Re-calculate statistics
      localStorage.setItem('aura_sessions', data.sessions.length);
      const avg = data.sessions.length > 0
        ? Math.round(data.sessions.reduce((acc, s) => acc + (s.energyLevel || 0), 0) / data.sessions.length)
        : 0;
      localStorage.setItem('aura_avg_energy', avg);
    }
    if (data.premium) localStorage.setItem('aura_premium', JSON.stringify(data.premium));
  },

  async pullFromSupabase(uid) {
    // 1. Get profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (profile) {
      const prof = {
        name: profile.name,
        age: profile.age,
        avatar: profile.avatar,
        goals: profile.goals || [],
        wakeup: profile.wakeup
      };
      localStorage.setItem('aura_profile', JSON.stringify(prof));

      const prem = {
        active: profile.is_premium,
        plan: profile.premium_plan,
        activatedAt: profile.premium_activated_at,
        expiresAt: profile.premium_expires_at,
        method: profile.premium_method
      };
      localStorage.setItem('aura_premium', JSON.stringify(prem));
    }

    // 2. Get sessions
    const { data: dbSessions } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (dbSessions) {
      const history = dbSessions.map(s => {
        const d = new Date(s.created_at);
        const dateStr = d.toLocaleDateString('ar-EG', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const timeStr = d.toLocaleTimeString('ar-EG', {
          hour: '2-digit', minute: '2-digit'
        });
        return {
          id: s.id,
          dateRaw: d.toDateString(),
          dateDisplay: dateStr,
          timeDisplay: timeStr,
          date: dateStr,
          time: timeStr,
          energyLevel: s.energy_level,
          mood: s.mood,
          moodEmoji: s.mood_emoji,
          stressLevel: s.stress_level,
          stressEmoji: s.stress_emoji,
          keyInsight: s.key_insight,
          generalVibe: '',
          advice: [],
          schedule: []
        };
      });

      localStorage.setItem('aura_history', JSON.stringify(history));
      localStorage.setItem('aura_sessions', history.length);
      const avg = history.length > 0
        ? Math.round(history.reduce((acc, s) => acc + (s.energyLevel || 0), 0) / history.length)
        : 0;
      localStorage.setItem('aura_avg_energy', avg);
    }
  }
};

// Initialize on load
auraDb.init();
