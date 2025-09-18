import { db } from "../utils/db";
import { hash } from "@node-rs/argon2";
import { randomUUID } from "crypto";
// Import direct pour éviter les erreurs de résolution
const TagType = {
  GENRE: 'GENRE',
  TROPE: 'TROPE',  
  TRIGGER: 'TRIGGER',
  PERSONNALISE: 'PERSONNALISE'
} as const;

const BookStatus = {
  LU: 'LU',
  EN_COURS: 'EN_COURS',
  A_LIRE: 'A_LIRE'
} as const;

const BookRhythm = {
  SLOW_BURN: 'SLOW_BURN',
  MEDIUM_BURN: 'MEDIUM_BURN',
  FAST_PACE: 'FAST_PACE',
  INSTA_LOVE: 'INSTA_LOVE'
} as const;

const SagaStatus = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  HIATUS: 'HIATUS',
  UNKNOWN: 'UNKNOWN'
} as const;

async function createUsers() {
  console.log("👥 Creating users...");
  
  // Admin user
  const hashedPasswordAdmin = await hash("admin123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  const admin = await db.user.upsert({
    where: { email: "bruna@booky.dev" },
    update: {},
    create: {
      id: randomUUID(),
      email: "bruna@booky.dev",
      password: hashedPasswordAdmin,
      nom_complet: "Bruna",
      role: "ADMIN",
      emailVerified: true,
      date_modification: new Date(),
    },
  });

  // Regular users
  const hashedPasswordUser = await hash("user123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  const users = [
    { id: randomUUID(),
      email: "sarah.martin@email.com",
      nom_complet: "Sarah Martin",
      avatar: null
    },
    { id: randomUUID(),
      email: "emma.dubois@email.com", 
      nom_complet: "Emma Dubois",
      avatar: null
    },
    { id: randomUUID(),
      email: "julie.rousseau@email.com",
      nom_complet: "Julie Rousseau", 
      avatar: null
    },
    { id: randomUUID(),
      email: "marie.lambert@email.com",
      nom_complet: "Marie Lambert",
      avatar: null
    },
    { id: randomUUID(),
      email: "claire.moreau@email.com",
      nom_complet: "Claire Moreau",
      avatar: null
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await db.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPasswordUser,
        role: "USER",
        emailVerified: true,
        date_modification: new Date(),
      },
    });
    createdUsers.push(user);
  }
  
  console.log(`✅ Created 1 admin + ${users.length} regular users`);
  return { admin, users: createdUsers };
}

async function createDefaultCategories() {
  console.log("🏷️ Creating default categories...");
  
  const categories = [
    { id: randomUUID(),
      nom: "Dark Romance",
      couleur: "#8B0000",
      icone: "💀",
      description: "Romans sombres et passionnés avec des thèmes matures",
      ordre_affichage: 1,
    },
    { id: randomUUID(),
      nom: "Spicy Romance",
      couleur: "#DC143C",
      icone: "🌶️",
      description: "Romans romantiques avec des scènes explicites",
      ordre_affichage: 2,
    },
    { id: randomUUID(),
      nom: "Contemporary Romance",
      couleur: "#6A0DAD",
      icone: "💜",
      description: "Romans romantiques contemporains",
      ordre_affichage: 3,
    },
    { id: randomUUID(),
      nom: "Fantasy Romance",
      couleur: "#4B0082",
      icone: "🔮",
      description: "Romans fantastiques avec une intrigue romantique",
      ordre_affichage: 4,
    },
    { id: randomUUID(),
      nom: "Gothic Romance",
      couleur: "#2E0854",
      icone: "🏰",
      description: "Romans gothiques sombres et mystérieux",
      ordre_affichage: 5,
    },
  ];

  for (const category of categories) {
    await db.category.upsert({
      where: { nom: category.nom },
      update: {},
      create: {
        ...category,
        date_modification: new Date(),
      },
    });
  }
  
  console.log(`✅ Created ${categories.length} default categories`);
}

