// ─────────────────────────────────────────────────────────────
//  ALL SITE CONTENT LIVES HERE.
//  Edit this file to change text, add projects, or add media.
//
//  Adding screenshots / videos to a project:
//    1. Drop the files in  assets/projects/<project-id>/
//    2. Add entries to that project's `media` array, e.g.
//         { type: 'image',   src: 'assets/projects/kafou/home.webp', caption: 'Home screen' }
//         { type: 'video',   src: 'assets/projects/kafou/demo.mp4',  poster: 'assets/projects/kafou/demo.jpg' }
//         { type: 'youtube', id: 'dQw4w9WgXcQ', caption: 'Walkthrough' }
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Mohammad Khallouf',
  initials: 'MK',
  title: 'Senior Flutter Developer',
  subtitle: 'Software Department Manager',
  location: 'Aleppo, Syria',
  email: 'mohammad.khallouf3@gmail.com',
  phone: '+963 968 910 488',
  linkedin: 'https://www.linkedin.com/in/mohammadkhallouf',
  github: '', // e.g. 'https://github.com/your-username' — shown automatically when filled in
  cv: 'assets/cv/Mohammad-Khallouf-CV.pdf',
  tagline: 'I build cross-platform apps that talk to the real world — from dental clinics to tire sensors.',
  summary: [
    'Senior Flutter Developer with 5.5+ years of hands-on experience building cross-platform mobile, web, and desktop applications for Android, iOS, Web, and Windows.',
    'I have shipped production-grade apps across IoT, e-commerce, healthcare, and service-marketplace domains, and I lead a software team — defining roadmaps, running Agile workflows, and mentoring engineers.',
    'I care about clean architecture, BLoC state management, multi-flavor brand delivery, CI/CD, and code that is maintainable and well tested.',
  ],
  stats: [
    { value: '5.5+', label: 'Years of experience' },
    { value: '12+', label: 'Production apps' },
    { value: '4', label: 'Platforms shipped' },
    { value: '11', label: 'Languages localized' },
  ],
  languages: [
    { name: 'Arabic', level: 'Native' },
    { name: 'English', level: 'Professional working proficiency (B2)' },
  ],
};

export const experience = [
  {
    role: 'Software Department Manager & Senior Flutter Developer',
    company: 'Hexabitz',
    meta: 'Aleppo, Syria · On-site',
    period: 'Dec 2020 – Present',
    points: [
      'Promoted to Software Department Manager in January 2025 while continuing as lead Flutter developer.',
      'Defined and executed department roadmaps, sprint plans, and team KPIs using Agile/Scrum and Jira.',
      'Managed and mentored a cross-functional software team, running code reviews and driving engineering best practices.',
      'Delivered 12+ production Flutter applications for Android, iOS, Web, and Windows — 90%+ of the company’s software portfolio.',
      'Architected and led hardware–software integration across IoT projects using Bluetooth and Wi-Fi.',
      'Integrated real-time data visualization, localization in 11 languages, REST APIs, and push notifications.',
    ],
  },
  {
    role: 'Senior Flutter Developer',
    company: 'Preneom',
    meta: 'Part-time · Remote',
    period: 'Aug 2025 – Present',
    points: [
      'Spearheaded a multi-platform Flutter application (Android, iOS, Web) for dental clinic management.',
      'Architected multi-brand delivery with Flutter Flavors — one codebase powering multiple branded products.',
      'Integrated GetStream real-time messaging, deep linking, and Gleap in-app bug reporting.',
      'Worked with backend engineers to design and consume REST APIs with robust error handling.',
    ],
  },
  {
    role: 'Freelance Flutter Developer',
    company: 'Kafou',
    meta: 'Part-time · Remote',
    period: 'Apr 2025 – Sep 2025',
    points: [
      'Contributed to the design and development of Kafou, a full-featured service marketplace published on Google Play and the App Store.',
      'Handled the full lifecycle: requirements, UI/UX implementation, testing, and store deployment.',
    ],
  },
  {
    role: 'Flutter Developer',
    company: 'Gridgate',
    meta: 'UAE · Part-time · Remote',
    period: 'Mar 2022 – Jun 2023',
    points: [
      'Completed 60% of core features and refactored 40% of the existing codebase for performance and maintainability.',
      'Integrated secure electronic payment gateways for trusted transactions.',
      'Implemented BLoC architecture for a clean, scalable codebase.',
      'Delivered e-commerce features: browsing, search, filtering, categorization, and personalized recommendations.',
    ],
  },
];

