import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  real,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const contactTypes = pgTable("contact_types", {
  value: text("value").primaryKey(),
  label: text("label").notNull(),
  color: text("color").default("slate").notNull(),
  icon: text("icon").default("more").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  office: text("office").notNull(),
  unitCode: text("unit_code").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  type: text("type").default("OTHER").notNull(),
  logoUrl: text("logo_url"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("groups_parent_id_sort_order_idx").on(table.parentId, table.sortOrder),
  index("groups_type_idx").on(table.type),
  foreignKey({ columns: [table.type], foreignColumns: [contactTypes.value] }),
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }),
]);

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  type: text("type").default("OTHER").notNull(),
  note: text("note"),
  logoUrl: text("logo_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  facebookUrl: text("facebook_url"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  groupId: text("group_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("contacts_type_sort_order_idx").on(table.type, table.sortOrder),
  index("contacts_group_id_idx").on(table.groupId),
  foreignKey({ columns: [table.type], foreignColumns: [contactTypes.value] }),
  foreignKey({ columns: [table.groupId], foreignColumns: [groups.id] }),
]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const faqItems = pgTable("faq_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("faq_items_sort_order_idx").on(table.sortOrder),
]);

export const suggestions = pgTable("suggestions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  message: text("message").notNull(),
  office: text("office"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("suggestions_created_at_idx").on(table.createdAt),
]);

export const bfpCornerEntries = pgTable("bfp_corner_entries", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("bfp_corner_entries_sort_order_idx").on(table.sortOrder),
]);

export const contactTypesRelations = relations(contactTypes, ({ many }) => ({
  contacts: many(contacts),
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  parent: one(groups, { fields: [groups.parentId], references: [groups.id] }),
  children: many(groups, { relationName: "GroupTree" }),
  contacts: many(contacts),
  typeInfo: one(contactTypes, { fields: [groups.type], references: [contactTypes.value] }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  group: one(groups, { fields: [contacts.groupId], references: [groups.id] }),
  typeInfo: one(contactTypes, { fields: [contacts.type], references: [contactTypes.value] }),
}));

export type ContactType = typeof contactTypes.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type FaqItem = typeof faqItems.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type BfpCornerEntry = typeof bfpCornerEntries.$inferSelect;