async function createDefaultTags() {
  console.log("🏷️ Creating default tags...");
  
  const tags = [
    // Tropes populaires
    { nom: "Enemies to Lovers", couleur: "#8B0000", type: TagType.TROPE },
    { nom: "Age Gap", couleur: "#DC143C", type: TagType.TROPE },
    { nom: "Reverse Harem", couleur: "#6A0DAD", type: TagType.TROPE },
    { nom: "Mafia Romance", couleur: "#8B0000", type: TagType.TROPE },
    { nom: "Bully Romance", couleur: "#2E0854", type: TagType.TROPE },
    { nom: "Professor/Student", couleur: "#4B0082", type: TagType.TROPE },
    { nom: "Brother's Best Friend", couleur: "#DC143C", type: TagType.TROPE },
    { nom: "Second Chance", couleur: "#6A0DAD", type: TagType.TROPE },
    
    // Genres
    { nom: "Paranormal", couleur: "#2E0854", type: TagType.GENRE },
    { nom: "Historical", couleur: "#4B0082", type: TagType.GENRE },
    { nom: "Urban Fantasy", couleur: "#6A0DAD", type: TagType.GENRE },
    { nom: "Sci-Fi Romance", couleur: "#8B0000", type: TagType.GENRE },
    
    // Triggers/Avertissements
    { nom: "Violence", couleur: "#8B0000", type: TagType.TRIGGER },
    { nom: "Non-con", couleur: "#2E0854", type: TagType.TRIGGER },
    { nom: "Dubcon", couleur: "#4B0082", type: TagType.TRIGGER },
    { nom: "Death of Parent", couleur: "#DC143C", type: TagType.TRIGGER },
  ];

  for (const tag of tags) {
    await db.tag.upsert({
      where: { nom: tag.nom },
      update: {},
      create: {
        id: randomUUID(),
        ...tag,
        date_modification: new Date(),
      },
    });
  }
  
  console.log(`✅ Created ${tags.length} default tags`);
}

async function createDefaultSagas() {
  console.log("📚 Creating default sagas...");
  
  const sagas = [
    {
      id: randomUUID(),
      name: "Twisted Series",
      slug: "twisted-series",
      description: "Une série de dark romance contemporaine suivant quatre couples liés par l'amitié et les secrets. Chaque livre peut se lire indépendamment mais gagne à être lu dans l'ordre.",
      status: SagaStatus.ONGOING,
    },
    {
      id: randomUUID(),
      name: "Cat and Mouse Duet",
      slug: "cat-and-mouse-duet",
      description: "Un duet dark romance intense suivant Adeline et Zade dans une histoire de stalker romance très sombre. Attention aux triggers ! Les deux livres doivent absolument être lus dans l'ordre.",
      status: SagaStatus.COMPLETED,
    },
    {
      id: randomUUID(),
      name: "Beach Read Universe",
      slug: "beach-read-universe",
      description: "Les romans standalone d'Emily Henry qui, bien qu'indépendants, partagent le même univers de romances contemporaines feel-good parfaites pour l'été.",
      status: SagaStatus.ONGOING,
    },
  ];

  const createdSagas = [];
  for (const saga of sagas) {
    const createdSaga = await db.saga.upsert({
      where: { slug: saga.slug },
      update: {},
      create: {
        ...saga,
        updatedAt: new Date(),
      },
    });
    createdSagas.push(createdSaga);
  }
  
  console.log(`✅ Created ${sagas.length} default sagas`);
  return createdSagas;
}