export const education = [
  {
    degree: 'Bachelor of Science in Information Technology',
    school: 'University of Aleppo — Faculty of Informatics Engineering',
    period: '2015 – 2021',
    points: ['Graduated with a grade of 81.3%', 'Minor in Software Engineering and Data Science'],
  },
];

export const skills = [
  { group: 'Mobile & Cross-Platform', items: ['Flutter', 'Dart', 'Android', 'iOS'] },
  { group: 'Architecture & Patterns', items: ['BLoC / Cubit', 'Clean Architecture', 'DDD', 'TDD', 'MVVM', 'OOP', 'Provider'] },
  { group: 'Integrations', items: ['Bluetooth (BLE)', 'Wi-Fi', 'GetStream', 'Deep Linking', 'Push Notifications', 'Payment Gateways'] },
  { group: 'Web & Backend', items: ['REST APIs', 'Firebase', 'Node.js', 'JavaScript', 'HTML/CSS'] },
  { group: 'Languages', items: ['Dart', 'Kotlin', 'Java', 'JavaScript', 'C#', 'C++'] },
  { group: 'Database & Storage', items: ['Firestore', 'SQLite', 'SQL', 'NoSQL'] },
  { group: 'DevOps & Tools', items: ['CI/CD', 'Git', 'GitHub', 'Jira', 'Agile/Scrum', 'Flutter Flavors', 'Gleap'] },
  { group: 'Testing', items: ['Unit Testing', 'Widget Testing', 'Integration Testing'] },
  { group: 'AI Tooling', items: ['Claude', 'Gemini', 'GLM'] },
];

