import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// =============================================
// KOMUNITRADE LANGUAGE SYSTEM V3
// Professional Localization for Davao Marketplace
// =============================================

const translations = {
  // =====================================================
  // ENGLISH (Modern Localized English)
  // =====================================================
  en: {
    // NAVIGATION
    nav_brand: 'KOMUNITRADE',
    nav_login: 'Log In',
    nav_signup: 'Join the Community',
    nav_search_ph: 'Search in Matina, Obrero, Toril...',
    nav_categories: 'Categories',
    nav_how_it_works: 'How it Works',
    nav_safety: 'Safety Tips',

    // HERO SECTION
    hero_badge: ' Built for Davaoeños',
    hero_title: "Buy & sell with <span class='text-gradient'>neighbors you trust</span>",
    hero_subtitle: 'From ukay-ukay and gadgets to fresh durian and sideline services — KomuniTrade helps Davaoeños connect locally and trade safely.',
    hero_cta_sell: 'Sell Now',
    hero_cta_browse: 'Browse Now',

    // HERO STATS
    stats_barangays: 'Barangays Connected',
    stats_verified: 'Verified Sellers',
    stats_secure: 'Private & Secure',
    stats_title: 'A Community-Driven Marketplace',
    stats_subtitle: 'Helping local neighborhoods grow through trusted trade.',

    // CATEGORIES
    cat_title: 'What can you trade today?',
    cat_subtitle: 'Everything from local products to student essentials — all nearby.',
    cat_view_all: 'View All Categories',

    cat_ukay: 'Thrifted Clothes',
    cat_ukay_desc: 'Affordable pre-loved fashion',

    cat_gadgets: 'Gadgets',
    cat_gadgets_desc: 'Phones, laptops, accessories',

    cat_durian: 'Fresh Fruits',
    cat_durian_desc: 'Fresh Davao harvests',

    cat_services: 'Services',
    cat_services_desc: 'Delivery, freelance, repairs',

    cat_motor: 'Motor Parts',
    cat_motor_desc: 'Motorcycle essentials & upgrades',

    cat_students: 'Student Essentials',
    cat_students_desc: 'School supplies, uniforms, books',

    cat_condo: 'Condo Moving Sale',
    cat_condo_desc: 'Furniture & appliances nearby',


    cat_Furniture: 'Furniture',
    cat_Furniture_desc: 'Sofas, tables, and home decor',

    cat_sari: 'Sari-Sari Supplies',
    cat_sari_desc: 'Wholesale and retail goods',

    // TRUST SECTION
    trust_badge: 'Community Trusted',
    trust_title: 'Trade safer with verified neighbors.',
    trust_desc: 'KomuniTrade helps protect your privacy while keeping transactions local, secure, and community-driven.',

    trust_feat1_title: 'Encrypted Messaging',
    trust_feat1_desc: 'Only you and the buyer can read your conversation.',

    trust_feat2_title: 'Verified Local Sellers',
    trust_feat2_desc: 'Know that sellers are nearby and community-verified.',

    trust_feat3_title: 'Privacy Protected',
    trust_feat3_desc: 'Your exact location and identity stay hidden.',

    // FAQ
    faq_title: 'Frequently Asked Questions',
    faq_subtitle: 'Everything you need before trading with your neighborhood.',

    faq_q1: 'Is KomuniTrade safe?',
    faq_a1: 'Yes. Sellers are locally verified and your private information stays protected.',

    faq_q2: 'Can I trade within my barangay only?',
    faq_a2: 'Yes. KomuniTrade focuses on nearby and trusted neighborhood transactions.',

    faq_q3: 'Is the app free?',
    faq_a3: 'Absolutely. Posting and browsing listings are completely free.',

    faq_q4: 'What can I sell?',
    faq_a4: 'Anything legal — gadgets, ukay, local food, furniture, services, and more.',

    // FOOTER CTA
    cta_footer_location: '📍 Davao City, Philippines',
    cta_footer_title: 'Start trading with your community.',
    cta_footer_desc: 'Join thousands of Davaoeños buying and selling locally.',
    cta_footer_btn: 'Join KomuniTrade',

    // DASHBOARD
    dash_badge: 'Verified Davaoeño Marketplace',
    dash_verify_badge: 'Identity Verified',
    dash_title: 'Discover Nearby Deals',
    dash_subtitle: 'Find affordable items and trusted sellers near your area.',
    dash_search_ph: 'Search gadgets, ukay, food, services...',
    dash_results: 'items found',
    dash_clear: 'Clear Filters',
    dash_empty_title: 'No listings found',
    dash_empty_desc: 'Try adjusting your filters or search keywords.',
    dash_load_more: 'Load More',
    dash_filter_by: 'Filter by',

    // SIDEBAR
    side_main: 'Main Menu',
    side_comm: 'Communication',
    side_dash: 'Marketplace',
    side_inventory: 'My Listings',
    side_messages: 'Messages',
    side_profile: 'My Profile',
    side_settings: 'Settings',
    side_app_settings: 'App Settings',
    side_privacy: 'Privacy & Safety',
    side_help: 'Help Center',
    side_logout: 'Log Out',

    // PROFILE
    prof_inventory: 'Inventory',
    prof_insights: 'Insights',
    prof_security: 'Security',
    prof_active_listings: 'Active Listings',
    prof_list_new: 'Post New Listing',
    prof_no_listings: 'No active listings yet',
    prof_no_listings_desc: 'Start selling to your local neighborhood today.',
    prof_trust_score: 'Community Trust Score',
    prof_verified: 'VERIFIED SELLER',
    prof_edit: 'Edit Profile',
    prof_bio: 'About Me',
    prof_bio_placeholder: 'Tell your neighbors a little about yourself...',
    prof_name_label: 'Display Name',
    prof_change_photo: 'Update Photo',
    prof_share_msg: 'Profile link copied!',
    prof_del_confirm: 'Remove this listing?',
    prof_joined: 'Member since',
    prof_total_sales: 'Total Sales',
    prof_response_rate: 'Response Rate',

    // SETTINGS
    sett_title: 'Settings',
    sett_appearance: 'Appearance',
    sett_language: 'Language',
    sett_light: 'Light Mode',
    sett_dark: 'Dark Mode',
    sett_system: 'System Default',
    sett_prefs: 'Preferences',
    sett_notifs: 'Push Notifications',
    sett_email_notifs: 'Email Notifications',
    sett_market_updates: 'Marketplace Updates',
    sett_privacy: 'Privacy & Safety',
    sett_sign_out: 'Log Out',
    sett_signout_confirm: 'Are you sure you want to log out?',

    // Dev Tools
    sett_dev_tools: 'Developer Tools',
    sett_seed_db: 'Seed Database',
    sett_seed_desc: 'Populate the database with sample listings for testing.',
    sett_seed_now: 'Seed Now',
    sett_purge_exp: 'Purge Expired Listings',
    sett_purge_desc: 'Permanently delete all listings that have passed their expiration date.',
    sett_purge_now: 'Purge Now',

    // CREATE LISTING
    post_title: 'Create Listing',
    post_subtitle: 'Sell to your nearby community',

    post_advisor_title: 'Smart Listing Assistant',
    post_advisor_sub: 'Helping your listing reach more local buyers.',

    post_keyword_detected: 'Strong Keywords Detected',
    post_keyword_guidance: 'Search Visibility Tips',
    post_keyword_success: 'Your title looks good and searchable.',
    post_keyword_hint: 'Add words like “Rush”, “Brand New”, or “Negotiable”.',

    post_price_check: 'Neighborhood Price Check',
    post_price_assessment: 'Price Evaluation',
    post_price_success: '₱{price} looks competitive in {barangay}.',
    post_price_hint: 'We compare your price with nearby listings.',

    post_info_title: 'Listing Information',
    post_item_title: 'Item Name',
    post_desc: 'Description',
    post_price: 'Price (₱)',
    post_cat: 'Category',
    post_cat_label: 'Choose Category',
    post_logistics: 'Meet-up & Delivery',
    post_barangay: 'Your Barangay',

    post_rush: 'Rush Listing',
    post_rush_desc: 'Boost visibility for fast selling.',

    post_publish: 'Publish Listing',
    post_publishing: 'Publishing...',
    post_success_msg: '🎉 Your listing is now live on KomuniTrade!',
    post_upload_photos: 'Upload Photos',
    post_photo_limit: 'Up to 5 photos',
    post_drag_drop: 'Drag & drop or click to upload',

    // CONDITIONS
    post_condition: 'Item Condition',
    post_cond_new: 'Brand New',
    post_cond_like_new: 'Like New',
    post_cond_good: 'Good Condition',
    post_cond_fair: 'Fair / Used',
    post_cond_poor: 'For Repair / Parts',

    // MESSAGING
    msg_title: 'Messages',
    msg_no_conversations: 'No conversations yet',
    msg_start_chat: 'Start chatting with a seller',
    msg_type_message: 'Type a message...',
    msg_send: 'Send',
    msg_online: 'Online',
    msg_offline: 'Offline',
    msg_typing: 'Typing...',

    // MICROCOPY
    micro_verified: 'Verified Davaoeño Seller',
    micro_meetup: 'Meet-up ready',
    micro_nearby: 'Near your area',
    micro_rush: 'Rush sale',
    micro_student: 'Student budget friendly',
    micro_suki: 'Suki approved',
    micro_negotiable: 'Price negotiable',
    micro_free_delivery: 'Free delivery',

    // ERRORS & VALIDATION
    error_required: 'This field is required',
    error_invalid_email: 'Please enter a valid email',
    error_short_password: 'Password must be at least 8 characters',
    error_upload_failed: 'Failed to upload image',
    error_network: 'Network error. Please try again.',
    error_general: 'Something went wrong. Please try again.',

    // SUCCESS MESSAGES
    success_saved: 'Changes saved successfully!',
    success_deleted: 'Item deleted successfully!',
    success_reported: 'Thank you for reporting. We will review this.',

    // STATS COUNTER
    stats_counter_title: 'KomuniTrade by the Numbers',
    stats_counter_subtitle: 'Growing every day with trusted Davaoeño traders.',
    stats_listings_label: 'Local Listings',
    stats_sellers_label: 'Verified Sellers',
    stats_satisfaction_label: 'Satisfaction Rate',

    // HOW IT WORKS
    hiw_title: 'How It Works',
    hiw_subtitle: 'Three simple steps to start trading in your neighborhood.',
    hiw_step1_title: 'Post Your Item',
    hiw_step1_desc: 'Snap a photo, set a price, and your listing goes live to nearby buyers instantly.',
    hiw_step2_title: 'Get Verified',
    hiw_step2_desc: 'Our AI verifies your listing in ~2 seconds so buyers know it\'s legit.',
    hiw_step3_title: 'Trade Locally',
    hiw_step3_desc: 'Chat securely, agree on a meet-up spot, and complete your trade face-to-face.',

    // PWA INSTALL
    pwa_title: 'Take KomuniTrade Everywhere',
    pwa_desc: 'Install the app on your phone for instant access — no app store needed.',
    pwa_cta: 'Install the App',
    pwa_feat1: 'Works offline with cached listings',
    pwa_feat2: 'Lightning-fast load times',
    pwa_feat3: 'Home screen shortcut like a native app',

    // FOOTER
    footer_tagline: 'Made with ❤️ in Davao City.',
  },

  // =====================================================
  // TAGALOG
  // =====================================================
  tl: {
    nav_brand: 'KOMUNITRADE',
    nav_login: 'Mag-Login',
    nav_signup: 'Sumali Ngayon',
    nav_search_ph: 'Maghanap sa Matina, Obrero, Toril...',
    nav_categories: 'Mga Kategorya',
    nav_how_it_works: 'Paano Ito Gumagana',
    nav_safety: 'Mga Tips sa Kaligtasan',

    hero_badge: '📍 Ginawa para sa mga Davaoeño',
    hero_title: 'Bumili at magbenta kasama ang mga kapitbahay na mapagkakatiwalaan mo.',
    hero_subtitle: 'Mula ukay-ukay at gadgets hanggang sariwang prutas at sideline services — mas pinapadali ng KomuniTrade ang lokal na bentahan.',
    hero_cta_sell: 'Mag-post ng Baligya',
    hero_cta_browse: 'Maghanap ng Sulit',

    stats_barangays: 'Mga Barangay Connected',
    stats_verified: 'Mga Beripikadong Nagbebenta',
    stats_secure: 'Ligtas at Secure',
    stats_title: 'Marketplace ng Komunidad',
    stats_subtitle: 'Pagpapalago ng lokal na ekonomiya sa Davao.',

    cat_title: 'Ano ang gusto mong i-trade?',
    cat_subtitle: 'Lahat mula lokal na produkto hanggang student essentials.',
    cat_view_all: 'Tingnan Lahat ng Kategorya',

    cat_ukay: 'Ukay-Ukay',
    cat_ukay_desc: 'Abot-kayang pre-loved fashion',

    cat_gadgets: 'Gadgets',
    cat_gadgets_desc: 'Phones, laptops, accessories',

    cat_durian: 'Durian at Prutas',
    cat_durian_desc: 'Sariwang ani mula Davao',

    cat_services: 'Sideline Services',
    cat_services_desc: 'Delivery, freelance, repair',

    cat_motor: 'Mga Piyeza ng Motor',
    cat_motor_desc: 'Mahahalagang piyeza para sa motorsiklo',

    cat_students: 'Pangangailangan ng Estudyante',
    cat_students_desc: 'School supplies, uniporme, aklat',

    cat_condo: 'Paglipat ng Condo Sale',
    cat_condo_desc: 'Muwebles at appliances na malapit lang',

    cat_sari: 'Paninda para sa Sari-Sari Store',
    cat_sari_desc: 'Mga paninda sa palengke',

    trust_badge: 'Kasaligan at Ligtas',
    trust_title: 'Mas kampante kung verified ang seller.',
    trust_desc: 'Pinoprotektahan ng KomuniTrade ang iyong privacy habang pinapanatiling ligtas ang transaksyon.',

    trust_feat1_title: 'Encrypted na Pagmemensahe',
    trust_feat1_desc: 'Ikaw lang at ang buyer ang nakakabasa ng usapan niyo.',

    trust_feat2_title: 'Verified na Lokal na Nagbebenta',
    trust_feat2_desc: 'Alamin na ang nagbebenta ay malapit at pinagkakatiwalaan ng komunidad.',

    trust_feat3_title: 'Protektado ang Privacy',
    trust_feat3_desc: 'Ang iyong eksaktong lokasyon at pagkakakilanlan ay nakatago.',

    faq_title: 'Mga Madalas Itanong',
    faq_subtitle: 'Lahat ng kailangan mong malaman bago makipag-trade.',

    faq_q1: 'Ligtas ba ang KomuniTrade?',
    faq_a1: 'Oo. Ang mga nagbebenta ay beripikado at ang iyong personal na impormasyon ay protektado.',

    faq_q2: 'Puwede ba akong makipagkalakalan sa loob lang ng aking barangay?',
    faq_a2: 'Oo. Nakatuon ang KomuniTrade sa malapit at mapagkakatiwalaang mga transaksyon sa kapitbahayan.',

    faq_q3: 'Libre ba ang app?',
    faq_a3: 'Talagang libre ang pag-post at pag-browse ng mga listahan.',

    faq_q4: 'Ano ang maaari kong ibenta?',
    faq_a4: 'Anumang legal — gadgets, ukay, lokal na pagkain, muwebles, serbisyo, at iba pa.',

    cta_footer_location: '📍 Lungsod ng Davao, Pilipinas',
    cta_footer_title: 'Simulan ang lokal na bentahan.',
    cta_footer_desc: 'Sumali sa lumalaking komunidad ng mga Davaoeño traders.',
    cta_footer_btn: 'Sumali sa KomuniTrade',

    dash_badge: 'Verified Davaoeño Marketplace',
    dash_verify_badge: 'Beripikadong Pagkakakilanlan',
    dash_title: 'Tuklasin ang mga Kalapit na Deals',
    dash_subtitle: 'Maghanap ng abot-kayang mga produkto at mapagkakatiwalaang nagbebenta malapit sa iyo.',
    dash_search_ph: 'Maghanap ng gadgets, ukay, pagkain, serbisyo...',
    dash_results: 'mga item ang natagpuan',
    dash_clear: 'I-clear ang mga Filter',
    dash_empty_title: 'Walang nakitang listahan',
    dash_empty_desc: 'Subukang ayusin ang iyong mga filter o mga keyword sa paghahanap.',
    dash_load_more: 'Mag-load ng Higit Pa',
    dash_filter_by: 'I-filter ayon sa',

    side_main: 'Pangunahing Menu',
    side_comm: 'Komunikasyon',
    side_dash: 'Marketplace',
    side_inventory: 'Aking mga Listahan',
    side_messages: 'Mga Mensahe',
    side_profile: 'Aking Profile',
    side_settings: 'Mga Setting',
    side_app_settings: 'Mga Setting ng App',
    side_privacy: 'Privacy at Kaligtasan',
    side_help: 'Sentro ng Tulong',
    side_logout: 'Mag-logout',

    prof_inventory: 'Imbentaryo',
    prof_insights: 'Mga Insight',
    prof_security: 'Seguridad',
    prof_active_listings: 'Mga Aktibong Listahan',
    prof_list_new: 'Mag-post ng Bagong Listahan',
    prof_no_listings: 'Wala pang aktibong listahan',
    prof_no_listings_desc: 'Simulan ang pagbebenta sa iyong lokal na kapitbahayan ngayon.',
    prof_trust_score: 'Trust Score ng Komunidad',
    prof_verified: 'BERIPIKADONG NAGBEBENTA',
    prof_edit: 'I-edit ang Profile',
    prof_bio: 'Tungkol sa Akin',
    prof_bio_placeholder: 'Sabihin sa iyong mga kapitbahay ang kaunti tungkol sa iyong sarili...',
    prof_name_label: 'Pangalan ng Display',
    prof_change_photo: 'Mag-update ng Larawan',
    prof_share_msg: 'Nakopya na ang link ng profile!',
    prof_del_confirm: 'Alisin ang listahang ito?',
    prof_joined: 'Sumali noong',
    prof_total_sales: 'Kabuuang Benta',
    prof_response_rate: 'Rate ng Pagtugon',

    sett_title: 'Mga Setting',
    sett_appearance: 'Hitsura',
    sett_language: 'Wika',
    sett_light: 'Light Mode',
    sett_dark: 'Dark Mode',
    sett_system: 'Default ng System',
    sett_prefs: 'Mga Kagustuhan',
    sett_notifs: 'Push Notifications',
    sett_email_notifs: 'Mga Notification sa Email',
    sett_market_updates: 'Mga Update sa Marketplace',
    sett_privacy: 'Privacy at Kaligtasan',
    sett_sign_out: 'Mag-logout',
    sett_signout_confirm: 'Sigurado ka bang gusto mong mag-logout?',

    // Dev Tools
    sett_dev_tools: 'Mga Developer Tool',
    sett_seed_db: 'Seed Database',
    sett_seed_desc: 'Punan ang database ng mga sample na listahan para sa testing.',
    sett_seed_now: 'Seed Ngayon',
    sett_purge_exp: 'I-purge ang Expired na Listahan',
    sett_purge_desc: 'Permanenteng burahin ang lahat ng listahan na lumipas na sa expiration date.',
    sett_purge_now: 'I-purge Ngayon',

    post_title: 'Lumikha ng Listahan',
    post_subtitle: 'Magbenta sa iyong kalapit na komunidad',

    post_advisor_title: 'Smart Listing Assistant',
    post_advisor_sub: 'Tumutulong sa iyong listahan na maabot ang mas maraming lokal na mamimili.',

    post_keyword_detected: 'Malalakas na Keyword na Natukoy',
    post_keyword_guidance: 'Mga Tip sa Search Visibility',
    post_keyword_success: 'Ang iyong pamagat ay maganda at madaling mahanap.',
    post_keyword_hint: 'Magdagdag ng mga salitang gaya ng “Rush”, “Brand New”, o “Negotiable”.',

    post_price_check: 'Neighborhood Price Check',
    post_price_assessment: 'Pagsusuri ng Presyo',
    post_price_success: 'Ang ₱{price} ay mukhang competitive sa {barangay}.',
    post_price_hint: 'Inihahambing namin ang iyong presyo sa mga kalapit na listahan.',

    post_info_title: 'Impormasyon ng Listahan',
    post_item_title: 'Pangalan ng Item',
    post_desc: 'Paglalarawan',
    post_price: 'Presyo (₱)',
    post_cat: 'Kategorya',
    post_cat_label: 'Pumili ng Kategorya',
    post_logistics: 'Meet-up & Delivery',
    post_barangay: 'Iyong Barangay',

    post_rush: 'Rush Listahan',
    post_rush_desc: 'Palakasin ang visibility para sa mabilis na pagbenta.',

    post_publish: 'I-publish ang Listahan',
    post_publishing: 'Nag-publish...',
    post_success_msg: '🎉 Ang iyong listahan ay live na sa KomuniTrade!',
    post_upload_photos: 'Mag-upload ng mga Larawan',
    post_photo_limit: 'Hanggang 5 larawan',
    post_drag_drop: 'I-drag & i-drop o i-click para mag-upload',

    post_condition: 'Kondisyon ng Item',
    post_cond_new: 'Brand New',
    post_cond_like_new: 'Parang Bago',
    post_cond_good: 'Magandang Kondisyon',
    post_cond_fair: 'Ayos lang / Gamit na',
    post_cond_poor: 'Para sa Pagkumpuni / Piyeza',

    msg_title: 'Mga Mensahe',
    msg_no_conversations: 'Wala pang mga usapan',
    msg_start_chat: 'Magsimulang makipag-chat sa isang nagbebenta',
    msg_type_message: 'Mag-type ng menshe...',
    msg_send: 'Ipadala',
    msg_online: 'Online',
    msg_offline: 'Offline',
    msg_typing: 'Nagta-type...',

    micro_verified: 'Beripikadong Davaoeño Seller',
    micro_meetup: 'Handa sa meet-up',
    micro_nearby: 'Malapit sa iyong lugar',
    micro_rush: 'Rush sale',
    micro_student: 'Budget-friendly para sa estudyante',
    micro_suki: 'Aprubado ng Suki',
    micro_negotiable: 'Maaaring tumawad',
    micro_free_delivery: 'Libreng delivery',

    error_required: 'Kinakailangan ang field na ito',
    error_invalid_email: 'Paki-enter ng wastong email',
    error_short_password: 'Ang password ay dapat hindi bababa sa 8 character',
    error_upload_failed: 'Nabigo ang pag-upload ng larawan',
    error_network: 'Error sa network. Pakisubukan muli.',
    error_general: 'May mali. Pakisubukan muli.',

    success_saved: 'Matagumpay na nai-save ang mga pagbabago!',
    success_deleted: 'Matagumpay na natanggal ang item!',
    success_reported: 'Salamat sa pag-uulat. Susuriin namin ito.',

    // STATS COUNTER
    stats_counter_title: 'KomuniTrade sa mga Numero',
    stats_counter_subtitle: 'Lumalaki araw-araw kasama ang mga Davaoeño traders.',
    stats_listings_label: 'Mga Lokal na Listahan',
    stats_sellers_label: 'Beripikadong Nagbebenta',
    stats_satisfaction_label: 'Rate ng Kasiyahan',

    // HOW IT WORKS
    hiw_title: 'Paano Ito Gumagana',
    hiw_subtitle: 'Tatlong simpleng hakbang para magsimulang mag-trade sa iyong kapitbahayan.',
    hiw_step1_title: 'I-post ang Iyong Item',
    hiw_step1_desc: 'Kumuha ng larawan, magtakda ng presyo, at live na ang iyong listahan sa mga malapit na mamimili.',
    hiw_step2_title: 'Ma-verify',
    hiw_step2_desc: 'Bine-verify ng aming AI ang iyong listahan sa ~2 segundo para malaman ng buyers na totoo ito.',
    hiw_step3_title: 'Mag-trade ng Lokal',
    hiw_step3_desc: 'Mag-chat nang ligtas, mag-agree sa meet-up spot, at kumpletuhin ang trade nang harapan.',

    // PWA INSTALL
    pwa_title: 'Dalhin ang KomuniTrade Kahit Saan',
    pwa_desc: 'I-install ang app sa iyong phone para sa instant access — walang app store na kailangan.',
    pwa_cta: 'I-install ang App',
    pwa_feat1: 'Gumagana offline gamit ang naka-cache na listahan',
    pwa_feat2: 'Napakabilis mag-load',
    pwa_feat3: 'Shortcut sa home screen tulad ng native app',

    // FOOTER
    footer_tagline: 'Gawa nang may ❤️ sa Lungsod ng Davao.',
  },

  // =====================================================
  // BISAYA / CEBUANO (MAIN LOCAL EXPERIENCE)
  // =====================================================
  bis: {
    nav_brand: 'KOMUNITRADE',
    nav_login: 'Sulod',
    nav_signup: 'Apil Na',
    nav_search_ph: 'Pangita sa Matina, Obrero, Bajada...',
    nav_categories: 'Mga Kategorya',
    nav_how_it_works: 'Giunsa Kini Paglihok',
    nav_safety: 'Safety Tips',

    hero_badge: '📍 Para gyud sa mga Davaoeño',
    hero_title: 'Palit ug baligya sa kasaligan nimong silingan.',
    hero_subtitle: 'Gikan sa ukay-ukay ug gadgets hangtod sa durian ug sideline services — mas sayon ang lokal nga trade gamit ang KomuniTrade.',
    hero_cta_sell: 'Post Baligya',
    hero_cta_browse: 'Pangita ug Sulit',

    stats_barangays: 'Mga Barangay Connected',
    stats_verified: 'Mga Beripikadong Seller',
    stats_secure: 'Ligtas ug Secure',
    stats_title: 'Marketplace sa Komunidad',
    stats_subtitle: 'Nagtabang sa lokal nga negosyo ug sideline sa Davao.',

    cat_title: 'Unsa imong gustong ibaligya?',
    cat_subtitle: 'Mga local products, gadgets, pagkaon, ug student essentials nga duol ra nimo.',
    cat_view_all: 'Tan-awa Tanang Kategorya',

    cat_ukay: 'Ukay-Ukay',
    cat_ukay_desc: 'Barato pero quality nga sanina',

    cat_gadgets: 'Gadgets',
    cat_gadgets_desc: 'Cellphone, laptop, accessories',

    cat_durian: 'Durian ug Prutas',
    cat_durian_desc: 'Preskong bunga gikan Davao',

    cat_services: 'Sideline Services',
    cat_services_desc: 'Delivery, freelance, repair',

    cat_motor: 'Motor Parts',
    cat_motor_desc: 'Motor accessories ug piyesa',

    cat_students: 'Student Essentials',
    cat_students_desc: 'School supplies ug uniforms',

    cat_condo: 'Condo Moving Sale',
    cat_condo_desc: 'Furniture ug appliances',

    cat_sari: 'Sari-Sari Supplies',
    cat_sari_desc: 'Mga paninda ug wholesale items',

    trust_badge: 'Kasaligan nga Komunidad',
    trust_title: 'Mas kampante kung verified ang imong ka-transaksyon.',
    trust_desc: 'Gipanalipdan sa KomuniTrade ang imong privacy samtang ginapadayon nga safe ug lokal ang trading.',

    trust_feat1_title: 'Encrypted nga Chat',
    trust_feat1_desc: 'Kamo ra sa buyer ang makakita sa inyong messages.',

    trust_feat2_title: 'Verified nga Seller',
    trust_feat2_desc: 'Masaligan nga seller nga duol ra sa imong area.',

    trust_feat3_title: 'Protected imong Identity',
    trust_feat3_desc: 'Dili makita ang imong exact address.',

    faq_title: 'Mga Pangutana Bahin sa KomuniTrade',
    faq_subtitle: 'Tanang kinahanglan nimong mahibal-an bago mag trade.',

    faq_q1: 'Safe ba ang KomuniTrade?',
    faq_a1: 'Oo. Verified ang mga sellers ug protected imong impormasyon.',

    faq_q2: 'Pwede ra ba sa akong barangay?',
    faq_a2: 'Oo. Focus sa KomuniTrade ang nearby ug trusted nga transactions.',

    faq_q3: 'Libre ba ni?',
    faq_a3: 'Oo, libre ra gyud ang pag post ug browse sa listings.',

    faq_q4: 'Unsa pwede ibaligya?',
    faq_a4: 'Anything legal — ukay, gadgets, pagkaon, furniture, ug services.',

    cta_footer_location: '📍 Davao City, Philippines',
    cta_footer_title: 'Sugdi na imong lokal nga trade.',
    cta_footer_desc: 'Apil sa nagkadako nga komunidad sa mga Davaoeño nga traders.',
    cta_footer_btn: 'Apil sa KomuniTrade',

    dash_badge: 'Verified Davaoeño Marketplace',
    dash_verify_badge: 'Verified nga Account',
    dash_title: 'Mga Sulit nga Duol Ra Nimo',
    dash_subtitle: 'Pamalit ug baligya sulod sa inyong barangay.',
    dash_search_ph: 'Pangita ug gadgets, ukay, pagkaon, serbisyo...',
    dash_results: 'ka items nakita',
    dash_clear: 'Clear Filters',
    dash_empty_title: 'Walay listings nakita',
    dash_empty_desc: 'Suwayi ug usab imong filters o search.',
    dash_load_more: 'Pag-load ug Daghang',
    dash_filter_by: 'I-filter pinaagi sa',

    side_main: 'Main Menu',
    side_comm: 'Komunikasyon',
    side_dash: 'Marketplace',
    side_inventory: 'Akong Listings',
    side_messages: 'Messages',
    side_profile: 'Akong Profile',
    side_settings: 'Settings',
    side_app_settings: 'App Settings',
    side_privacy: 'Privacy ug Safety',
    side_help: 'Help Center',
    side_logout: 'Logout',

    prof_inventory: 'Inventory',
    prof_insights: 'Insights',
    prof_security: 'Security',
    prof_active_listings: 'Active Listings',
    prof_list_new: 'Post New Listing',
    prof_no_listings: 'Wala pa kay active listings.',
    prof_no_listings_desc: 'Sugdi na ug baligya sa inyong barangay.',
    prof_trust_score: 'Trust Score',
    prof_verified: 'VERIFIED SELLER',
    prof_edit: 'Edit Profile',
    prof_bio: 'About Me',
    prof_bio_placeholder: 'Sulti gamay bahin sa imong kaugalingon...',
    prof_name_label: 'Display Name',
    prof_change_photo: 'Usba ang Photo',
    prof_share_msg: 'Nakopya na ang profile link!',
    prof_del_confirm: 'Tangtangon ni nga listing?',
    prof_joined: 'Miuban sukad',
    prof_total_sales: 'Kita sa Baligya',
    prof_response_rate: 'Response Rate',

    sett_title: 'Settings',
    sett_appearance: 'Appearance',
    sett_language: 'Pinulongan',
    sett_light: 'Light Mode',
    sett_dark: 'Dark Mode',
    sett_system: 'System Default',
    sett_prefs: 'Preferences',
    sett_notifs: 'Push Notifications',
    sett_email_notifs: 'Email Notifications',
    sett_market_updates: 'Marketplace Updates',
    sett_privacy: 'Privacy ug Safety',
    sett_sign_out: 'Logout',
    sett_signout_confirm: 'Sigurado ka nga gusto ka mag logout?',

    // Dev Tools
    sett_dev_tools: 'Developer Tools',
    sett_seed_db: 'Seed Database',
    sett_seed_desc: 'Pun-an ang database og sample nga mga listing para testing.',
    sett_seed_now: 'Seed Karon',
    sett_purge_exp: 'I-purge ang mga Expired',
    sett_purge_desc: 'Permanenteng papason ang tanan listing nga na-expire na.',
    sett_purge_now: 'I-purge Karon',

    post_title: 'Post Baligya',
    post_subtitle: 'Ibaligya sa imong lokal nga komunidad',

    post_advisor_title: 'Smart Listing Assistant',
    post_advisor_sub: 'Nagtabang para mas daghan makakita sa imong item.',

    post_keyword_detected: 'Nindot nga keywords detected',
    post_keyword_guidance: 'Tips para mas makita',
    post_keyword_success: 'Nindot imong title ug dali makita.',
    post_keyword_hint: 'Gamita ang words sama sa “Rush”, “Brand New”, o “Negotiable”.',

    post_price_check: 'Neighborhood Price Check',
    post_price_assessment: 'Assessment sa presyo',
    post_price_success: 'Competitive ang ₱{price} sa area sa {barangay}.',
    post_price_hint: 'Gina compare namo imong presyo sa nearby listings.',

    post_info_title: 'Impormasyon sa Listing',
    post_item_title: 'Pangalan sa Item',
    post_desc: 'Description',
    post_price: 'Presyo (₱)',
    post_cat: 'Kategorya',
    post_cat_label: 'Pili ug Category',
    post_logistics: 'Meet-up ug Delivery',
    post_barangay: 'Imong Barangay',

    post_rush: 'Rush Baligya',
    post_rush_desc: 'Mas taas visibility para dali mahalin.',

    post_publish: 'I-Publish ang Listing',
    post_publishing: 'Ginapost...',
    post_success_msg: '🎉 Live na imong listing sa KomuniTrade!',
    post_upload_photos: 'Pag-upload og mga Litrato',
    post_photo_limit: 'Hangtod sa 5 ka litrato',
    post_drag_drop: 'I-drag & drop o i-click para mag-upload',

    post_condition: 'Condition sa Item',
    post_cond_new: 'Brand New',
    post_cond_like_new: 'Murag Bago',
    post_cond_good: 'Maayo pa',
    post_cond_fair: 'Used na',
    post_cond_poor: 'For Parts / Repair',

    msg_title: 'Mga Mensahe',
    msg_no_conversations: 'Wala pay mga istorya',
    msg_start_chat: 'Pagsugod ug chat sa usa ka namaligya',
    msg_type_message: 'Pagsulat og mensahe...',
    msg_send: 'Ipadala',
    msg_online: 'Online',
    msg_offline: 'Offline',
    msg_typing: 'Nagatype...',

    micro_verified: 'Verified Davaoeño Seller',
    micro_meetup: 'Pwede meetup',
    micro_nearby: 'Duol ra nimo',
    micro_rush: 'Rush baligya',
    micro_student: 'Student budget friendly',
    micro_suki: 'Suki approved',
    micro_negotiable: 'Pwede hangyo',
    micro_free_delivery: 'Libreng delivery',

    error_required: 'Kinahanglan ang field nga kini',
    error_invalid_email: 'Palihug pagsulod og balido nga email',
    error_short_password: 'Ang password kinahanglang 8 ka karakter',
    error_upload_failed: 'Napakyas ang pag-upload sa litrato',
    error_network: 'Network error. Palihug sulayi pag-usab.',
    error_general: 'Adunay sayop. Palihug sulayi pag-usab.',

    success_saved: 'Malampuson nga naluwas ang imong mga pagbag-o!',
    success_deleted: 'Malampuson nga natangtang ang item!',
    success_reported: 'Salamat sa pagreport. Susihon namo kini.',

    // STATS COUNTER
    stats_counter_title: 'KomuniTrade sa mga Numero',
    stats_counter_subtitle: 'Nagkadako matag adlaw uban sa mga Davaoeño traders.',
    stats_listings_label: 'Lokal nga Listings',
    stats_sellers_label: 'Verified nga Sellers',
    stats_satisfaction_label: 'Satisfaction Rate',

    // HOW IT WORKS
    hiw_title: 'Giunsa Kini Paglihok',
    hiw_subtitle: 'Tulo ka simple nga lakang para makasugod ug trade sa imong silingananan.',
    hiw_step1_title: 'I-post ang Imong Item',
    hiw_step1_desc: 'Pagkuha og litrato, butangi presyo, ug live na ang imong listing sa nearby buyers.',
    hiw_step2_title: 'Ma-verify',
    hiw_step2_desc: 'Gi-verify sa among AI ang imong listing sa ~2 segundo aron mahibal-an sa buyers nga legit kini.',
    hiw_step3_title: 'Trade sa Lokal',
    hiw_step3_desc: 'Mag-chat nga luwas, mag-agree sa meet-up spot, ug kumpleto na ang trade ninyong duha.',

    // PWA INSTALL
    pwa_title: 'Dad-a ang KomuniTrade Bisan Asa',
    pwa_desc: 'I-install ang app sa imong phone para instant access — wala na kinahanglan og app store.',
    pwa_cta: 'I-install ang App',
    pwa_feat1: 'Mugana bisan offline gamit ang cached listings',
    pwa_feat2: 'Paspas kaayo mag-load',
    pwa_feat3: 'Shortcut sa home screen sama sa native app',

    // FOOTER
    footer_tagline: 'Gihimo uban sa ❤️ sa Davao City.',
  },
};