async function createBooks(adminUser: any, categories: any[], tags: any[], sagas: any[]) {
  console.log("📚 Creating books...");
  
  // Référencer les sagas pour l'assignation
  const twistedSaga = sagas.find(s => s.slug === "twisted-series");
  const catMouseSaga = sagas.find(s => s.slug === "cat-and-mouse-duet");
  const beachReadSaga = sagas.find(s => s.slug === "beach-read-universe");
  
  const books = [
    { id: randomUUID(),
      titre: "Twisted Love",
      auteur: "Ana Huang",
      isbn: "9781728231792",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/71hL%2BhC%2BSHL.jpg",
      resume_officiel: "Alex Volkov is a devil blessed with the face of an angel and cursed with a past he can't escape. Driven by a tragedy that has shaped the last decade of his life, his ruthless pursuits for success and vengeance leave little room for moral ambiguity. Until Ava Chen enters his life.",
      editeur: "Bloom Books",
      date_publication: new Date("2021-04-13"),
      nombre_pages: 324,
      langue: "EN",
      date_lecture: new Date("2024-01-15"),
      statut: BookStatus.LU,
      note_generale: 9,
      niveau_spicy: 8,
      niveau_dark: 7,
      niveau_romance: 9,
      intensite_emotionnelle: 8,
      danger: 6,
      violence: 5,
      originalite: 7,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Un page-turner absolu ! Ana Huang maîtrise parfaitement l'art du slow burn avec des personnages complexes et attachants.",
      critique_detaillee: "Ce livre m'a littéralement tenue en haleine ! Alex Volkov est le bad boy parfait : mystérieux, torturé et irrésistiblement attirant. Ava apporte la douceur nécessaire pour équilibrer son côté sombre. L'intrigue est bien menée avec des révélations qui surprennent. Les scènes spicy sont parfaitement dosées et s'intègrent naturellement à l'histoire. Un must-read pour les amatrices de dark romance !",
      citations_favorites: "\"I don't believe in love, but I believe in you.\" - Une phrase qui résume parfaitement l'évolution d'Alex tout au long du livre.",
      pourquoi_aimer: "Si vous aimez les bad boys torturés qui cachent un cœur tendre, les héroïnes fortes mais vulnérables, et les histoires d'amour interdites, ce livre est fait pour vous !",
      questions_sur_le_livre: "L'évolution psychologique d'Alex est-elle crédible ? Comment Ana réussit-elle à percer ses défenses ? La fin vous a-t-elle satisfaite ?",
      recommandation_personnalisee: "Parfait pour débuter dans la dark romance. Pas trop sombre, juste ce qu'il faut de tension et une romance addictive.",
      createdBy: adminUser.id,
      sagaId: twistedSaga?.id || null,
      sagaOrder: twistedSaga ? 1 : null,
    },
    { id: randomUUID(),
      titre: "Hunting Adeline",
      auteur: "H.D. Carlton",
      isbn: "9781736003213",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/81qR%2BkqE6HL.jpg", 
      resume_officiel: "The conclusion to the Cat and Mouse Duet is here... Adeline and Zade's story concludes in Hunting Adeline, the sequel to the viral TikTok sensation, Haunting Adeline.",
      editeur: "Self Published",
      date_publication: new Date("2022-03-15"),
      nombre_pages: 565,
      langue: "EN",
      date_lecture: new Date("2024-02-03"),
      statut: BookStatus.LU,
      note_generale: 8,
      niveau_spicy: 9,
      niveau_dark: 10,
      niveau_romance: 7,
      intensite_emotionnelle: 9,
      danger: 9,
      violence: 8,
      originalite: 8,
      rythme: BookRhythm.FAST_PACE,
      resume_personnel: "Une suite intense qui pousse les limites. Attention aux triggers, ce n'est pas pour les âmes sensibles !",
      critique_detaillee: "H.D. Carlton n'y va pas de main morte dans cette suite ! L'histoire devient beaucoup plus sombre et mature. Les thèmes abordés sont lourds (trafic humain, violence) mais traités avec respect. Zade reste ce héros moralement gris qu'on aime détester. Adeline montre une force remarquable face aux épreuves. C'est un livre qui marque, pour le meilleur et pour le pire. Les scènes spicy sont torrides mais s'intègrent dans une intrigue prenante.",
      citations_favorites: "\"I am both predator and prey, hunter and hunted. I am everything and nothing all at once.\"",
      pourquoi_aimer: "Pour les lectrices qui aiment être chamboulées, qui n'ont pas peur des sujets difficiles et qui apprécient les héros anti-héros avec une morale douteuse.",
      questions_sur_le_livre: "Comment gérer les triggers présents dans ce livre ? Zade est-il un héros ou un anti-héros ? La fin justifie-t-elle les moyens ?",
      recommandation_personnalisee: "À réserver aux lectrices expérimentées en dark romance. Vérifiez les trigger warnings avant de vous lancer !",
      createdBy: adminUser.id,
      sagaId: catMouseSaga?.id || null,
      sagaOrder: catMouseSaga ? 2 : null,
    },
    { id: randomUUID(),
      titre: "Beach Read",
      auteur: "Emily Henry",
      isbn: "9780451491893",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/71Q%2BdWZqpjL.jpg",
      resume_officiel: "Two rival writers who no longer believe in happily ever after must work together on a writing project that may just give them their own happy ending.",
      editeur: "Berkley",
      date_publication: new Date("2020-05-19"),
      nombre_pages: 352,
      langue: "EN", 
      date_lecture: null,
      statut: BookStatus.A_LIRE,
      note_generale: 8,
      niveau_spicy: 4,
      niveau_dark: 2,
      niveau_romance: 9,
      intensite_emotionnelle: 6,
      danger: 1,
      violence: 1,
      originalite: 8,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Emily Henry a l'art de créer des histoires feel-good avec de la profondeur. Parfait pour l'été !",
      critique_detaillee: "Un roman contemporain rafraîchissant ! January et Gus sont des personnages attachants avec leurs défauts et leurs blessures. L'intrigue du défi d'écriture est originale et bien menée. Emily Henry excelle dans les dialogues pleins d'esprit et les situations du quotidien qui sonnent juste. C'est le genre de livre qui vous fait sourire et vous réchauffe le cœur. Parfait pour une lecture détente sans prise de tête.",
      citations_favorites: "\"Maybe the best we can hope for is to end up with the right person to weather the shitstorms with.\"",
      pourquoi_aimer: "Si vous cherchez une romance feel-good, des personnages attachants, de l'humour et une intrigue originale, foncez !",
      questions_sur_le_livre: "L'évolution de la relation entre January et Gus vous a-t-elle convaincue ? Les défis d'écriture ajoutent-ils à l'histoire ?",
      recommandation_personnalisee: "Idéal pour les lectrices qui veulent découvrir la romance contemporaine ou qui cherchent une pause dans la dark romance.",
      createdBy: adminUser.id,
      sagaId: beachReadSaga?.id || null,
      sagaOrder: beachReadSaga ? 1 : null,
    },
    { id: randomUUID(),
      titre: "The Seven Husbands of Evelyn Hugo",
      auteur: "Taylor Jenkins Reid",
      isbn: "9781501161933",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/81Q%2BdWZqpjL.jpg",
      resume_officiel: "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.",
      editeur: "Atria Books",
      date_publication: new Date("2017-06-13"),
      nombre_pages: 400,
      langue: "EN",
      date_lecture: new Date("2024-01-28"),
      statut: BookStatus.LU,
      note_generale: 10,
      niveau_spicy: 5,
      niveau_dark: 6,
      niveau_romance: 8,
      intensite_emotionnelle: 10,
      danger: 3,
      violence: 2,
      originalite: 9,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Un chef-d'œuvre absolu ! Ce livre m'a fait passer par toutes les émotions possibles.",
      critique_detaillee: "Taylor Jenkins Reid signe ici un roman magistral ! Evelyn Hugo est un personnage fascinant, complexe et humain malgré ses défauts. L'histoire nous emmène à travers les décennies, dévoilant peu à peu les secrets d'une vie extraordinaire. La plume est addictive, les retournements de situation parfaitement amenés. Ce livre interroge sur l'amour, la célébrité, les sacrifices et l'authenticité. La fin m'a littéralement coupé le souffle ! Un incontournable.",
      citations_favorites: "\"Never let anyone make you feel ordinary.\" - Une leçon de vie signée Evelyn Hugo.",
      pourquoi_aimer: "Pour une histoire captivante, des personnages inoubliables, une intrigue parfaitement construite et des émotions intenses.",
      questions_sur_le_livre: "Evelyn était-elle justifiée dans ses choix ? Que pensez-vous de la révélation finale ? Monique était-elle naïve ?",
      recommandation_personnalisee: "Un must-read absolu ! Accessible à tous les publics, ce livre plaira même aux non-lectrices habituelles de romance.",
      createdBy: adminUser.id,
    },
    { id: randomUUID(),
      titre: "It Ends with Us",
      auteur: "Colleen Hoover",
      isbn: "9781501110368",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/71hL%2BhC%2BSHL.jpg",
      resume_officiel: "A powerful story about the courage it takes to break the cycle of domestic violence and the healing power of love.",
      editeur: "Atria Books", 
      date_publication: new Date("2016-08-02"),
      nombre_pages: 384,
      langue: "EN",
      date_lecture: new Date("2024-01-10"),
      statut: BookStatus.LU,
      note_generale: 9,
      niveau_spicy: 6,
      niveau_dark: 8,
      niveau_romance: 8,
      intensite_emotionnelle: 10,
      danger: 7,
      violence: 7,
      originalite: 7,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Un livre nécessaire et bouleversant sur un sujet difficile mais important.",
      critique_detaillee: "Colleen Hoover aborde avec finesse un sujet délicat : la violence conjugale. Lily est une héroïne forte mais réaliste dans ses choix difficiles. Ryle est un personnage complexe qui évite la caricature. L'histoire entre Lily et Atlas apporte de la douceur. Ce livre fait réfléchir sur les cycles de violence, l'amour toxique vs l'amour sain. Emotional rollercoaster garanti ! Attention aux triggers sur violence domestique.",
      citations_favorites: "\"Just because someone hurts you doesn't mean you can simply stop loving them. It's not a person's actions that hurt the most. It's the love.\"",
      pourquoi_aimer: "Pour une histoire qui fait réfléchir, des personnages nuancés et un message important sur les relations toxiques.",
      questions_sur_le_livre: "Les choix de Lily vous ont-ils semblé réalistes ? Comment avez-vous perçu l'évolution de Ryle ? Le message du livre vous a-t-il touchée ?",
      recommandation_personnalisee: "Important à lire pour comprendre les mécanismes de la violence conjugale. Peut être déclencheur pour certaines lectrices.",
      createdBy: adminUser.id,
    },
    
    // Livres supplémentaires pour compléter les sagas
    { id: randomUUID(),
      titre: "Haunting Adeline",
      auteur: "H.D. Carlton", 
      isbn: "9781736003206",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/71xK%2BdWZqpjL.jpg",
      resume_officiel: "The first book in the Cat and Mouse Duet. The house has been vacant for over ten years, but a new owner has taken it over and disturbing events begin to unfold.",
      editeur: "Self Published",
      date_publication: new Date("2021-10-15"),
      nombre_pages: 458,
      langue: "EN",
      date_lecture: new Date("2024-02-01"),
      statut: BookStatus.LU,
      note_generale: 8,
      niveau_spicy: 9,
      niveau_dark: 9,
      niveau_romance: 8,
      intensite_emotionnelle: 9,
      danger: 8,
      violence: 7,
      originalite: 9,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Le début d'un duet intense ! Zade est fascinant dès le premier chapitre.",
      critique_detaillee: "H.D. Carlton pose les bases d'une histoire troublante et captivante. Adeline est une héroïne forte qui découvre des secrets dans la maison de sa grand-mère. Zade, le mystérieux stalker, est à la fois terrifiant et irrésistible. L'atmosphère gothique est parfaitement rendue. Attention, c'est du stalker romance assumé avec des thèmes matures. La fin en cliffhanger donne envie de lire la suite immédiatement !",
      citations_favorites: "\"I want to corrupt you in the most beautiful way possible.\"",
      pourquoi_aimer: "Pour l'atmosphère unique, le mystère, les personnages complexes et l'intrigue addictive.",
      questions_sur_le_livre: "Peut-on séparer la fascination de la peur ? Zade franchit-il la ligne rouge ? L'atmosphère gothique vous a-t-elle plu ?",
      recommandation_personnalisee: "Premier tome indispensable d'un duet intense. À lire avant Hunting Adeline !",
      createdBy: adminUser.id,
      sagaId: catMouseSaga?.id || null,
      sagaOrder: catMouseSaga ? 1 : null,
    },
    
    { id: randomUUID(),
      titre: "Twisted Games",
      auteur: "Ana Huang",
      isbn: "9781728231808",
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/81Q%2BdWZqpjL.jpg",
      resume_officiel: "She can never be his...but she's the only one he wants. A princess who's used to being in the spotlight and a bodyguard who's more comfortable in the shadows.",
      editeur: "Bloom Books",
      date_publication: new Date("2021-08-10"),
      nombre_pages: 336,
      langue: "EN",
      date_lecture: new Date("2024-02-15"),
      statut: BookStatus.LU,
      note_generale: 9,
      niveau_spicy: 8,
      niveau_dark: 6,
      niveau_romance: 9,
      intensite_emotionnelle: 8,
      danger: 5,
      violence: 4,
      originalite: 7,
      rythme: BookRhythm.SLOW_BURN,
      resume_personnel: "Rhys et Bridget, une histoire de princesse et garde du corps absolument addictive !",
      critique_detaillee: "Ana Huang frappe encore fort avec ce deuxième tome ! Rhys est le garde du corps parfait : protecteur, mystérieux et irrésistiblement attirant. Bridget apporte une fraîcheur royale à la série. Le slow burn est parfaitement dosé, la tension sexuelle palpable. Les obstacles à leur amour semblent insurmontables, ce qui rend leur relation encore plus prenante. Un excellent tome qui peut se lire indépendamment mais gagne à être lu après Twisted Love.",
      citations_favorites: "\"I don't do relationships, but I'd ruin myself for you.\"",
      pourquoi_aimer: "Pour le trope bodyguard/princesse, le slow burn magistral et les personnages attachants.",
      questions_sur_le_livre: "Rhys et Bridget forment-ils un couple crédible ? Le slow burn vous a-t-il frustré ? La fin vous satisfait-elle ?",
      recommandation_personnalisee: "Parfait si vous aimez les tropes forbidden love et bodyguard romance !",
      createdBy: adminUser.id,
      sagaId: twistedSaga?.id || null,
      sagaOrder: twistedSaga ? 2 : null,
    },
    
    { id: randomUUID(),
      titre: "People We Meet on Vacation",
      auteur: "Emily Henry",
      isbn: "9781984806758", 
      image_couverture: "https://images-na.ssl-images-amazon.com/images/I/81Q%2BdWZqpjL.jpg",
      resume_officiel: "Two best friends. Ten summer trips. One last chance to fall in love. From the New York Times bestselling author of Beach Read.",
      editeur: "Berkley",
      date_publication: new Date("2021-05-11"),
      nombre_pages: 364,
      langue: "EN",
      date_lecture: null,
      statut: BookStatus.A_LIRE,
      note_generale: 8,
      niveau_spicy: 3,
      niveau_dark: 2,
      niveau_romance: 9,
      intensite_emotionnelle: 7,
      danger: 1,
      violence: 1,
      originalite: 8,
      rythme: BookRhythm.MEDIUM_BURN,
      resume_personnel: "Emily Henry confirme son talent avec cette histoire de friends to lovers touchante.",
      critique_detaillee: "Une romance contemporaine qui réchauffe le cœur ! Poppy et Alex forment un duo attachant avec leur amitié de longue date mise à l'épreuve. Emily Henry excelle dans l'art de construire une relation believable et touchante. Les voyages servent de toile de fond parfaite à l'évolution de leur relation. C'est feel-good, drôle et émouvant. Un page-turner parfait pour l'été qui vous donnera envie de partir en vacances !",
      citations_favorites: "\"You and me, we're the same person sometimes. We want the same things.\"",
      pourquoi_aimer: "Pour l'amitié qui se transforme en amour, l'humour et l'émotion parfaitement dosés.",
      questions_sur_le_livre: "L'évolution de l'amitié vers l'amour vous semble-t-elle naturelle ? Les flashbacks enrichissent-ils l'histoire ?",
      recommandation_personnalisee: "Idéal pour les fans de friends to lovers et de romances feel-good !",
      createdBy: adminUser.id,
      sagaId: beachReadSaga?.id || null,
      sagaOrder: beachReadSaga ? 2 : null,
    }
  ];

  const createdBooks = [];
  for (const bookData of books) {
    const book = await db.book.create({
      data: {
        ...bookData,
        date_modification: new Date(),
      },
    });
    createdBooks.push(book);
  }
  
  console.log(`✅ Created ${books.length} books`);
  return createdBooks;
}

