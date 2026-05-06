import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Nav
    nav_brand: "KOMUNITRADE",
    nav_login: "Log In",
    nav_signup: "Get Started",
    nav_search_ph: "Search in Davao...",
    
    // Landing Hero
    hero_davao: "📍 Exclusively Crafted for Davaoeños",
    hero_barangay: "The <span class='text-gradient'>vibrant heartbeat</span> of neighborhood commerce.",
    hero_buy_sell: "Unlock the hidden potential of your community. From cherished pre-loved treasures to cutting-edge technology—everything you desire is just a doorstep away, verified by the neighbors you trust.",
    hero_mag_lista: "Start Selling",
    hero_mag_browse: "Explore Local Deals",
    stats_barangays: "Vibrant Communities",
    stats_verify: "Authenticity Mark",
    stats_chat: "Private & Secure",
    stats_title: "Davao's trading revolution, powered by neighborhood intelligence.",
    stats_subtitle: "Empowering every barangay in the City of Davao",

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
    faq_q2: "Is my location safe?",
    faq_a2: "Yes. We use Time Mark technology to verify you are in the neighborhood without exposing your exact house address.",
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
    dash_verify_badge: "Hyperlocal Verify Engine",
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
    prof_bio: "About Me",
    prof_bio_placeholder: "Tell your neighbors a bit about yourself...",
    prof_name_label: "Display Name",
    prof_change_photo: "Change Photo",
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
    sett_sign_out: "Sign Out",
    set_signout_confirm: "Are you sure you want to log out?",
    help_coming_soon: "Help Center: Community guidelines and safety tips coming soon!",

    // Post Item (Create Listing)
    post_title: "Create Listing",
    post_subtitle: "Neighborhood Verification Network",
    post_advisor_title: "Smart Advisor",
    post_advisor_sub: "Neighborhood-aware listing optimization",
    post_keyword_detected: "Relevant Keywords Detected",
    post_keyword_guidance: "Keyword Guidance",
    post_keyword_success: "Great title! High visibility in neighborhood searches.",
    post_keyword_hint: "Add keywords like \"Brand New\" or \"Rush\" for better searchability.",
    post_price_check: "Neighborhood Price Check",
    post_price_assessment: "Price Assessment",
    post_price_success: "₱{price} is competitive for the {barangay} neighborhood.",
    post_price_hint: "Our system will assess your price against local competitors.",
    post_info_title: "Listing Information",
    post_item_title: "Item Title",
    post_desc: "Description",
    post_price: "Price (₱)",
    post_cat: "Classification",
    post_cat_label: "Category",
    post_logistics: "Logistics",
    post_barangay: "Your Barangay",
    post_defense_mode: "Defense Mode",
    post_defense_desc: "Enforces a strict 1-hour Time-to-Live for rapid evaluation.",
    post_publish: "Publish Item",
    post_publishing: "Publishing...",
    post_success_msg: "🎉 Listing published to Anti-Gravity Marketplace!",

    // Condition
    post_condition: "Item Condition",
    post_cond_new: "Brand New / Unused",
    post_cond_like_new: "Like New (Perfect)",
    post_cond_good: "Good / Used",
    post_cond_fair: "Fair / Well Used",
    post_cond_poor: "Poor / For Parts"
  },
  tl: {
    // Nav
    nav_brand: "KOMUNITRADE",
    nav_login: "Mag-Login",
    nav_signup: "Simulan Na",
    nav_search_ph: "Maghanap sa Davao...",

    // Landing Hero
    hero_davao: "📍 Eksklusibong Likha para sa mga Davaoeño",
    hero_barangay: "Ang <span class='text-gradient'>masiglang puso</span> ng kalakalan sa iyong barangay.",
    hero_buy_sell: "Tuklasin ang yaman ng inyong komunidad. Mula sa mga paboritong pre-loved items hanggang sa makabagong teknolohiya—lahat ng iyong ninanais ay abot-tanaw lang, garantisado ng mga kapitbahay na iyong pinagkakatiwalaan.",
    hero_mag_lista: "Simulan ang Pagbenta",
    hero_mag_browse: "Mag-libot sa mga Deal",
    stats_barangays: "Masiglang Komunidad",
    stats_verify: "Tatak ng Katapatan",
    stats_chat: "Ligtas na Usapan",
    stats_title: "Trading sa loob ng barangay, ginawang mas makatao at matalino.",
    stats_subtitle: "Pagpapalakas sa bawat barangay sa Lungsod ng Davao",

    // Categories
    cat_title: "Anong <span class='text-gradient'>pwedeng i-trade?</span>",
    cat_subtitle: "Mula sa mga produkto sa palengke hanggang sa mga tech gadget — basta nasa Davao ka, may buyer ka dito.",
    cat_fresh: "Mga Sariwang Produkto",
    cat_fresh_desc: "Durian, mangga, at iba pang lokal na prutas",
    cat_ukay: "Ukay-Ukay",
    cat_ukay_desc: "Magagandang segunda-manong damit",
    cat_gadgets: "Gadgets at Electronics",
    cat_gadgets_desc: "Phones, laptops, at accessories",
    cat_services: "Mga Serbisyo",
    cat_services_desc: "Repair, delivery, o freelance",
    cat_home: "Bahay at Pamumuhay",
    cat_home_desc: "Mga muwebles at appliances",
    cat_school: "Gamit sa Eskwela",
    cat_school_desc: "Libro, bag, at uniporme",

    // Trust Section
    trust_badge: "Ligtas at Sigurado",
    trust_title: "Kampanteng makipag-trade sa iyong barangay.",
    trust_desc: "Hindi mo kailangang ibigay ang iyong tunay na pangalan o address. Gamit ang aming anonymous ID system, protektado ka sa bawat transaksyon.",
    trust_feat1_title: "End-to-End Encrypted Chat",
    trust_feat1_desc: "Tanging ikaw at ang buyer lang ang makakabasa ng inyong usapan.",
    trust_feat2_title: "Auto-Expiring Listings",
    trust_feat2_desc: "Ang mga listing na nag-expire ay kusa nang nabubura para sa iyong privacy.",
    trust_feat3_title: "Geohash Verification",
    trust_feat3_desc: "Sinisiguro naming ang mga buyer ay taga-barangay mo rin.",

    // FAQ
    faq_title: "Mga Tanong <span class='text-gradient'>Tungkol sa KomuniTrade</span>",
    faq_subtitle: "Lahat ng kailangan mong malaman bago mag-trade.",
    faq_q1: "Ligtas ba mag-trade dito?",
    faq_a1: "Oo! Bawat user ay verified sa pamamagitan ng Geohash at community trust score. Hindi namin ibinibigay ang iyong tunay na pangalan o address.",
    faq_q2: "Ligtas ba ang aking lokasyon?",
    faq_a2: "Oo. Gumagamit kami ng Time Mark technology para ma-verify na ikaw ay nasa neighborhood nang hindi inilalantad ang iyong eksaktong address.",
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
    dash_verify_badge: "Hyperlocal Verify Engine",
    dash_title: "Mga Lokal na Deal sa Inyong Lugar",
    dash_subtitle: "Bumili at magbenta sa iyong barangay — mabilis, ligtas, at madali",
    dash_search_ph: "Maghanap ng items o serbisyo...",
    dash_results: "mga panindang nahanap",
    dash_clear: "Burahin ang filters",
    dash_empty_title: "Walang nahanap na items",
    dash_empty_desc: "Subukang baguhin ang iyong filters, radius, o keyword",
    
    // Sidebar
    side_main: "Main Menu",
    side_dash: "Dashboard",
    side_inventory: "Aking mga Paninda",
    side_comm: "Komunikasyon",
    side_messages: "Mga Mensahe",
    side_profile: "Aking Profile",
    side_settings: "Settings",
    side_app_settings: "App Settings",
    side_privacy: "Privacy at Safety",
    side_help: "Help Center",
    side_logout: "Mag-Logout",

    // Profile
    prof_inventory: "Mga Paninda",
    prof_insights: "Statistics",
    prof_security: "Seguridad",
    prof_active_listings: "Aktibong Listings",
    prof_list_new: "Mag-post ng Bago",
    prof_no_listings: "Wala pang aktibong listings",
    prof_no_listings_desc: "Ang iyong listahan ay kasalukuyang walang laman. Simulan nang magbenta sa iyong barangay!",
    prof_trust_score: "Trust Score",
    prof_verified: "VERIFIED",
    prof_edit: "I-edit ang Profile",
    prof_bio: "Tungkol sa Akin",
    prof_bio_placeholder: "Magkwento ng kaunti tungkol sa iyong sarili...",
    prof_name_label: "Pangalan",
    prof_change_photo: "Palitan ang Larawan",
    prof_share_msg: "Link ng profile ay nakopya na!",
    prof_del_confirm: "Sigurado ka bang gusto mong burahin ang listing na ito?",

    // Settings
    sett_title: "Settings",
    sett_appearance: "Hitsura",
    sett_light: "Light Mode",
    sett_dark: "Dark Mode",
    sett_system: "System Default",
    sett_prefs: "Kagustuhan",
    sett_notifs: "Push Notifications",
    sett_privacy: "Privacy at Safety",
    sett_dev_tools: "Developer Tools",
    sett_seed_db: "I-seed ang Database",
    sett_seed_desc: "Lagyan ang Firestore ng mock data",
    sett_seed_now: "I-seed Na",
    sett_purge_exp: "I-purge ang Expired",
    sett_purge_desc: "Simulan ang automated TTL cleanup",
    sett_purge_now: "I-purge Na",
    sett_sign_out: "Mag-Logout",
    set_signout_confirm: "Sigurado ka bang gusto mong mag-logout?",
    help_coming_soon: "Help Center: Gabay para sa komunidad at mga safety tips ay parating na!",

    // Post Item (Create Listing)
    post_title: "Mag-post ng Item",
    post_subtitle: "Neighborhood Verification Network",
    post_advisor_title: "Smart Advisor",
    post_advisor_sub: "Optimization ng listing na angkop sa iyong barangay",
    post_keyword_detected: "May nahanap kaming magagandang Keyword",
    post_keyword_guidance: "Gabay sa Keywords",
    post_keyword_success: "Magandang title! Mas madali itong makikita sa mga barangay search.",
    post_keyword_hint: "Maglagay ng mga salita gaya ng \"Rush\" o \"Brand New\" para mas mabilis mahanap.",
    post_price_check: "Neighborhood Price Check",
    post_price_assessment: "Pagsusuri sa Presyo",
    post_price_success: "Ang presyong ₱{price} ay competitive para sa barangay {barangay}.",
    post_price_hint: "Susuriin ng aming system ang iyong presyo kumpara sa ibang kalapit na listings.",
    post_info_title: "Impormasyon ng Paninda",
    post_item_title: "Pangalan ng Item",
    post_desc: "Deskripsyon",
    post_price: "Presyo (₱)",
    post_cat: "Kategorya",
    post_cat_label: "Piliin ang Kategorya",
    post_logistics: "Logistics",
    post_barangay: "Iyong Barangay",
    post_defense_mode: "Defense Mode",
    post_defense_desc: "Nagpapatupad ng 1-hour Time-to-Live para sa mas mabilis na evaluation.",
    post_publish: "I-publish ang Paninda",
    post_publishing: "Ina-upload...",
    post_success_msg: "🎉 Nai-publish na ang iyong paninda sa Anti-Gravity Marketplace!",

    // Condition
    post_condition: "Kondisyon ng Paninda",
    post_cond_new: "Bago / Hindi pa nagagamit",
    post_cond_like_new: "Parang bago / Napakaganda",
    post_cond_good: "Maayos ang kondisyon / Nagamit na",
    post_cond_fair: "Puwede pa / Medyo gamit na",
    post_cond_poor: "Sira na / Pang-parts na lang"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('app-lang') || 'en');

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  const t = (key, params = {}) => {
    let text = translations[lang][key] || key;
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
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