// Language options for UI selection
export const LANGUAGE_OPTIONS = [
  { code: 'bis', name: 'Bisaya', nativeName: 'Binisaya', flag: '🇵🇭' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

// =====================================================
// LANGUAGE CONTEXT
// =====================================================

const LanguageContext = createContext();

// =====================================================
// LANGUAGE PROVIDER
// =====================================================

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem('komunitrade-language');
    return LANGUAGE_OPTIONS.some(opt => opt.code === savedLang) ? savedLang : 'en';
  });

  const [direction, setDirection] = useState('ltr');

  // Translation function with parameter interpolation
  const t = useCallback((key, params = {}) => {
    let text = translations[lang]?.[key] || translations.en?.[key] || key;

    // Handle nested keys (e.g., "section.subsection.key")
    if (key.includes('.')) {
      const parts = key.split('.');
      let nested = translations[lang];
      for (const part of parts) {
        if (nested && typeof nested === 'object') {
          nested = nested[part];
        } else {
          nested = null;
          break;
        }
      }
      if (nested && typeof nested === 'string') {
        text = nested;
      }
    }

    // Replace parameters
    Object.keys(params).forEach((param) => {
      const regex = new RegExp(`\\{${param}\\}`, 'g');
      text = text.replace(regex, params[param]);
    });

    return text;
  }, [lang]);

  // Change language and persist
  const changeLanguage = useCallback((newLang) => {
    if (LANGUAGE_OPTIONS.some(opt => opt.code === newLang)) {
      setLang(newLang);
      localStorage.setItem('komunitrade-language', newLang);

      // Update HTML lang attribute
      document.documentElement.lang = newLang;

      // Set text direction (RTL support if needed)
      setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.dir = direction;
    }
  }, [direction]);

  // Get current language info
  const currentLanguage = useMemo(() => {
    return LANGUAGE_OPTIONS.find(opt => opt.code === lang) || LANGUAGE_OPTIONS[0];
  }, [lang]);

  // Set HTML lang attribute on mount
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = direction;
  }, [lang, direction]);

  const value = useMemo(() => ({
    lang,
    setLang: changeLanguage,
    t,
    currentLanguage,
    direction,
    availableLanguages: LANGUAGE_OPTIONS,
  }), [lang, changeLanguage, t, currentLanguage, direction]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// =====================================================
// CUSTOM HOOK
// =====================================================

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};