async function assignCategoriesAndTags(books: any[], categories: any[], tags: any[]) {
  console.log("🏷️ Assigning categories and tags to books...");
  
  // Récupérer les catégories et tags créés
  const darkRomanceCategory = categories.find(c => c.nom === "Dark Romance");
  const spicyRomanceCategory = categories.find(c => c.nom === "Spicy Romance");
  const contemporaryRomanceCategory = categories.find(c => c.nom === "Contemporary Romance");
  
  const enemiesLoversTag = tags.find(t => t.nom === "Enemies to Lovers");
  const ageGapTag = tags.find(t => t.nom === "Age Gap");
  const mafiaTag = tags.find(t => t.nom === "Mafia Romance");
  const violenceTag = tags.find(t => t.nom === "Violence");
  const secondChanceTag = tags.find(t => t.nom === "Second Chance");
  
  // Twisted Love - Dark Romance + Contemporary
  if (books[0] && darkRomanceCategory && contemporaryRomanceCategory) {
    await db.book_category.createMany({
      data: [
        { id: randomUUID(), bookId: books[0].id, categoryId: darkRomanceCategory.id },
        { id: randomUUID(), bookId: books[0].id, categoryId: contemporaryRomanceCategory.id }
      ]
    });
    
    if (enemiesLoversTag && ageGapTag) {
      await db.book_tag.createMany({
        data: [
          { id: randomUUID(), bookId: books[0].id, tagId: enemiesLoversTag.id },
          { id: randomUUID(), bookId: books[0].id, tagId: ageGapTag.id }
        ]
      });
    }
  }
  
  // Hunting Adeline - Dark Romance + triggers
  if (books[1] && darkRomanceCategory) {
    await db.book_category.create({
      data: { id: randomUUID(), bookId: books[1].id, categoryId: darkRomanceCategory.id }
    });
    
    if (violenceTag && mafiaTag) {
      await db.book_tag.createMany({
        data: [
          { id: randomUUID(), bookId: books[1].id, tagId: violenceTag.id },
          { id: randomUUID(), bookId: books[1].id, tagId: mafiaTag.id }
        ]
      });
    }
  }
  
  // Beach Read - Contemporary Romance
  if (books[2] && contemporaryRomanceCategory) {
    await db.book_category.create({
      data: { id: randomUUID(), bookId: books[2].id, categoryId: contemporaryRomanceCategory.id }
    });
    
    if (secondChanceTag) {
      await db.book_tag.create({
        data: { id: randomUUID(), bookId: books[2].id, tagId: secondChanceTag.id }
      });
    }
  }
  
  // The Seven Husbands - Contemporary
  if (books[3] && contemporaryRomanceCategory) {
    await db.book_category.create({
      data: { id: randomUUID(), bookId: books[3].id, categoryId: contemporaryRomanceCategory.id }
    });
  }
  
  // It Ends with Us - Contemporary + triggers
  if (books[4] && contemporaryRomanceCategory) {
    await db.book_category.create({
      data: { id: randomUUID(), bookId: books[4].id, categoryId: contemporaryRomanceCategory.id }
    });
    
    if (violenceTag) {
      await db.book_tag.create({
        data: { id: randomUUID(), bookId: books[4].id, tagId: violenceTag.id }
      });
    }
  }
  
  console.log("✅ Categories and tags assigned to books");
}