// ─────────────────────────────────────────────────────────────
//  PROJECTS = PLANETS (listed from the sun outwards)
//
//  planet.type:  'rocky' | 'earth' | 'clouds' | 'gas' | 'ice'
//  planet.colors: three hex colours used by the procedural surface
//  planet.spot:   true → giant storm (Jupiter-style Great Red Spot)
//  planet.rings:  true → Saturn-style rings
//  planet.moons:  number of small moons
// ─────────────────────────────────────────────────────────────
export const projects = [
  {
    id: 'roman-clock',
    name: 'Roman Clock',
    org: 'Hexabitz',
    kind: 'IoT · Mobile',
    tagline: 'A phone app that drives a hardware clock telling time in Roman numerals.',
    description:
      'A multi-language IoT mobile app that controls a physical clock displaying the time in Roman numerals, over a reliable Bluetooth Low Energy link.',
    highlights: [
      'Localization support for 11 languages.',
      'Reliable BLE communication for real-time clock control.',
      'Thoroughly tested for accurate time display across devices.',
    ],
    tech: ['Flutter', 'Dart', 'BLE', 'Localization'],
    platforms: ['Android', 'iOS'],
    links: [],
    media: [],
    planet: { type: 'rocky', radius: 0.75, orbit: 10.5, speed: 0.42, phase: 0.6, tilt: 0.05, spin: 0.12,
      colors: ['#8d7a66', '#c9b08a', '#4a3f38'] },
  },
  {
    id: 'muzziball',
    name: 'Muzziball',
    org: 'Hexabitz',
    kind: 'Healthcare · IoT',
    tagline: 'An autism-therapy app that plays with light and music through an interactive ball.',
    description:
      'A mobile app that connects to an interactive therapy ball over Wi-Fi and Bluetooth, letting therapists and families customize its light colours and music.',
    highlights: [
      'Accessible UI designed for therapeutic environments.',
      'Dual connectivity — Wi-Fi and Bluetooth — for seamless device communication.',
      'Customizable light colours and music selection.',
    ],
    tech: ['Flutter', 'Dart', 'Wi-Fi', 'Bluetooth'],
    platforms: ['Android', 'iOS'],
    links: [],
    media: [],
    planet: { type: 'clouds', radius: 1.05, orbit: 14.5, speed: 0.31, phase: 2.5, tilt: 0.1, spin: 0.08,
      colors: ['#ff7ac8', '#7ad7ff', '#ffe27a'] },
  },
  {
    id: 'kafou',
    name: 'Kafou',
    org: 'Freelance',
    kind: 'Marketplace · Mobile',
    tagline: 'A two-sided marketplace connecting people with trusted local service providers.',
    description:
      'An innovative local-services marketplace with a modern, intuitive UX, smart filtering, and direct communication channels. Built end-to-end with Flutter and published on both stores.',
    highlights: [
      'Service ad creation and management.',
      'City and category filtering to find the right provider fast.',
      'One-tap contact via phone or WhatsApp.',
      'Owned the full lifecycle, from requirements to store release.',
    ],
    tech: ['Flutter', 'Dart', 'REST APIs', 'BLoC'],
    platforms: ['Android', 'iOS'],
    links: [
      { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=app.kafou' },
      { label: 'App Store', url: 'https://apps.apple.com/gb/app/kafou/id6743876670' },
    ],
    media: [],
    planet: { type: 'earth', radius: 1.2, orbit: 19, speed: 0.25, phase: 4.4, tilt: 0.41, spin: 0.1,
      colors: ['#0b3d7a', '#2f8f4e', '#c2a56b'] },
  },
  {
    id: 'tpms',
    name: 'TPMS',
    org: 'Hexabitz',
    kind: 'IoT · Automotive',
    tagline: 'Real-time tire pressure and temperature, straight from the wheel sensors.',
    description:
      'A Bluetooth-connected mobile app that collects and displays live tire pressure and temperature data from in-wheel sensors, and updates sensor firmware over the air.',
    highlights: [
      'Real-time BLE monitoring with alerts for critical tire-health events.',
      'Power-optimization algorithms that cut sensor battery use by minimizing connection intervals.',
      'Sensor firmware updates over Bluetooth.',
    ],
    tech: ['Flutter', 'Dart', 'BLE', 'Notifications'],
    platforms: ['Android', 'iOS'],
    links: [],
    media: [],
    planet: { type: 'rocky', radius: 0.9, orbit: 23.5, speed: 0.2, phase: 1.5, tilt: 0.44, spin: 0.1,
      colors: ['#b5482a', '#e08a4f', '#5e2616'] },
  },
  {
    id: 'ems',
    name: 'EMS Power Management',
    org: 'Hexabitz',
    kind: 'IoT · Energy',
    tagline: 'A multi-platform energy management system with real-time data analysis.',
    description:
      'An IoT power management system with real-time energy data analysis, running from a single Flutter codebase on Android, iOS, Web, and Windows.',
    highlights: [
      'Advanced data-visualization charts for energy consumption patterns.',
      'In-depth energy analysis and reporting, built with data analysts.',
      'REST API communication with backend servers.',
      'Bilingual localization — Arabic and English.',
    ],
    tech: ['Flutter', 'Dart', 'REST APIs', 'Charts', 'Localization'],
    platforms: ['Android', 'iOS', 'Web', 'Windows'],
    links: [],
    media: [],
    planet: { type: 'gas', radius: 3.3, orbit: 37, speed: 0.11, phase: 5.55, tilt: 0.06, spin: 0.16, spot: true,
      colors: ['#e8d3b0', '#b0703f', '#c4502c'] },
  },
  {
    id: 'iclinic',
    name: 'iClinic & iTech',
    org: 'Preneom',
    kind: 'Healthcare · Platform',
    tagline: 'A suite of apps connecting dental clinics with their laboratory technicians.',
    description:
      'A suite of cross-platform Flutter apps serving dental clinics and lab technicians: case management, real-time financial tracking of invoices and payments, and direct clinic–lab communication.',
    highlights: [
      'Multi-brand builds from a single codebase using Flutter Flavors.',
      'Real-time messaging with GetStream and deep-linked navigation.',
      'Financial dashboards and role-based access control.',
      'Published on Google Play and the App Store.',
    ],
    tech: ['Flutter', 'Flutter Flavors', 'GetStream', 'Deep Linking', 'Gleap', 'REST APIs'],
    platforms: ['Android', 'iOS', 'Web'],
    links: [
      { label: 'iClinic · Google Play', url: 'https://play.google.com/store/apps/details?id=com.preneom.iclinic' },
      { label: 'iClinic · App Store', url: 'https://apps.apple.com/gb/app/iclinic-dental/id6741328348' },
      { label: 'iTech · Google Play', url: 'https://play.google.com/store/apps/details?id=com.preneom.ilabTechs' },
      { label: 'iTech · App Store', url: 'https://apps.apple.com/us/app/ilab-techs/id6741331474' },
    ],
    media: [],
    planet: { type: 'gas', radius: 2.6, orbit: 50, speed: 0.08, phase: 3.6, tilt: 0.42, spin: 0.14, rings: true,
      colors: ['#f0e2bd', '#c9a66b', '#a8875a'] },
  },
  {
    id: 'gridgate',
    name: 'Gridgate',
    org: 'Gridgate · UAE',
    kind: 'E-commerce · Mobile',
    tagline: 'An e-commerce app for paper and digital books.',
    description:
      'An e-commerce application for selling paper and digital books, with secure payments and the discovery features readers expect.',
    highlights: [
      'Completed 60% of core features and refactored 40% of the existing codebase.',
      'Secure electronic payment gateway integration.',
      'BLoC architecture for a clean, scalable, maintainable codebase.',
      'Browsing, search, filtering, categorization, and personalized recommendations.',
    ],
    tech: ['Flutter', 'Dart', 'BLoC', 'Payment Gateways', 'REST APIs'],
    platforms: ['Android', 'iOS'],
    links: [],
    media: [],
    planet: { type: 'ice', radius: 1.9, orbit: 61, speed: 0.06, phase: 0.9, tilt: 0.3, spin: 0.1,
      colors: ['#3fb6c9', '#1c5fa8', '#bff3f0'] },
  },
  {
    id: 'iot-lab',
    name: 'Hexabitz IoT Lab',
    org: 'Hexabitz',
    kind: 'IoT · Collection',
    tagline: 'Five more hardware-connected apps — one planet, five moons.',
    description:
      'A collection of smaller IoT apps built at Hexabitz. Each one talks to custom hardware over Bluetooth, Wi-Fi, or raw sockets.',
    highlights: [],
    subprojects: [
      { name: 'Scooter Driver App', text: 'Reads scooter sensor data over Bluetooth, shows its location on a map, and sends control commands.' },
      { name: 'Moment Pick', text: 'Receives images, audio, weather, and user statistics from a hardware bracelet over Wi-Fi and Bluetooth.' },
      { name: 'Toe Pressure Management', text: 'Medical multi-platform app that graphs toe and heel pressure in real time and exports to Excel.' },
      { name: 'Human Activity Recognition', text: 'Real-time Android app that classifies motion-sensor streams as stationary, walking, or running.' },
      { name: 'LAN Sender / Receiver', text: 'Flutter Windows app exchanging UDP packets with Hexabitz network peripherals over sockets.' },
    ],
    tech: ['Flutter', 'BLE', 'Wi-Fi', 'UDP Sockets', 'Maps & GPS', 'Streams'],
    platforms: ['Android', 'iOS', 'Windows'],
    links: [],
    media: [],
    planet: { type: 'rocky', radius: 1.5, orbit: 72, speed: 0.045, phase: 2.2, tilt: 0.2, spin: 0.09, moons: 5,
      colors: ['#6c5bb3', '#a99bf0', '#2c2452'] },
  },
];