// =====================================================
// HIGHER-ORDER COMPONENT
// =====================================================

export const withLanguage = (Component) => {
  return function WrappedComponent(props) {
    const language = useLanguage();
    return <Component {...props} language={language} />;
  };
};

// =====================================================
// LANGUAGE SWITCHER COMPONENT (Optional export)
// =====================================================

export const LanguageSwitcher = ({ className = '', variant = 'dropdown' }) => {
  const { lang, setLang, availableLanguages, currentLanguage } = useLanguage();

  const handleChange = (code) => {
    setLang(code);
  };

  if (variant === 'buttons') {
    return (
      <div className={`language-switcher-buttons ${className}`}>
        {availableLanguages.map((langOpt) => (
          <button
            key={langOpt.code}
            onClick={() => handleChange(langOpt.code)}
            className={`lang-btn ${lang === langOpt.code ? 'active' : ''}`}
            aria-label={`Switch to ${langOpt.name}`}
          >
            <span className="lang-flag">{langOpt.flag}</span>
            <span className="lang-name">{langOpt.nativeName}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-switcher-dropdown ${className}`}>
      <select
        value={lang}
        onChange={(e) => handleChange(e.target.value)}
        className="lang-select"
        aria-label="Select language"
      >
        {availableLanguages.map((langOpt) => (
          <option key={langOpt.code} value={langOpt.code}>
            {langOpt.flag} {langOpt.nativeName} ({langOpt.name})
          </option>
        ))}
      </select>
    </div>
  );
};

// =====================================================
// UTILITY FUNCTION FOR NON-REACT USAGE
// =====================================================

export const translateStatic = (key, lang = 'bis', params = {}) => {
  let text = translations[lang]?.[key] || translations.en?.[key] || key;

  Object.keys(params).forEach((param) => {
    const regex = new RegExp(`\\{${param}\\}`, 'g');
    text = text.replace(regex, params[param]);
  });

  return text;
};

export default LanguageProvider;