async function createBookQuestions(books: any[], users: any[], admin: any) {
  console.log("❓ Creating book questions...");
  
  if (books.length === 0 || users.length === 0) return;
  
  const questions = [
    // Questions pour Twisted Love
    { id: randomUUID(),
      question: "Quel âge ont les personnages principaux dans ce livre ? J'aimerais savoir avant de commencer.",
      bookId: books[0].id,
      authorId: users[0].id,
      reponse: "Alex a 28 ans et Ava 21 ans au début du livre. C'est un aspect important car cela influence beaucoup leurs dynamiques relationnelles et leur maturité émotionnelle respective. L'écart d'âge fait partie intégrante de l'intrigue !",
      status: "ANSWERED",
      date_reponse: new Date("2024-01-16T14:20:00Z"),
      answeredById: admin.id,
    },
    { id: randomUUID(),
      question: "Y a-t-il des triggers spécifiques à connaître avant de lire ce livre ?",
      bookId: books[0].id,
      authorId: users[1].id,
      reponse: "Excellente question ! Il y a quelques mentions de violence familiale dans le passé d'Alex, et des scènes de jalousie possessive. Mais rien d'extrême comparé à d'autres dark romance. Je recommande de vérifier les tags pour plus de détails !",
      status: "ANSWERED", 
      date_reponse: new Date("2024-01-17T09:15:00Z"),
      answeredById: admin.id,
    },
    { id: randomUUID(),
      question: "Est-ce que ce livre peut se lire indépendamment ou faut-il lire toute la série Twisted dans l'ordre ?",
      bookId: books[0].id,
      authorId: users[2].id,
      status: "PENDING",
    },
    
    // Questions pour Hunting Adeline
    { id: randomUUID(),
      question: "J'ai entendu dire que ce livre était très sombre. À quel point exactement ?",
      bookId: books[1].id,
      authorId: users[3].id,
      reponse: "C'est effectivement très intense ! Le livre aborde des thèmes lourds comme le trafic humain et la violence. Je le déconseille vraiment aux lectrices sensibles. Vérifiez absolument tous les trigger warnings avant de vous lancer. C'est du 18+ assumé !",
      status: "ANSWERED",
      date_reponse: new Date("2024-02-04T16:30:00Z"),
      answeredById: admin.id,
    },
    
    // Questions pour The Seven Husbands
    { id: randomUUID(),
      question: "Sans spoiler, est-ce que la fin vaut vraiment le coup ? J'ai peur d'être déçue après tout ce hype.",
      bookId: books[3].id,
      authorId: users[4].id,
      reponse: "Oh que oui ! La fin est absolument magistrale et complètement inattendue. Taylor Jenkins Reid maîtrise l'art du plot twist. Je peux te garantir que tu ne verras pas venir la révélation finale. Fais-moi confiance et lance-toi ! 📖",
      status: "ANSWERED",
      date_reponse: new Date("2024-01-29T11:45:00Z"),
      answeredById: admin.id,
    },
    
    // Questions en attente
    { id: randomUUID(),
      question: "Combien de temps ça vous a pris pour lire Beach Read ? Je me demande si je peux le finir en un weekend.",
      bookId: books[2].id, 
      authorId: users[0].id,
      status: "PENDING",
    },
    { id: randomUUID(),
      question: "Est-ce qu'It Ends with Us est adapté pour une première lecture de Colleen Hoover ?",
      bookId: books[4].id,
      authorId: users[1].id,
      status: "PENDING",
    },
  ];
  
  for (const questionData of questions) {
    await db.book_question.create({
      data: questionData as any,
    });
  }
  
  console.log(`✅ Created ${questions.length} book questions`);
}

