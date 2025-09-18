import { z } from "zod";

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

/**
 * Politique de mot de passe sécurisé pour Booky
 * - Au moins 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 * - Pas de mots de passe communs
 */
export const PasswordPolicySchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
  .refine(
    (password) => /[a-z]/.test(password),
    "Le mot de passe doit contenir au moins une minuscule"
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    "Le mot de passe doit contenir au moins une majuscule"
  )
  .refine(
    (password) => /\d/.test(password),
    "Le mot de passe doit contenir au moins un chiffre"
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    "Le mot de passe doit contenir au moins un caractère spécial"
  )
  .refine(
    (password) => !isCommonPassword(password),
    "Ce mot de passe est trop commun, choisissez-en un autre"
  );

/**
 * Mots de passe communs à éviter
 */
const COMMON_PASSWORDS = [
  "password", "password123", "123456", "123456789", "qwerty",
  "12345678", "111111", "1234567890", "123123", "password1",
  "iloveyou", "qwerty123", "admin", "welcome", "monkey",
  "login", "abc123", "starwars", "123qwe", "dragon",
  "passw0rd", "master", "hello", "freedom", "whatever",
  "qazwsx", "trustno1", "654321", "jordan23", "harley",
  "password01", "letmein", "baseball", "1234", "sunshine",
  "princess", "lovely", "shadow", "12345", "ashley"
];

/**
 * Vérifier si un mot de passe est commun
 */
export function isCommonPassword(password: string): boolean {
  const normalizedPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some(common => 
    normalizedPassword.includes(common) || common.includes(normalizedPassword)
  );
}

/**
 * Évaluer la force d'un mot de passe
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Vérifications de base
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("Utilisez au moins 8 caractères");
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Ajoutez des lettres minuscules");
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Ajoutez des lettres majuscules");
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("Ajoutez des chiffres");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push("Ajoutez des caractères spéciaux");
  }

  // Bonus pour longueur
  if (password.length >= 12) {
    score = Math.min(5, score + 1);
  }

  // Malus pour mots de passe communs
  if (isCommonPassword(password)) {
    score = Math.max(0, score - 2);
    feedback.push("Évitez les mots de passe communs");
  }

  // Malus pour répétitions
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Évitez les répétitions de caractères");
  }

  return {
    score: Math.min(4, score),
    feedback,
    isStrong: score >= 4
  };
}

/**
 * Schéma Zod pour valider l'email avec des règles strictes
 */
export const EmailPolicySchema = z
  .string()
  .email("Format d'email invalide")
  .min(3, "L'email doit contenir au moins 3 caractères")
  .max(254, "L'email ne peut pas dépasser 254 caractères")
  .refine(
    (email) => {
      // Vérifier que le domaine n'est pas temporaire/jetable
      const domain = email.split('@')[1]?.toLowerCase();
      return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    },
    "Les adresses email temporaires ne sont pas autorisées"
  )
  .refine(
    (email) => {
      // Vérifier format RFC 5322 simplifié
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    "Format d'email invalide"
  );

/**
 * Domaines d'email jetables courants à bloquer
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "temp-mail.org", "throwaway.email", "fakeinbox.com",
  "maildrop.cc", "tempmail.io", "yopmail.com", "getnada.com",
  "mohmal.com", "emailondeck.com", "sharklasers.com",
  "grr.la", "discard.email", "spamgourmet.com"
];

/**
 * Schéma pour valider le nom d'utilisateur
 */
export const UsernamePolicySchema = z
  .string()
  .min(2, "Le nom d'utilisateur doit contenir au moins 2 caractères")
  .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
  )
  .refine(
    (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
    "Ce nom d'utilisateur est réservé"
  );

/**
 * Noms d'utilisateur réservés
 */
const RESERVED_USERNAMES = [
  "admin", "administrator", "root", "moderator", "mod",
  "bruna", "booky", "api", "www", "mail", "support",
  "help", "info", "contact", "webmaster", "postmaster",
  "security", "abuse", "noreply", "no-reply", "system"
];

/**
 * Validation complète pour l'inscription
 */
export const RegisterValidationSchema = z.object({
  email: EmailPolicySchema,
  password: PasswordPolicySchema,
  nom_complet: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères")
    .max(100, "Le nom complet ne peut pas dépasser 100 caractères")
    .optional(),
  username: UsernamePolicySchema.optional(),
});

/**
 * Validation pour le changement de mot de passe
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: PasswordPolicySchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path: ["newPassword"]
  }
);