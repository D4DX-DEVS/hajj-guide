/**
 * Starter content for a fresh database. Malayalam is the primary language, so
 * every `title` / `body` carries `malayalam` plus an English gloss for the admin
 * panel. Replace this with real editorial content through the admin CMS — this
 * file only exists so the app has something to render on day one.
 */

/* --------------------------------------------------------------- rituals */

export const ritualSteps = [
  // ---------------------------------------------------------------- umrah
  {
    ritualType: 'umrah',
    stepNumber: 1,
    order: 0,
    iconEmoji: '🕋',
    title: { malayalam: 'ഇഹ്‌റാം', english: 'Ihram', arabic: 'الإحرام' },
    description: {
      malayalam: 'മീഖാത്തിൽ വെച്ച് കുളിച്ച് ഇഹ്‌റാം വസ്ത്രം ധരിച്ച് ഉംറയ്ക്ക് നിയ്യത്ത് ചെയ്യുക.',
      english: 'Bathe at the miqat, wear the ihram garments and make the intention for Umrah.',
    },
    instructions: [
      { malayalam: 'കുളിക്കുക, സുഗന്ധം പൂശുക (ഇഹ്‌റാമിന് മുൻപ് മാത്രം).', english: 'Perform ghusl and apply fragrance before entering ihram.' },
      { malayalam: 'പുരുഷൻമാർ തുന്നലില്ലാത്ത രണ്ട് വെള്ള വസ്ത്രം ധരിക്കുക.', english: 'Men wear two unstitched white cloths.' },
      { malayalam: '"ലബ്ബൈക്കല്ലാഹുമ്മ ഉംറത്തൻ" എന്ന് നിയ്യത്ത് ചെയ്യുക.', english: 'Declare the intention: Labbayka Allahumma Umratan.' },
    ],
  },
  {
    ritualType: 'umrah',
    stepNumber: 2,
    order: 1,
    iconEmoji: '📿',
    title: { malayalam: 'തൽബിയത്ത്', english: 'Talbiyah', arabic: 'التلبية' },
    description: {
      malayalam: 'മസ്ജിദുൽ ഹറാമിൽ എത്തുന്നത് വരെ തൽബിയത്ത് ഉറക്കെ ചൊല്ലിക്കൊണ്ടിരിക്കുക.',
      english: 'Recite the talbiyah continuously until you reach the Masjid al-Haram.',
    },
    instructions: [
      { malayalam: 'പുരുഷൻമാർ ഉറക്കെയും സ്ത്രീകൾ പതുക്കെയും ചൊല്ലുക.', english: 'Men recite aloud, women quietly.' },
    ],
  },
  {
    ritualType: 'umrah',
    stepNumber: 3,
    order: 2,
    iconEmoji: '🔄',
    hasTawafLink: true,
    title: { malayalam: 'ത്വവാഫ്', english: 'Tawaf', arabic: 'الطواف' },
    description: {
      malayalam: 'ഹജറുൽ അസ്‌വദിൽ നിന്ന് തുടങ്ങി കഅ്ബയെ ഏഴ് തവണ പ്രദക്ഷിണം ചെയ്യുക.',
      english: 'Circle the Kaaba seven times, starting and ending at the Black Stone.',
    },
    instructions: [
      { malayalam: 'ഓരോ ചുറ്റും ഹജറുൽ അസ്‌വദിൽ നിന്ന് തുടങ്ങുക.', english: 'Begin each circuit at the Black Stone.' },
      { malayalam: 'ആദ്യത്തെ മൂന്ന് ചുറ്റിൽ പുരുഷൻമാർ റംൽ (വേഗത്തിലുള്ള നടത്തം) ചെയ്യുക.', english: 'Men walk briskly (raml) for the first three circuits.' },
      { malayalam: 'ത്വവാഫിന് ശേഷം മഖാമു ഇബ്രാഹീമിന് പിന്നിൽ രണ്ട് റക്അത്ത് നമസ്കരിക്കുക.', english: 'Pray two rakats behind Maqam Ibrahim afterwards.' },
    ],
  },
  {
    ritualType: 'umrah',
    stepNumber: 4,
    order: 3,
    iconEmoji: '🚶',
    hasSaiLink: true,
    title: { malayalam: 'സഅ്‌യ്', english: "Sa'i", arabic: 'السعي' },
    description: {
      malayalam: 'സഫയിൽ നിന്ന് മർവയിലേക്ക് ഏഴ് തവണ നടക്കുക.',
      english: 'Walk seven legs between Safa and Marwa.',
    },
    instructions: [
      { malayalam: 'സഫയിൽ നിന്ന് ആരംഭിച്ച് മർവയിൽ അവസാനിക്കുക.', english: 'Start at Safa, finish at Marwa.' },
      { malayalam: 'പച്ച ലൈറ്റുകൾക്കിടയിൽ പുരുഷൻമാർ വേഗത്തിൽ നടക്കുക.', english: 'Men hasten between the green markers.' },
    ],
  },
  {
    ritualType: 'umrah',
    stepNumber: 5,
    order: 4,
    iconEmoji: '✂️',
    title: { malayalam: 'ഹൽഖ് / തഖ്‌സീർ', english: 'Halq or Taqsir', arabic: 'الحلق والتقصير' },
    description: {
      malayalam: 'മുടി മുണ്ഡനം ചെയ്യുകയോ വെട്ടിക്കുറയ്ക്കുകയോ ചെയ്ത് ഇഹ്‌റാമിൽ നിന്ന് വിരമിക്കുക.',
      english: 'Shave or trim the hair to exit the state of ihram.',
    },
    instructions: [
      { malayalam: 'പുരുഷൻമാർക്ക് മുണ്ഡനം ചെയ്യുന്നതാണ് ഉത്തമം.', english: 'Shaving is preferred for men.' },
      { malayalam: 'സ്ത്രീകൾ ഒരു വിരൽത്തുമ്പിന്റെ അളവ് മുടി വെട്ടുക.', english: 'Women trim a fingertip length of hair.' },
    ],
  },

  // ----------------------------------------------------------------- hajj
  {
    ritualType: 'hajj',
    stepNumber: 1,
    order: 0,
    iconEmoji: '🕋',
    title: { malayalam: 'ഇഹ്‌റാം (ദുൽഹജ്ജ് 8)', english: 'Ihram — 8 Dhul Hijjah', arabic: 'الإحرام' },
    description: {
      malayalam: 'ദുൽഹജ്ജ് എട്ടിന് ഇഹ്‌റാം ധരിച്ച് ഹജ്ജിന് നിയ്യത്ത് ചെയ്യുക.',
      english: 'Enter ihram on the 8th of Dhul Hijjah with the intention for Hajj.',
    },
    instructions: [
      { malayalam: 'താമസസ്ഥലത്ത് വെച്ച് ഇഹ്‌റാം ധരിക്കാം.', english: 'You may enter ihram from your accommodation.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 2,
    order: 1,
    iconEmoji: '⛺',
    title: { malayalam: 'മിനയിലേക്ക്', english: 'Departure to Mina', arabic: 'منى' },
    description: {
      malayalam: 'മിനയിലേക്ക് പുറപ്പെട്ട് അവിടെ അഞ്ച് നമസ്കാരങ്ങൾ നിർവഹിക്കുക.',
      english: 'Travel to Mina and offer five prayers there.',
    },
    instructions: [
      { malayalam: 'ളുഹ്ർ മുതൽ അടുത്ത ദിവസത്തെ സുബ്ഹ് വരെ മിനയിൽ കഴിയുക.', english: 'Stay from Dhuhr until Fajr of the next day.' },
      { malayalam: 'നാല് റക്അത്ത് നമസ്കാരങ്ങൾ ഖസ്‌റാക്കി രണ്ടാക്കുക.', english: 'Shorten the four-rakat prayers to two.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 3,
    order: 2,
    iconEmoji: '🏔️',
    title: { malayalam: 'അറഫയിലെ നിൽപ്പ് (ദുൽഹജ്ജ് 9)', english: 'Standing at Arafah — 9 Dhul Hijjah', arabic: 'الوقوف بعرفة' },
    description: {
      malayalam: 'ഹജ്ജിന്റെ ഏറ്റവും പ്രധാന കർമ്മം. ളുഹ്ർ മുതൽ സൂര്യാസ്തമയം വരെ അറഫയിൽ നിൽക്കുക.',
      english: 'The essential pillar of Hajj — remain at Arafah from Dhuhr until sunset.',
    },
    instructions: [
      { malayalam: 'ളുഹ്‌റും അസ്‌റും ജംഅ് ആക്കി നമസ്കരിക്കുക.', english: 'Combine Dhuhr and Asr prayers.' },
      { malayalam: 'സൂര്യാസ്തമയം വരെ ദുആയിലും ദിക്‌റിലും മുഴുകുക.', english: 'Spend the time in supplication until sunset.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 4,
    order: 3,
    iconEmoji: '🌙',
    title: { malayalam: 'മുസ്ദലിഫയിൽ രാത്രി', english: 'Night at Muzdalifah', arabic: 'المزدلفة' },
    description: {
      malayalam: 'സൂര്യാസ്തമയത്തിന് ശേഷം മുസ്ദലിഫയിലേക്ക് നീങ്ങി അവിടെ രാത്രി കഴിയുക.',
      english: 'Move to Muzdalifah after sunset and stay the night.',
    },
    instructions: [
      { malayalam: 'മഗ്‌രിബും ഇശാഉം ജംഅ് ആക്കി നമസ്കരിക്കുക.', english: 'Combine Maghrib and Isha prayers.' },
      { malayalam: 'ജംറയിലേക്കുള്ള കല്ലുകൾ ശേഖരിക്കുക.', english: 'Collect pebbles for the stoning.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 5,
    order: 4,
    iconEmoji: '🪨',
    title: { malayalam: 'ജംറത്തുൽ അഖബയിൽ കല്ലേറ്', english: 'Stoning Jamarat al-Aqabah', arabic: 'رمي جمرة العقبة' },
    description: {
      malayalam: 'ദുൽഹജ്ജ് പത്തിന് വലിയ ജംറയിൽ ഏഴ് കല്ലുകൾ എറിയുക.',
      english: 'Throw seven pebbles at the large Jamarah on the 10th.',
    },
    instructions: [
      { malayalam: 'ഓരോ കല്ലെറിയുമ്പോഴും തക്ബീർ ചൊല്ലുക.', english: 'Say takbir with each pebble.' },
      { malayalam: 'കല്ലേറിന് ശേഷം തൽബിയത്ത് നിർത്തുക.', english: 'Stop reciting the talbiyah after this.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 6,
    order: 5,
    iconEmoji: '🐑',
    title: { malayalam: 'ബലി (ഹദ്‌യ്)', english: 'Sacrifice (Hady)', arabic: 'الهدي' },
    description: {
      malayalam: 'തമത്തുഅ്, ഖിറാൻ ഹജ്ജ് ചെയ്യുന്നവർ ബലി അറുക്കുക.',
      english: 'Those performing Tamattu or Qiran offer the sacrifice.',
    },
    instructions: [
      { malayalam: 'അംഗീകൃത ബലി പദ്ധതിയിലൂടെ കൂപ്പൺ എടുക്കാം.', english: 'An official sacrifice scheme coupon is acceptable.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 7,
    order: 6,
    iconEmoji: '✂️',
    title: { malayalam: 'ഹൽഖ് / തഖ്‌സീർ', english: 'Halq or Taqsir', arabic: 'الحلق والتقصير' },
    description: {
      malayalam: 'മുടി മുണ്ഡനം ചെയ്യുകയോ വെട്ടുകയോ ചെയ്യുക. ഇതോടെ ഭാഗിക തഹല്ലുൽ ആകും.',
      english: 'Shave or trim — this brings the first (partial) release from ihram.',
    },
    instructions: [],
  },
  {
    ritualType: 'hajj',
    stepNumber: 8,
    order: 7,
    iconEmoji: '🔄',
    hasTawafLink: true,
    hasSaiLink: true,
    title: { malayalam: 'ത്വവാഫുൽ ഇഫാദ', english: 'Tawaf al-Ifadah', arabic: 'طواف الإفاضة' },
    description: {
      malayalam: 'മക്കയിലേക്ക് മടങ്ങി ത്വവാഫുൽ ഇഫാദയും സഅ്‌യും നിർവഹിക്കുക.',
      english: 'Return to Makkah for Tawaf al-Ifadah followed by Sai.',
    },
    instructions: [
      { malayalam: 'ഇത് ഹജ്ജിന്റെ റുക്‌നാണ്; ഒഴിവാക്കാൻ പാടില്ല.', english: 'This is a pillar of Hajj and cannot be skipped.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 9,
    order: 8,
    iconEmoji: '⛺',
    title: { malayalam: 'അയ്യാമുത്തശ്‌രീഖ്', english: 'Days of Tashriq — 11-13 Dhul Hijjah', arabic: 'أيام التشريق' },
    description: {
      malayalam: 'മിനയിൽ താമസിച്ച് മൂന്ന് ജംറകളിലും ദിവസവും കല്ലെറിയുക.',
      english: 'Stay in Mina and stone all three Jamarat each day.',
    },
    instructions: [
      { malayalam: 'ഓരോ ജംറയിലും ഏഴ് കല്ലുകൾ വീതം എറിയുക.', english: 'Seven pebbles at each Jamarah.' },
      { malayalam: 'ളുഹ്‌റിന് ശേഷമാണ് കല്ലേറിന്റെ സമയം.', english: 'The stoning time begins after Dhuhr.' },
    ],
  },
  {
    ritualType: 'hajj',
    stepNumber: 10,
    order: 9,
    iconEmoji: '👋',
    title: { malayalam: 'ത്വവാഫുൽ വിദാഅ്', english: 'Farewell Tawaf', arabic: 'طواف الوداع' },
    description: {
      malayalam: 'മക്ക വിടുന്നതിന് മുൻപ് അവസാനമായി ഏഴ് ചുറ്റ് ത്വവാഫ് ചെയ്യുക.',
      english: 'Perform a final seven-circuit tawaf before leaving Makkah.',
    },
    instructions: [
      { malayalam: 'ആർത്തവമുള്ള സ്ത്രീകൾക്ക് ഇത് ഒഴിവാക്കാം.', english: 'Menstruating women are exempt.' },
    ],
  },
];

/* ------------------------------------------------------------------ duas */

export const duas = [
  {
    category: 'ihram',
    ritualType: 'umrah',
    order: 0,
    title: { malayalam: 'ഉംറയുടെ നിയ്യത്ത്', english: 'Intention for Umrah' },
    arabicText: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً',
    transliteration: { malayalam: 'ലബ്ബൈക്കല്ലാഹുമ്മ ഉംറത്തൻ', english: 'Labbayka Allahumma Umratan' },
    meaning: { malayalam: 'അല്ലാഹുവേ, ഉംറയ്ക്കായി ഞാൻ നിനക്ക് ഉത്തരം നൽകുന്നു.', english: 'O Allah, here I am for Umrah.' },
    _step: { ritualType: 'umrah', stepNumber: 1 },
  },
  {
    category: 'talbiyah',
    ritualType: 'both',
    order: 1,
    title: { malayalam: 'തൽബിയത്ത്', english: 'Talbiyah' },
    arabicText:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration: {
      malayalam: 'ലബ്ബൈക്കല്ലാഹുമ്മ ലബ്ബൈക്ക്, ലബ്ബൈക്ക ലാ ശരീക്ക ലക ലബ്ബൈക്ക്, ഇന്നൽ ഹംദ വന്നിഅ്മത്ത ലക വൽമുൽക്ക്, ലാ ശരീക്ക ലക്',
      english: 'Labbayka Allahumma labbayk, labbayka la sharika laka labbayk...',
    },
    meaning: {
      malayalam: 'അല്ലാഹുവേ, ഞാൻ ഹാജരായിരിക്കുന്നു. നിനക്ക് പങ്കുകാരില്ല. സ്തുതിയും അനുഗ്രഹവും ആധിപത്യവും നിനക്കുള്ളതാണ്.',
      english: 'Here I am, O Allah. You have no partner. All praise, blessing and dominion belong to You.',
    },
    _step: { ritualType: 'umrah', stepNumber: 2 },
  },
  {
    category: 'tawaf',
    ritualType: 'both',
    order: 2,
    title: { malayalam: 'ഹജറുൽ അസ്‌വദിന് നേരെ', english: 'Facing the Black Stone' },
    arabicText: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: { malayalam: 'ബിസ്മില്ലാഹി വല്ലാഹു അക്ബർ', english: 'Bismillahi wallahu akbar' },
    meaning: { malayalam: 'അല്ലാഹുവിന്റെ നാമത്തിൽ, അല്ലാഹു ഏറ്റവും വലിയവൻ.', english: 'In the name of Allah, and Allah is the Greatest.' },
    _step: { ritualType: 'umrah', stepNumber: 3 },
  },
  {
    category: 'tawaf',
    ritualType: 'both',
    order: 3,
    title: { malayalam: 'റുക്‌നുൽ യമാനിക്കും ഹജറുൽ അസ്‌വദിനും ഇടയിൽ', english: 'Between Rukn Yamani and the Black Stone' },
    arabicText: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: {
      malayalam: 'റബ്ബനാ ആതിനാ ഫിദ്ദുൻയാ ഹസനത്തൻ വഫിൽ ആഖിറത്തി ഹസനത്തൻ വഖിനാ അദാബന്നാർ',
      english: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
    },
    meaning: {
      malayalam: 'ഞങ്ങളുടെ രക്ഷിതാവേ, ഇഹത്തിലും പരത്തിലും നന്മ നൽകേണമേ, നരകശിക്ഷയിൽ നിന്ന് കാക്കേണമേ.',
      english: 'Our Lord, grant us good in this world and the next, and protect us from the punishment of the Fire.',
    },
    _step: { ritualType: 'umrah', stepNumber: 3 },
  },
  {
    category: 'sai',
    ritualType: 'both',
    order: 4,
    title: { malayalam: 'സഫയിൽ കയറുമ്പോൾ', english: 'On ascending Safa' },
    arabicText: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    transliteration: { malayalam: 'ഇന്നസ്സഫാ വൽമർവത്ത മിൻ ശആഇരില്ലാഹ്', english: 'Innas-safa wal-marwata min sha\'a\'irillah' },
    meaning: { malayalam: 'തീർച്ചയായും സഫയും മർവയും അല്ലാഹുവിന്റെ ചിഹ്നങ്ങളിൽ പെട്ടതാകുന്നു.', english: 'Indeed, Safa and Marwa are among the symbols of Allah.' },
    _step: { ritualType: 'umrah', stepNumber: 4 },
  },
  {
    category: 'zamzam',
    ritualType: 'both',
    order: 5,
    title: { malayalam: 'സംസം കുടിക്കുമ്പോൾ', english: 'When drinking Zamzam' },
    arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    transliteration: {
      malayalam: 'അല്ലാഹുമ്മ ഇന്നീ അസ്അലുക്ക ഇൽമൻ നാഫിഅൻ വരിസ്ഖൻ വാസിഅൻ വശിഫാഅൻ മിൻ കുല്ലി ദാഇൻ',
      english: 'Allahumma inni as\'aluka ilman nafi\'an wa rizqan wasi\'an wa shifa\'an min kulli da\'in',
    },
    meaning: {
      malayalam: 'അല്ലാഹുവേ, ഉപകാരപ്രദമായ അറിവും വിശാലമായ ഉപജീവനവും എല്ലാ രോഗത്തിൽ നിന്നുമുള്ള ശമനവും ഞാൻ നിന്നോട് ചോദിക്കുന്നു.',
      english: 'O Allah, I ask You for beneficial knowledge, abundant provision and healing from every illness.',
    },
  },
  {
    category: 'arafah',
    ritualType: 'hajj',
    order: 6,
    title: { malayalam: 'അറഫാ ദിനത്തിലെ ഉത്തമ ദുആ', english: 'The best supplication of Arafah' },
    arabicText:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: {
      malayalam: 'ലാ ഇലാഹ ഇല്ലല്ലാഹു വഹ്ദഹൂ ലാ ശരീക്ക ലഹ്, ലഹുൽ മുൽക്കു വലഹുൽ ഹംദു വഹുവ അലാ കുല്ലി ശയ്ഇൻ ഖദീർ',
      english: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay\'in qadir',
    },
    meaning: {
      malayalam: 'അല്ലാഹുവല്ലാതെ ആരാധ്യനില്ല, അവൻ ഏകനാണ്, അവന് പങ്കുകാരില്ല. ആധിപത്യവും സ്തുതിയും അവനുള്ളതാണ്, അവൻ എല്ലാത്തിനും കഴിവുള്ളവനാണ്.',
      english: 'There is no god but Allah alone, without partner. His is the dominion and the praise, and He has power over all things.',
    },
    _step: { ritualType: 'hajj', stepNumber: 3 },
  },
  {
    category: 'general',
    ritualType: 'both',
    order: 7,
    title: { malayalam: 'യാത്രാ ദുആ', english: 'Supplication for travel' },
    arabicText: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: {
      malayalam: 'സുബ്ഹാനല്ലദീ സഖ്ഖറ ലനാ ഹാദാ വമാ കുന്നാ ലഹൂ മുഖ്‌രിനീൻ വഇന്നാ ഇലാ റബ്ബിനാ ലമുൻഖലിബൂൻ',
      english: 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin...',
    },
    meaning: {
      malayalam: 'ഇത് ഞങ്ങൾക്ക് വിധേയമാക്കിത്തന്നവൻ എത്ര പരിശുദ്ധൻ. ഞങ്ങൾ ഞങ്ങളുടെ രക്ഷിതാവിലേക്ക് മടങ്ങുന്നവരാകുന്നു.',
      english: 'Glory to Him who subjected this to us, and to our Lord we shall surely return.',
    },
  },
];

/* ----------------------------------------------------------- guide topics */

export const guideTopics = [
  {
    slug: 'what-is-umrah',
    ritualType: 'umrah',
    order: 0,
    iconEmoji: '📖',
    mainTitle: { malayalam: 'ഉംറ എന്നാൽ എന്ത്?', english: 'What is Umrah?' },
    sessions: [
      {
        sessionTitle: { malayalam: 'ഉംറ', english: 'Umrah' },
        description: {
          malayalam:
            'വർഷത്തിൽ ഏത് സമയത്തും നിർവഹിക്കാവുന്ന ഒരു ആരാധനയാണ് ഉംറ. ഇത് നാല് പ്രധാന കർമ്മങ്ങൾ ഉൾക്കൊള്ളുന്നു:\n\n1. ## ഇഹ്‌റാം ## – മീഖാത്തിൽ വെച്ച് നിയ്യത്ത് ചെയ്യുക\n2. ## ത്വവാഫ് ## – കഅ്ബയെ ഏഴ് തവണ പ്രദക്ഷിണം ചെയ്യുക\n3. ## സഅ്‌യ് ## – സഫയ്ക്കും മർവയ്ക്കും ഇടയിൽ ഏഴ് തവണ നടക്കുക\n4. ## ഹൽഖ് / തഖ്‌സീർ ## – മുടി മുണ്ഡനം ചെയ്യുകയോ വെട്ടുകയോ ചെയ്യുക',
          english:
            'Umrah can be performed at any time of the year. It consists of four core acts:\n\n1. ## Ihram ## – make the intention at the miqat\n2. ## Tawaf ## – seven circuits of the Kaaba\n3. ## Sai ## – seven legs between Safa and Marwa\n4. ## Halq or Taqsir ## – shaving or trimming the hair',
        },
      },
      {
        // No sessionTitle — a session can be a standalone description.
        description: {
          malayalam: 'ഹജ്ജിൽ നിന്ന് വ്യത്യസ്തമായി ഉംറയ്ക്ക് നിശ്ചിത ദിവസങ്ങളില്ല.',
          english: 'Unlike Hajj, Umrah is not tied to specific days.',
        },
      },
    ],
  },
  {
    slug: 'ihram-rules',
    ritualType: 'both',
    order: 1,
    iconEmoji: '🧣',
    mainTitle: { malayalam: 'ഇഹ്‌റാമിന്റെ നിയമങ്ങൾ', english: 'Rules of Ihram' },
    sessions: [
      {
        sessionTitle: { malayalam: 'വിലക്കപ്പെട്ട കാര്യങ്ങൾ', english: 'Prohibitions' },
        description: {
          malayalam:
            'സുഗന്ധദ്രവ്യങ്ങൾ ഉപയോഗിക്കൽ\nമുടിയോ നഖമോ നീക്കൽ\nവേട്ടയാടൽ\nവിവാഹം കഴിക്കലും കഴിപ്പിക്കലും\nദാമ്പത്യ ബന്ധം\nപുരുഷൻമാർക്ക്: തുന്നിയ വസ്ത്രം, തലമറയ്ക്കൽ\nസ്ത്രീകൾക്ക്: മുഖം മറയ്ക്കൽ, കയ്യുറ ധരിക്കൽ',
          english:
            'Using perfume\nRemoving hair or nails\nHunting\nContracting a marriage\nMarital relations\nMen: stitched clothing, covering the head\nWomen: covering the face, wearing gloves',
        },
      },
      {
        sessionTitle: { malayalam: 'അനുവദനീയമായവ', english: 'Permitted' },
        description: {
          malayalam: 'കുളിക്കൽ, ചെരുപ്പ് ധരിക്കൽ, കണ്ണട, മോതിരം, ബെൽറ്റ് എന്നിവ ഉപയോഗിക്കൽ അനുവദനീയമാണ്.',
          english: 'Bathing, wearing sandals, glasses, a ring or a belt are all permitted.',
        },
      },
    ],
  },
  {
    slug: 'haram-etiquette',
    ritualType: 'both',
    order: 2,
    iconEmoji: '🕌',
    mainTitle: { malayalam: 'മസ്ജിദുൽ ഹറാമിലെ മര്യാദകൾ', english: 'Etiquette in Masjid al-Haram' },
    sessions: [
      {
        sessionTitle: { malayalam: 'മര്യാദകൾ', english: 'Adab' },
        description: {
          malayalam:
            'വലതു കാൽ വെച്ച് പള്ളിയിൽ പ്രവേശിക്കുകയും പ്രവേശന ദുആ ചൊല്ലുകയും ചെയ്യുക\nമറ്റുള്ളവരെ ബുദ്ധിമുട്ടിക്കാതിരിക്കുക; തിരക്കിൽ ക്ഷമ കാണിക്കുക\nശബ്ദം താഴ്ത്തുക, ഫോൺ നിശ്ശബ്ദമാക്കുക\nഹജറുൽ അസ്‌വദിൽ സ്പർശിക്കാൻ ആരെയും തള്ളിമാറ്റരുത്\nവൃത്തി പാലിക്കുക, മാലിന്യം വലിച്ചെറിയരുത്',
          english:
            'Enter with the right foot and recite the entry supplication\nDo not crowd or push others; be patient in the crush\nKeep your voice low and your phone silent\nNever shove anyone aside to touch the Black Stone\nKeep the space clean',
        },
      },
    ],
  },
];

/* ------------------------------------------------------------ tawaf duas */

const tawafBetweenCorners = {
  arabicText: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  transliteration: {
    malayalam: 'റബ്ബനാ ആതിനാ ഫിദ്ദുൻയാ ഹസനത്തൻ വഫിൽ ആഖിറത്തി ഹസനത്തൻ വഖിനാ അദാബന്നാർ',
    english: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
  },
  meaning: {
    malayalam: 'ഓരോ ചുറ്റിനും പ്രത്യേക ദുആ നിർബന്ധമില്ല. റുക്‌നുൽ യമാനിക്കും ഹജറുൽ അസ്‌വദിനും ഇടയിൽ ഈ ദുആ ചൊല്ലുന്നത് സുന്നത്താണ്.',
    english:
      'No specific dua is required for each circuit. Reciting this between Rukn Yamani and the Black Stone is the established sunnah.',
  },
};

export const tawafDuas = [
  {
    roundNumber: 'start',
    order: 0,
    label: { malayalam: 'ത്വവാഫ് ആരംഭിക്കുമ്പോൾ', english: 'Starting the tawaf' },
    arabicText: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: { malayalam: 'ബിസ്മില്ലാഹി വല്ലാഹു അക്ബർ', english: 'Bismillahi wallahu akbar' },
    meaning: {
      malayalam: 'ഹജറുൽ അസ്‌വദിന് നേരെ തിരിഞ്ഞ് ഇത് ചൊല്ലി ഓരോ ചുറ്റും ആരംഭിക്കുക.',
      english: 'Face the Black Stone and say this to begin each circuit.',
    },
  },
  ...Array.from({ length: 7 }, (_, index) => ({
    roundNumber: String(index + 1),
    order: index + 1,
    label: { malayalam: `${index + 1}-ാം ചുറ്റ്`, english: `Round ${index + 1}` },
    ...tawafBetweenCorners,
  })),
  {
    roundNumber: 'end',
    order: 8,
    label: { malayalam: 'ത്വവാഫിന് ശേഷം', english: 'After the tawaf' },
    arabicText: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
    transliteration: { malayalam: 'വത്തഖിദൂ മിൻ മഖാമി ഇബ്‌റാഹീമ മുസ്വല്ലാ', english: 'Wattakhidhu min maqami Ibrahima musalla' },
    meaning: {
      malayalam: 'മഖാമു ഇബ്രാഹീമിന് പിന്നിൽ രണ്ട് റക്അത്ത് നമസ്കരിക്കുക, ശേഷം സംസം കുടിക്കുക.',
      english: 'Pray two rakats behind Maqam Ibrahim, then drink Zamzam.',
    },
  },
];

/* -------------------------------------------------------------- sai duas */

const saiGeneral = {
  arabicText: 'رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
  transliteration: {
    malayalam: 'റബ്ബിഗ്ഫിർ വർഹം ഇന്നക്ക അൻതൽ അഅസ്സുൽ അക്‌റം',
    english: 'Rabbighfir warham innaka antal-a\'azzul-akram',
  },
  meaning: {
    malayalam: 'എന്റെ രക്ഷിതാവേ, പൊറുക്കുകയും കരുണ കാണിക്കുകയും ചെയ്യേണമേ. നീ തന്നെയാണ് ഏറ്റവും പ്രതാപവാനും ഉദാരനും.',
    english: 'My Lord, forgive and have mercy. You are the Most Mighty, the Most Generous.',
  },
};

export const saiDuas = Array.from({ length: 7 }, (_, index) => {
  const leg = index + 1;
  const toMarwa = leg % 2 === 1;
  return {
    leg,
    order: index,
    direction: toMarwa ? 'safa-marwa' : 'marwa-safa',
    label: {
      malayalam: toMarwa ? `${leg}: സഫയിൽ നിന്ന് മർവയിലേക്ക്` : `${leg}: മർവയിൽ നിന്ന് സഫയിലേക്ക്`,
      english: toMarwa ? `${leg}: Safa to Marwa` : `${leg}: Marwa to Safa`,
    },
    ...(leg === 1
      ? {
          arabicText: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
          transliteration: { malayalam: 'ഇന്നസ്സഫാ വൽമർവത്ത മിൻ ശആഇരില്ലാഹ്', english: 'Innas-safa wal-marwata min sha\'a\'irillah' },
          meaning: {
            malayalam: 'സഫയിൽ കയറി ഖിബ്‌ലയ്ക്ക് അഭിമുഖമായി നിന്ന് ഇത് ചൊല്ലി സഅ്‌യ് ആരംഭിക്കുക.',
            english: 'Ascend Safa, face the qiblah and begin the sai with this verse.',
          },
        }
      : saiGeneral),
  };
});

/* ------------------------------------------------------------- checklist */

export const checklistCategories = [
  {
    categoryKey: 'documents',
    order: 0,
    iconEmoji: '📄',
    name: { malayalam: 'രേഖകൾ', english: 'Documents' },
    items: [
      { key: 'passport', order: 0, iconEmoji: '🛂', title: { malayalam: 'പാസ്‌പോർട്ട്', english: 'Passport' } },
      { key: 'visa', order: 1, iconEmoji: '📝', title: { malayalam: 'വിസ', english: 'Visa' } },
      { key: 'tickets', order: 2, iconEmoji: '✈️', title: { malayalam: 'വിമാന ടിക്കറ്റ്', english: 'Flight tickets' } },
      { key: 'vaccination-card', order: 3, iconEmoji: '💉', title: { malayalam: 'വാക്‌സിനേഷൻ കാർഡ്', english: 'Vaccination card' } },
      { key: 'photo-copies', order: 4, iconEmoji: '🖨️', title: { malayalam: 'രേഖകളുടെ പകർപ്പുകൾ', english: 'Copies of documents' } },
    ],
  },
  {
    categoryKey: 'ihram-clothing',
    order: 1,
    iconEmoji: '🧣',
    name: { malayalam: 'ഇഹ്‌റാമും വസ്ത്രവും', english: 'Ihram & clothing' },
    items: [
      { key: 'ihram-set', order: 0, iconEmoji: '🤍', title: { malayalam: 'ഇഹ്‌റാം വസ്ത്രം (2 സെറ്റ്)', english: 'Ihram garments (2 sets)' } },
      { key: 'ihram-belt', order: 1, iconEmoji: '🪢', title: { malayalam: 'ഇഹ്‌റാം ബെൽറ്റ്', english: 'Ihram belt' } },
      { key: 'sandals', order: 2, iconEmoji: '🩴', title: { malayalam: 'ചെരുപ്പ്', english: 'Sandals' } },
      { key: 'prayer-mat', order: 3, iconEmoji: '🧎', title: { malayalam: 'നമസ്കാര പായ', english: 'Prayer mat' } },
      { key: 'umbrella', order: 4, iconEmoji: '☂️', title: { malayalam: 'കുട', english: 'Umbrella' } },
    ],
  },
  {
    categoryKey: 'health',
    order: 2,
    iconEmoji: '💊',
    name: { malayalam: 'ആരോഗ്യം', english: 'Health' },
    items: [
      { key: 'prescription-medicine', order: 0, iconEmoji: '💊', title: { malayalam: 'സ്ഥിരം കഴിക്കുന്ന മരുന്നുകൾ', english: 'Prescription medicines' } },
      { key: 'first-aid', order: 1, iconEmoji: '🩹', title: { malayalam: 'പ്രഥമശുശ്രൂഷ കിറ്റ്', english: 'First aid kit' } },
      { key: 'sunscreen', order: 2, iconEmoji: '🧴', title: { malayalam: 'സൺസ്‌ക്രീൻ (സുഗന്ധമില്ലാത്തത്)', english: 'Unscented sunscreen' } },
      { key: 'water-bottle', order: 3, iconEmoji: '🚰', title: { malayalam: 'വെള്ളക്കുപ്പി', english: 'Water bottle' } },
    ],
  },
  {
    categoryKey: 'essentials',
    order: 3,
    iconEmoji: '🎒',
    name: { malayalam: 'അവശ്യ വസ്തുക്കൾ', english: 'Essentials' },
    items: [
      { key: 'phone-charger', order: 0, iconEmoji: '🔌', title: { malayalam: 'ഫോൺ ചാർജറും അഡാപ്റ്ററും', english: 'Phone charger & adapter' } },
      { key: 'power-bank', order: 1, iconEmoji: '🔋', title: { malayalam: 'പവർ ബാങ്ക്', english: 'Power bank' } },
      { key: 'cash-card', order: 2, iconEmoji: '💳', title: { malayalam: 'റിയാൽ / കാർഡ്', english: 'Riyals & card' } },
      { key: 'id-band', order: 3, iconEmoji: '📛', title: { malayalam: 'തിരിച്ചറിയൽ ബാൻഡ്', english: 'Identification band' } },
    ],
  },
];

/* ---------------------------------------------------- emergency contacts */

export const emergencyContacts = [
  {
    order: 0,
    country: 'SA',
    category: 'police',
    number: '911',
    iconEmoji: '🚨',
    name: { malayalam: 'ഏകീകൃത അടിയന്തര നമ്പർ', english: 'Unified emergency number' },
    description: { malayalam: 'മക്ക, മദീന, റിയാദ്, കിഴക്കൻ പ്രവിശ്യ എന്നിവിടങ്ങളിൽ.', english: 'Covers Makkah, Madinah, Riyadh and the Eastern Province.' },
  },
  {
    order: 1,
    country: 'SA',
    category: 'police',
    number: '999',
    iconEmoji: '👮',
    name: { malayalam: 'പോലീസ്', english: 'Police' },
    description: { malayalam: '911 ലഭ്യമല്ലാത്ത പ്രദേശങ്ങളിൽ.', english: 'For regions where 911 is not in service.' },
  },
  {
    order: 2,
    country: 'SA',
    category: 'ambulance',
    number: '997',
    iconEmoji: '🚑',
    name: { malayalam: 'റെഡ് ക്രസന്റ് ആംബുലൻസ്', english: 'Red Crescent ambulance' },
  },
  {
    order: 3,
    country: 'SA',
    category: 'fire',
    number: '998',
    iconEmoji: '🚒',
    name: { malayalam: 'സിവിൽ ഡിഫൻസ് / ഫയർ', english: 'Civil Defence / Fire' },
  },
  {
    order: 4,
    country: 'SA',
    category: 'other',
    number: '993',
    iconEmoji: '🚗',
    name: { malayalam: 'ട്രാഫിക് അപകടങ്ങൾ', english: 'Traffic accidents' },
  },
  {
    order: 5,
    country: 'IN',
    category: 'hajj-mission',
    number: '+000000000',
    iconEmoji: '🇮🇳',
    isPublished: false,
    name: { malayalam: 'ഇന്ത്യൻ ഹജ്ജ് മിഷൻ', english: 'Indian Hajj Mission' },
    description: {
      malayalam: 'നമ്പർ പൂരിപ്പിച്ച ശേഷം അഡ്മിൻ പാനലിൽ നിന്ന് പ്രസിദ്ധീകരിക്കുക.',
      english: 'Placeholder — fill in the real number in the admin panel, then publish.',
    },
  },
];

/* ---------------------------------------------------------------- categories */

export const categories = [
  { group: 'dua', key: 'ihram', order: 0, label: { malayalam: 'ഇഹ്‌റാം', english: 'Ihram' } },
  { group: 'dua', key: 'talbiyah', order: 1, label: { malayalam: 'തൽബിയത്ത്', english: 'Talbiyah' } },
  { group: 'dua', key: 'tawaf', order: 2, label: { malayalam: 'ത്വവാഫ്', english: 'Tawaf' } },
  { group: 'dua', key: 'zamzam', order: 3, label: { malayalam: 'സംസം', english: 'Zamzam' } },
  { group: 'dua', key: 'sai', order: 4, label: { malayalam: 'സഅ്‌യ്', english: "Sa'i" } },
  { group: 'dua', key: 'arafah', order: 5, label: { malayalam: 'അറഫ', english: 'Arafah' } },
  { group: 'dua', key: 'mina', order: 6, label: { malayalam: 'മിന', english: 'Mina' } },
  { group: 'dua', key: 'general', order: 7, label: { malayalam: 'പൊതുവായത്', english: 'General' } },
  { group: 'emergency-contact', key: 'police', order: 0, label: { malayalam: 'പോലീസ്', english: 'Police' } },
  { group: 'emergency-contact', key: 'ambulance', order: 1, label: { malayalam: 'ആംബുലൻസ്', english: 'Ambulance' } },
  { group: 'emergency-contact', key: 'fire', order: 2, label: { malayalam: 'ഫയർ', english: 'Fire' } },
  { group: 'emergency-contact', key: 'hajj-mission', order: 3, label: { malayalam: 'ഹജ്ജ് മിഷൻ', english: 'Hajj Mission' } },
  { group: 'emergency-contact', key: 'embassy', order: 4, label: { malayalam: 'എംബസി', english: 'Embassy' } },
  { group: 'emergency-contact', key: 'other', order: 5, label: { malayalam: 'മറ്റുള്ളവ', english: 'Other' } },
];

/* ---------------------------------------------------------- app settings */

export const appSettings = {
  highlightedRitual: 'umrah',
  announcementIsActive: false,
  announcement: {
    malayalam: 'ഹജ്ജ് & ഉംറ ഗൈഡിലേക്ക് സ്വാഗതം.',
    english: 'Welcome to the Hajj & Umrah Guide.',
  },
  quickActions: [
    { key: 'rituals', order: 0, iconEmoji: '🕋', route: '/rituals', label: { malayalam: 'കർമ്മങ്ങൾ', english: 'Rituals' } },
    { key: 'duas', order: 1, iconEmoji: '📿', route: '/duas', label: { malayalam: 'ദുആകൾ', english: 'Duas' } },
    { key: 'tawaf', order: 2, iconEmoji: '🔄', route: '/tawaf', label: { malayalam: 'ത്വവാഫ് കൗണ്ടർ', english: 'Tawaf counter' } },
    { key: 'checklist', order: 3, iconEmoji: '✅', route: '/checklist', label: { malayalam: 'ചെക്ക്‌ലിസ്റ്റ്', english: 'Checklist' } },
    { key: 'my-tent', order: 4, iconEmoji: '⛺', route: '/my-tent', label: { malayalam: 'എന്റെ ടെന്റ്', english: 'My tent' } },
    { key: 'sos', order: 5, iconEmoji: '🆘', route: '/sos', label: { malayalam: 'അടിയന്തര സഹായം', english: 'Emergency' } },
  ],
  banners: [],
  featureFlags: { groupActivity: false, pushNotifications: false, audioPlayer: true },
};

/* ---------------------------------------------------------- force update */

export const forceUpdates = [
  {
    platform: 'android',
    minVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://play.google.com/store/apps/details?id=co.d4dx.hajjguide',
    isMandatory: false,
    message: { malayalam: 'പുതിയ പതിപ്പ് ലഭ്യമാണ്.', english: 'A new version is available.' },
  },
  {
    platform: 'ios',
    minVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://apps.apple.com/app/id0000000000',
    isMandatory: false,
    message: { malayalam: 'പുതിയ പതിപ്പ് ലഭ്യമാണ്.', english: 'A new version is available.' },
  },
];