async function createQuestionLikes(users: any[]) {
  console.log("👍 Creating question likes...");
  
  // Récupérer quelques questions pour leur ajouter des likes
  const questions = await db.book_question.findMany({
    take: 4
  });
  
  if (questions.length > 0 && users.length > 0) {
    const likes = [
      { id: randomUUID(), questionId: questions[0].id, userId: users[0].id },
      { id: randomUUID(), questionId: questions[0].id, userId: users[1].id },
      { id: randomUUID(), questionId: questions[0].id, userId: users[2].id },
      { id: randomUUID(), questionId: questions[1].id, userId: users[3].id },
      { id: randomUUID(), questionId: questions[1].id, userId: users[4].id },
      { id: randomUUID(), questionId: questions[2].id, userId: users[0].id },
    ];
    
    for (const like of likes) {
      await db.book_question_like.create({
        data: like,
      });
    }
    
    console.log(`✅ Created ${likes.length} question likes`);
  }
}

async function main() {
  console.log("🌱 Starting database seeding...");
  
  try {
    // 1. Créer les utilisateurs
    const { admin, users } = await createUsers();
    
    // 2. Créer les catégories
    await createDefaultCategories();
    const categories = await db.category.findMany();
    
    // 3. Créer les tags
    await createDefaultTags();
    const tags = await db.tag.findMany();
    
    // 4. Créer les sagas
    const sagas = await createDefaultSagas();
    
    // 5. Créer les livres
    const books = await createBooks(admin, categories, tags, sagas);
    
    // 6. Assigner catégories et tags aux livres
    await assignCategoriesAndTags(books, categories, tags);
    
    // 7. Créer les questions sur les livres
    await createBookQuestions(books, users, admin);
    
    // 8. Créer les likes sur les questions
    await createQuestionLikes(users);
    
    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   👥 Users: 1 admin + ${users.length} regular users`);
    console.log(`   🏷️ Categories: ${categories.length}`);
    console.log(`   🏷️ Tags: ${tags.length}`);
    console.log(`   📚 Sagas: ${sagas.length} with books assigned`);
    console.log(`   📚 Books: ${books.length} with full data`);
    console.log(`   ❓ Questions: Multiple with answers and likes`);
    
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});