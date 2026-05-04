import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Nav
    nav_brand: "KOMUNITRADE",
    nav_login: "Log In",
    nav_signup: "Get Started",
    nav_search_ph: "Search in Davao...",
    
    // Landing Hero
    hero_davao: "📍 For Davaoeños",
    hero_barangay: "Davao's <span class='text-gradient'>neighborhood</span> marketplace.",
    hero_buy_sell: "Buy and sell safely in your neighborhood. From fresh produce to tech gadgets — everything's here, AI-powered and community-verified.",
    hero_mag_lista: "List an Item",
    hero_mag_browse: "Browse",
    stats_barangays: "Barangays",
    stats_ai: "AI Listing",
    stats_chat: "Secure Chat",
    stats_title: "Barangay-level trading, reinvented.",
    stats_subtitle: "Built for Davao Communities",

    // Categories
    cat_title: "What can you <span class='text-gradient'>trade?</span>",
    cat_subtitle: "From fresh produce to tech gadgets — if you're in Davao, you have a buyer here.",
    cat_fresh: "Fresh Produce",
    cat_fresh_desc: "Durian, mangoes, local fruits",
    cat_ukay: "Ukay-Ukay",
    cat_ukay_desc: "Quality secondhand clothes",
    cat_gadgets: "Gadgets",
    cat_gadgets_desc: "Phones, laptops, accessories",
    cat_services: "Services",
    cat_services_desc: "Repair, delivery, freelance",
    cat_home: "Home & Living",
    cat_home_desc: "Furniture, appliances",
    cat_school: "School Supplies",
    cat_school_desc: "Books, bags, uniforms",

    // Trust Section
    trust_badge: "Safe & Secure",
    trust_title: "Safe trading in your neighborhood.",
    trust_desc: "You don't need to give your real name or address. With the anonymous ID system, you are protected in every transaction.",
    trust_feat1_title: "End-to-End Encrypted Chat",
    trust_feat1_desc: "Only you and the buyer can read messages.",
    trust_feat2_title: "Auto-Expiring Listings",
    trust_feat2_desc: "Expired listings are automatically deleted for your privacy.",
    trust_feat3_title: "Geohash Verification",
    trust_feat3_desc: "Buyers are verified to be in the same neighborhood as you.",

    // FAQ
    faq_title: "Questions <span class='text-gradient'>About KomuniTrade</span>",
    faq_subtitle: "Everything you need to know before you trade.",
    faq_q1: "Is it safe to trade here?",
    faq_a1: "Yes! Every user is verified via Geohash and community trust scores. We never expose your real name or address.",
    faq_q2: "How fast can I list an item?",
    faq_a2: "With our Gemini AI engine, you can generate a professional listing in under 10 seconds.",
    faq_q3: "Is KomuniTrade free?",
    faq_a3: "Yes, KomuniTrade is free for all residents. Sign up now!",
    faq_q4: "What can I sell?",
    faq_a4: "Anything legal — from ukay-ukay, gadgets, local food, and more.",

    // Footer CTA
    cta_footer_location: "📍 Davao City, Philippines",
    cta_footer_title: "Start <span style='color: var(--primary)'>trading</span> now.",
    cta_footer_desc: "Join your neighbors trading smarter and safer with KomuniTrade.",
    cta_footer_btn_text: "Sign Up — It's Free!",

    // Dashboard (Home)
    dash_ai_badge: "AI-Powered Marketplace",
    dash_title: "Discover Local Deals",
    dash_subtitle: "Buy & sell within your barangay — safe, fast, and easy",
    dash_search_ph: "Search items, services...",
    dash_results: "items found",
    dash_clear: "Clear filter",
    dash_empty_title: "No items found",
    dash_empty_desc: "Try adjusting your filters, radius, or search query",
    
    // Sidebar
    side_main: "Main",
    side_dash: "Dashboard",
    side_inventory: "Inventory",
    side_comm: "Communication",
    side_messages: "Messages",
    side_profile: "Profile",
    side_settings: "Settings",
    side_app_settings: "App Settings",
    side_privacy: "Privacy & Security",
    side_help: "Help Center",
    side_logout: "Logout",

    // Profile
    prof_inventory: "Inventory",
    prof_insights: "Insights",
    prof_security: "Security",
    prof_active_listings: "Active Listings",
    prof_list_new: "List New Item",
    prof_no_listings: "No active listings",
    prof_no_listings_desc: "Your inventory is currently empty. Start selling to your neighborhood!",
    prof_trust_score: "Trust Score",
    prof_verified: "VERIFIED",
    prof_edit: "Edit Profile",
    prof_coming_soon: "Edit Profile Coming Soon!",
    prof_share_msg: "Profile link copied to clipboard!",
    prof_del_confirm: "Are you sure you want to remove this listing?",

    // Settings
    sett_title: "Settings",
    sett_appearance: "Appearance",
    sett_light: "Light Mode",
    sett_dark: "Dark Mode",
    sett_system: "System Default",
    sett_prefs: "Preferences",
    sett_notifs: "Push Notifications",
    sett_privacy: "Privacy & Safety",
    sett_dev_tools: "Developer Tools",
    sett_seed_db: "Seed Database",
    sett_seed_desc: "Populate Firestore with mock data",
    sett_seed_now: "Seed Now",
    sett_purge_exp: "Purge Expired",
    sett_purge_desc: "Simulate automated TTL cleanup",
    sett_purge_now: "Purge Now",
    sett_sign_out: "Sign Out"
  },
  tl: {
    // Nav
    nav_brand: "KOMUNITRADE",
    nav_login: "Mag-Login",
    nav_signup: "Simulan Na",
    nav_search_ph: "Maghanap sa Davao...",

    // Landing Hero
    hero_davao: "📍 Para sa mga Davaoeño",
    hero_barangay: "Ang <span class='text-gradient'>barangay</span> marketplace ng Davao.",
    hero_buy_sell: "Mag-buy at sell nang ligtas sa iyong barangay. Mula ukay-ukay hanggang gadgets — lahat nandito, AI-powered at community-verified.",
    hero_mag_lista: "Mag-Lista ng Item",
    hero_mag_browse: "Mag-Browse",
    stats_barangays: "Mga Barangay",
    stats_ai: "AI Listing",
    stats_chat: "Ligtas na Chat",
    stats_title: "Barangay-level trading, reinvented.",
    stats_subtitle: "Para sa mga Komunidad sa Davao",

    // Categories
    cat_title: "Ano ang <span class='text-gradient'>pwedeng i-trade?</span>",
    cat_subtitle: "Mula sa palengke hanggang tech gadgets — kung nasa Davao ka, may buyer ka dito.",
    cat_fresh: "Mga Sariwang Produkto",
    cat_fresh_desc: "Durian, mangga, lokal na prutas",
    cat_ukay: "Ukay-Ukay",
    cat_ukay_desc: "Dekalidad na segunda-manong damit",
    cat_gadgets: "Mga Gadget",
    cat_gadgets_desc: "Phones, laptops, accessories",
    cat_services: "Mga Serbisyo",
    cat_services_desc: "Repair, delivery, freelance",
    cat_home: "Bahay at Pamumuhay",
    cat_home_desc: "Muwebles, appliances",
    cat_school: "Gamit sa Eskwela",
    cat_school_desc: "Libro, bag, uniporme",

    // Trust Section
    trust_badge: "Ligtas at Sigurado",
    trust_title: "Ligtas mag-trade sa iyong barangay.",
    trust_desc: "Hindi mo kailangan ibigay ang iyong tunay na pangalan o address. Gamit ang anonymous ID system, ikaw ay protektado sa lahat ng transaksyon.",
    trust_feat1_title: "End-to-End Encrypted Chat",
    trust_feat1_desc: "Tanging ikaw at ang buyer ang makakabasa ng mensahe.",
    trust_feat2_title: "Auto-Expiring Listings",
    trust_feat2_desc: "Listings na nag-expire ay awtomatikong nababura para sa iyong privacy.",
    trust_feat3_title: "Geohash Verification",
    trust_feat3_desc: "Buyers ay verified na nasa parehong barangay mo.",

    // FAQ
    faq_title: "Mga Tanong <span class='text-gradient'>Tungkol sa KomuniTrade</span>",
    faq_subtitle: "Lahat ng kailangan mong malaman bago mag-trade.",
    faq_q1: "Ligtas ba mag-trade dito?",
    faq_a1: "Oo! Bawat user ay verified sa pamamagitan ng Geohash at community trust score. Hindi namin ibinibigay ang iyong tunay na pangalan o address.",
    faq_q2: "Gaano kabilis mag-lista?",
    faq_a2: "Gamit ang aming Gemini AI engine, maaari kang gumawa ng professional listing sa loob ng 10 segundo.",
    faq_q3: "Libre ba ang KomuniTrade?",
    faq_a3: "Yes, libre ang paggamit ng KomuniTrade para sa lahat ng barangay residents.",
    faq_q4: "Ano ang pwedeng ibenta?",
    faq_a4: "Lahat ng legal na items — mula ukay-ukay, gadgets, lutong pagkain, at iba pa.",

    // Footer CTA
    cta_footer_location: "📍 Lungsod ng Davao, Pilipinas",
    cta_footer_title: "Simulan na ang <span style='color: var(--primary)'>pag-trade</span> ngayon.",
    cta_footer_desc: "Sumali na sa inyong mga kapitbahay na nag-ta-trade nang mas matalino at mas ligtas sa KomuniTrade.",
    cta_footer_btn_text: "Mag-Sign Up — Libre!",

    // Dashboard (Home)
    dash_ai_badge: "AI-Powered na Marketplace",
    dash_title: "Tingnan ang mga Lokal na Deal",
    dash_subtitle: "Bumili at magbenta sa iyong barangay — ligtas, mabilis, at madali",
    dash_search_ph: "Maghanap ng items, serbisyo...",
    dash_results: "items na nahanap",
    dash_clear: "Burahin ang filter",
    dash_empty_title: "Walang nahanap na items",
    dash_empty_desc: "Subukang ayusin ang iyong filters, radius, o search query",
    
    // Sidebar
    side_main: "Pangunahin",
    side_dash: "Dashboard",
    side_inventory: "Imbentaryo",
    side_comm: "Komunikasyon",
    side_messages: "Mga Mensahe",
    side_profile: "Profile",
    side_settings: "Settings",
    side_app_settings: "App Settings",
    side_privacy: "Privacy at Seguridad",
    side_help: "Help Center",
    side_logout: "Mag-Logout",

    // Profile
    prof_inventory: "Imbentaryo",
    prof_insights: "Insights",
    prof_security: "Seguridad",
    prof_active_listings: "Aktibong Listings",
    prof_list_new: "Mag-lista ng Bago",
    prof_no_listings: "Walang aktibong listings",
    prof_no_listings_desc: "Ang iyong imbentaryo ay kasalukuyang walang laman. Simulan na ang pagbenta sa iyong barangay!",
    prof_trust_score: "Trust Score",
    prof_verified: "VERIFIED",
    prof_edit: "I-edit ang Profile",
    prof_coming_soon: "Parating na ang Edit Profile!",
    prof_share_msg: "Link ng profile ay nakopya na!",
    prof_del_confirm: "Sigurado ka bang gusto mong burahin ang listing na ito?",

    // Settings
    sett_title: "Mga Settings",
    sett_appearance: "Hitsura",
    sett_light: "Light Mode",
    sett_dark: "Dark Mode",
    sett_system: "System Default",
    sett_prefs: "Mga Kagustuhan",
    sett_notifs: "Push Notifications",
    sett_privacy: "Privacy at Seguridad",
    sett_dev_tools: "Developer Tools",
    sett_seed_db: "I-seed ang Database",
    sett_seed_desc: "Lagyan ang Firestore ng mock data",
    sett_seed_now: "I-seed Na",
    sett_purge_exp: "I-purge ang Expired",
    sett_purge_desc: "Simulan ang automated TTL cleanup",
    sett_purge_now: "I-purge Na",
    sett_sign_out: "Mag-Logout"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('app-lang') || 'en');

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return [context.lang, context.setLang, context.t];
};
