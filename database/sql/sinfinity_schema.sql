-- =============================================================================
-- Sinfinity — MySQL 8 schema (full DDL)
-- Generated from database/modules + conventions.md
-- Charset: utf8mb4 / utf8mb4_unicode_ci | Engine: InnoDB | PK: CHAR(36) UUID DEFAULT (UUID())
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `sinfinity`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `sinfinity`;

-- -----------------------------------------------------------------------------
-- MODULE 18 — Settings (global references)
-- -----------------------------------------------------------------------------

CREATE TABLE `currencies` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` CHAR(3) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `symbol` VARCHAR(16) NOT NULL,
  `decimal_places` INT NOT NULL DEFAULT 2,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_currencies_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `countries` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` CHAR(2) NOT NULL,
  `code3` CHAR(3) NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone_code` VARCHAR(16) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_countries_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cities` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `country_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `region` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cities_country_name_region` (`country_id`, `name`, `region`),
  CONSTRAINT `fk_cities_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exchange_rates` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `from_currency_id` CHAR(36) NOT NULL,
  `to_currency_id` CHAR(36) NOT NULL,
  `rate` DECIMAL(18,8) NOT NULL,
  `rate_date` DATE NOT NULL,
  `source` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exchange_rates_pair_date` (`from_currency_id`, `to_currency_id`, `rate_date`),
  CONSTRAINT `fk_exchange_rates_from` FOREIGN KEY (`from_currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_exchange_rates_to` FOREIGN KEY (`to_currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `units` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `symbol` VARCHAR(32) NULL,
  `unit_type` ENUM('count','weight','length','volume','other') NOT NULL DEFAULT 'count',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_units_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipping_terms` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `incoterm_version` VARCHAR(32) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shipping_terms_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 1 — Organization & security
-- -----------------------------------------------------------------------------

CREATE TABLE `organizations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `legal_name` VARCHAR(255) NULL,
  `tax_id` VARCHAR(64) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `website` VARCHAR(255) NULL,
  `logo_url` VARCHAR(512) NULL,
  `default_currency_id` CHAR(36) NULL,
  `country_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_organizations_name` (`name`),
  CONSTRAINT `fk_organizations_currency` FOREIGN KEY (`default_currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_organizations_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `taxes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `rate` DECIMAL(7,4) NOT NULL DEFAULT 0,
  `tax_type` ENUM('vat','customs','withholding','other') NOT NULL DEFAULT 'vat',
  `country_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_taxes_organization` (`organization_id`),
  CONSTRAINT `fk_taxes_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_taxes_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_terms` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `days_due` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_terms_organization` (`organization_id`),
  CONSTRAINT `fk_payment_terms_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branches` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('office','warehouse','mixed') NOT NULL DEFAULT 'office',
  `address` TEXT NULL,
  `city_id` CHAR(36) NULL,
  `phone` VARCHAR(64) NULL,
  `manager_user_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branches_org_code` (`organization_id`, `code`),
  KEY `idx_branches_organization` (`organization_id`),
  CONSTRAINT `fk_branches_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_branches_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `branch_id` CHAR(36) NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(128) NOT NULL,
  `last_name` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(64) NULL,
  `avatar_url` VARCHAR(512) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME(3) NULL,
  `email_verified_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_organization` (`organization_id`),
  CONSTRAINT `fk_users_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `branches`
  ADD CONSTRAINT `fk_branches_manager_user` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`);

CREATE TABLE `roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_roles_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `module` VARCHAR(64) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `code` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permissions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `role_id` CHAR(36) NOT NULL,
  `permission_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `role_id` CHAR(36) NOT NULL,
  `branch_id` CHAR(36) NULL,
  `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assigned_by` CHAR(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_roles` (`user_id`, `role_id`, `branch_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_sessions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` TEXT NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_sessions_user` (`user_id`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `action` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `entity_id` CHAR(36) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_org_created` (`organization_id`, `created_at`),
  KEY `idx_audit_logs_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_audit_logs_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `email_attempted` VARCHAR(255) NULL,
  `success` TINYINT(1) NOT NULL,
  `failure_reason` VARCHAR(255) NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_login_logs_created` (`created_at`),
  CONSTRAINT `fk_login_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `key` VARCHAR(128) NOT NULL,
  `value` JSON NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_system_settings_org_key` (`organization_id`, `key`),
  CONSTRAINT `fk_system_settings_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 2 — CRM
-- -----------------------------------------------------------------------------

CREATE TABLE `customer_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_categories_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_customer_categories_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lead_sources` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lead_sources_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_lead_sources_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_types` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_activity_types_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leads` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `source_id` CHAR(36) NULL,
  `company_name` VARCHAR(255) NULL,
  `contact_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `status` ENUM('new','contacted','qualified','converted','lost') NOT NULL DEFAULT 'new',
  `owner_user_id` CHAR(36) NULL,
  `estimated_value` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `converted_customer_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_leads_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_leads_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_leads_source` FOREIGN KEY (`source_id`) REFERENCES `lead_sources` (`id`),
  CONSTRAINT `fk_leads_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_leads_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `category_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `type` ENUM('individual','organization') NOT NULL DEFAULT 'organization',
  `name` VARCHAR(255) NOT NULL,
  `legal_name` VARCHAR(255) NULL,
  `tax_id` VARCHAR(64) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `website` VARCHAR(255) NULL,
  `owner_user_id` CHAR(36) NULL,
  `status` ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  `converted_from_lead_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customers_org_code` (`organization_id`, `code`),
  KEY `idx_customers_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_customers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_customers_category` FOREIGN KEY (`category_id`) REFERENCES `customer_categories` (`id`),
  CONSTRAINT `fk_customers_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customers_lead` FOREIGN KEY (`converted_from_lead_id`) REFERENCES `leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_converted_customer` FOREIGN KEY (`converted_customer_id`) REFERENCES `customers` (`id`);

CREATE TABLE `customer_contacts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `customer_id` CHAR(36) NOT NULL,
  `first_name` VARCHAR(128) NOT NULL,
  `last_name` VARCHAR(128) NOT NULL,
  `title` VARCHAR(128) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `is_decision_maker` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_contacts_customer` (`customer_id`),
  CONSTRAINT `fk_customer_contacts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_addresses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `customer_id` CHAR(36) NOT NULL,
  `type` ENUM('billing','shipping','both') NOT NULL DEFAULT 'both',
  `label` VARCHAR(128) NULL,
  `line1` VARCHAR(255) NOT NULL,
  `line2` VARCHAR(255) NULL,
  `city_id` CHAR(36) NULL,
  `country_id` CHAR(36) NULL,
  `postal_code` VARCHAR(32) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_addresses_customer` (`customer_id`),
  CONSTRAINT `fk_customer_addresses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_addresses_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_customer_addresses_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_notes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `customer_id` CHAR(36) NOT NULL,
  `author_id` CHAR(36) NULL,
  `note` TEXT NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_notes_customer` (`customer_id`),
  CONSTRAINT `fk_customer_notes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_notes_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `opportunities` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `lead_id` CHAR(36) NULL,
  `name` VARCHAR(255) NOT NULL,
  `stage` ENUM('qualification','proposal','negotiation','won','lost') NOT NULL DEFAULT 'qualification',
  `probability` INT NOT NULL DEFAULT 0,
  `expected_close_date` DATE NULL,
  `amount` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `owner_user_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_opportunities_org_stage` (`organization_id`, `stage`),
  CONSTRAINT `fk_opportunities_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_opportunities_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_opportunities_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `fk_opportunities_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_opportunities_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_activities` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `activity_type_id` CHAR(36) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `related_type` VARCHAR(64) NULL,
  `related_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `scheduled_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `outcome` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sales_activities_org` (`organization_id`, `scheduled_at`),
  KEY `idx_sales_activities_related` (`related_type`, `related_id`),
  CONSTRAINT `fk_sales_activities_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_sales_activities_type` FOREIGN KEY (`activity_type_id`) REFERENCES `activity_types` (`id`),
  CONSTRAINT `fk_sales_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 3 — Catalog
-- -----------------------------------------------------------------------------

CREATE TABLE `product_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `parent_id` CHAR(36) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_categories_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_product_categories_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_product_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `product_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_subcategories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `category_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_subcategories_cat_code` (`category_id`, `code`),
  CONSTRAINT `fk_product_subcategories_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_brands` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `logo_url` VARCHAR(512) NULL,
  `website` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_brands_org_name` (`organization_id`, `name`),
  CONSTRAINT `fk_product_brands_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_models` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `brand_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `manufacturer_sku` VARCHAR(128) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_models_brand` (`brand_id`),
  CONSTRAINT `fk_product_models_brand` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_units` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `symbol` VARCHAR(32) NULL,
  `unit_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_units_code` (`code`),
  CONSTRAINT `fk_product_units_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `service_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_categories_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_service_categories_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category_id` CHAR(36) NULL,
  `base_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `billing_type` ENUM('fixed','hourly','per_unit') NOT NULL DEFAULT 'fixed',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_services_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_services_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_services_category` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`),
  CONSTRAINT `fk_services_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category_id` CHAR(36) NULL,
  `subcategory_id` CHAR(36) NULL,
  `brand_id` CHAR(36) NULL,
  `model_id` CHAR(36) NULL,
  `unit_id` CHAR(36) NULL,
  `base_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `cost_price` DECIMAL(18,4) NULL,
  `is_serialized` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_org_sku` (`organization_id`, `sku`),
  KEY `idx_products_org_active` (`organization_id`, `is_active`),
  CONSTRAINT `fk_products_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`),
  CONSTRAINT `fk_products_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `product_subcategories` (`id`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`),
  CONSTRAINT `fk_products_model` FOREIGN KEY (`model_id`) REFERENCES `product_models` (`id`),
  CONSTRAINT `fk_products_unit` FOREIGN KEY (`unit_id`) REFERENCES `product_units` (`id`),
  CONSTRAINT `fk_products_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_specifications` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `product_id` CHAR(36) NOT NULL,
  `spec_key` VARCHAR(128) NOT NULL,
  `spec_value` VARCHAR(512) NOT NULL,
  `unit` VARCHAR(32) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_product_specifications_product` (`product_id`),
  CONSTRAINT `fk_product_specifications_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_images` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `product_id` CHAR(36) NOT NULL,
  `url` VARCHAR(512) NOT NULL,
  `alt_text` VARCHAR(255) NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_services` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `product_id` CHAR(36) NOT NULL,
  `service_id` CHAR(36) NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `default_quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_services` (`product_id`, `service_id`),
  CONSTRAINT `fk_product_services_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_services_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `opportunity_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `opportunity_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_opportunity_items_opportunity` (`opportunity_id`),
  CONSTRAINT `fk_opportunity_items_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opportunity_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_opportunity_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- MODULE 4 — Suppliers
-- -----------------------------------------------------------------------------

CREATE TABLE `supplier_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_categories_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_supplier_categories_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suppliers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category_id` CHAR(36) NULL,
  `country_id` CHAR(36) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `website` VARCHAR(255) NULL,
  `tax_id` VARCHAR(64) NULL,
  `rating` DECIMAL(5,2) NULL,
  `status` ENUM('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
  `preferred` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_suppliers_org_code` (`organization_id`, `code`),
  KEY `idx_suppliers_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_suppliers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_suppliers_category` FOREIGN KEY (`category_id`) REFERENCES `supplier_categories` (`id`),
  CONSTRAINT `fk_suppliers_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_contacts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `first_name` VARCHAR(128) NOT NULL,
  `last_name` VARCHAR(128) NOT NULL,
  `title` VARCHAR(128) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(64) NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_contacts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_addresses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `type` ENUM('hq','warehouse','factory','billing') NOT NULL DEFAULT 'hq',
  `line1` VARCHAR(255) NOT NULL,
  `line2` VARCHAR(255) NULL,
  `city_id` CHAR(36) NULL,
  `country_id` CHAR(36) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_addresses_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_addresses_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_supplier_addresses_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_products` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `supplier_sku` VARCHAR(128) NULL,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `moq` DECIMAL(18,4) NULL,
  `lead_time_days` INT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_products` (`supplier_id`, `product_id`),
  CONSTRAINT `fk_supplier_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_supplier_products_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_quotes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `quote_number` VARCHAR(64) NOT NULL,
  `quote_date` DATE NOT NULL,
  `valid_until` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `status` ENUM('draft','received','selected','rejected','expired') NOT NULL DEFAULT 'received',
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_quotes_org_number` (`organization_id`, `quote_number`),
  CONSTRAINT `fk_supplier_quotes_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_supplier_quotes_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_supplier_quotes_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_quote_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_quote_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `lead_time_days` INT NULL,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_quote_items_quote` FOREIGN KEY (`supplier_quote_id`) REFERENCES `supplier_quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_evaluations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `evaluated_by` CHAR(36) NULL,
  `evaluated_at` DATE NOT NULL,
  `quality_score` INT NULL,
  `delivery_score` INT NULL,
  `price_score` INT NULL,
  `overall_score` DECIMAL(5,2) NULL,
  `comments` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_evaluations_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_evaluations_user` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_payment_terms` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `payment_term_id` CHAR(36) NOT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_payment_terms_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_payment_terms_term` FOREIGN KEY (`payment_term_id`) REFERENCES `payment_terms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_histories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(64) NULL,
  `entity_id` CHAR(36) NULL,
  `summary` TEXT NULL,
  `amount` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_histories_supplier` (`supplier_id`, `occurred_at`),
  CONSTRAINT `fk_supplier_histories_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_histories_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 16 (partial) — Documents (needed early for FKs)
-- -----------------------------------------------------------------------------

CREATE TABLE `document_types` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `allowed_mime_types` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_types_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_document_types_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `documents` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `document_type_id` CHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(512) NOT NULL,
  `mime_type` VARCHAR(128) NULL,
  `file_size` BIGINT NULL,
  `uploaded_by` CHAR(36) NULL,
  `checksum` VARCHAR(128) NULL,
  `status` ENUM('active','archived','deleted') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_documents_org` (`organization_id`),
  CONSTRAINT `fk_documents_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_documents_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`),
  CONSTRAINT `fk_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier_documents` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `supplier_id` CHAR(36) NOT NULL,
  `document_id` CHAR(36) NOT NULL,
  `doc_kind` VARCHAR(64) NULL,
  `expires_at` DATE NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_supplier_documents_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 6 — Quotations
-- -----------------------------------------------------------------------------

CREATE TABLE `quotation_statuses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_final` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_statuses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `quote_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `opportunity_id` CHAR(36) NULL,
  `status_id` CHAR(36) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `issue_date` DATE NULL,
  `valid_until` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `exchange_rate` DECIMAL(18,8) NULL,
  `subtotal` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `owner_user_id` CHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotations_org_number` (`organization_id`, `quote_number`),
  KEY `idx_quotations_org_status` (`organization_id`, `status_id`),
  CONSTRAINT `fk_quotations_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_quotations_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_quotations_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`),
  CONSTRAINT `fk_quotations_status` FOREIGN KEY (`status_id`) REFERENCES `quotation_statuses` (`id`),
  CONSTRAINT `fk_quotations_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_quotations_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotation_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `quotation_id` CHAR(36) NOT NULL,
  `line_number` INT NOT NULL DEFAULT 1,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_id` CHAR(36) NULL,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `discount_percent` DECIMAL(7,4) NOT NULL DEFAULT 0,
  `tax_id` CHAR(36) NULL,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_quotation_items_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_quotation_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_quotation_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`),
  CONSTRAINT `fk_quotation_items_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotation_versions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `quotation_id` CHAR(36) NOT NULL,
  `version_number` INT NOT NULL,
  `snapshot` JSON NOT NULL,
  `changed_by` CHAR(36) NULL,
  `change_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_versions` (`quotation_id`, `version_number`),
  CONSTRAINT `fk_quotation_versions_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_versions_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotation_terms` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `quotation_id` CHAR(36) NOT NULL,
  `payment_term_id` CHAR(36) NULL,
  `shipping_term_id` CHAR(36) NULL,
  `warranty_text` TEXT NULL,
  `delivery_lead_time_days` INT NULL,
  `additional_terms` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_terms_quotation` (`quotation_id`),
  CONSTRAINT `fk_quotation_terms_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_terms_payment` FOREIGN KEY (`payment_term_id`) REFERENCES `payment_terms` (`id`),
  CONSTRAINT `fk_quotation_terms_shipping` FOREIGN KEY (`shipping_term_id`) REFERENCES `shipping_terms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotation_approvals` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `quotation_id` CHAR(36) NOT NULL,
  `approver_id` CHAR(36) NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `decision_at` DATETIME(3) NULL,
  `comments` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_quotation_approvals_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_approvals_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 7 — Sales orders
-- -----------------------------------------------------------------------------

CREATE TABLE `sales_orders` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `order_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `quotation_id` CHAR(36) NULL,
  `branch_id` CHAR(36) NULL,
  `status` ENUM('pending','confirmed','in_progress','partially_delivered','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `order_date` DATE NOT NULL,
  `requested_delivery_date` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `subtotal` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `billing_address_id` CHAR(36) NULL,
  `shipping_address_id` CHAR(36) NULL,
  `owner_user_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_orders_org_number` (`organization_id`, `order_number`),
  KEY `idx_sales_orders_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_sales_orders_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_sales_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_sales_orders_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
  CONSTRAINT `fk_sales_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_sales_orders_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_sales_orders_billing` FOREIGN KEY (`billing_address_id`) REFERENCES `customer_addresses` (`id`),
  CONSTRAINT `fk_sales_orders_shipping` FOREIGN KEY (`shipping_address_id`) REFERENCES `customer_addresses` (`id`),
  CONSTRAINT `fk_sales_orders_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_order_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `sales_order_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `quantity_delivered` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_id` CHAR(36) NULL,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sales_order_items_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_sales_order_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_sales_order_items_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_order_status_history` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `sales_order_id` CHAR(36) NOT NULL,
  `from_status` VARCHAR(64) NULL,
  `to_status` VARCHAR(64) NOT NULL,
  `changed_by` CHAR(36) NULL,
  `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sales_order_status_history_order` (`sales_order_id`, `changed_at`),
  CONSTRAINT `fk_sales_order_status_history_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_order_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_order_documents` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `sales_order_id` CHAR(36) NOT NULL,
  `document_id` CHAR(36) NOT NULL,
  `doc_kind` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sales_order_documents_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_order_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- MODULE 5 — Procurement
-- -----------------------------------------------------------------------------

CREATE TABLE `procurement_requests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `request_number` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `requested_by` CHAR(36) NULL,
  `opportunity_id` CHAR(36) NULL,
  `sales_order_id` CHAR(36) NULL,
  `needed_by` DATE NULL,
  `status` ENUM('draft','open','quoted','compared','approved','closed','cancelled') NOT NULL DEFAULT 'draft',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_procurement_requests_org_number` (`organization_id`, `request_number`),
  KEY `idx_procurement_requests_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_procurement_requests_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_procurement_requests_user` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_procurement_requests_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`),
  CONSTRAINT `fk_procurement_requests_sales_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procurement_request_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `procurement_request_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_id` CHAR(36) NULL,
  `target_unit_price` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_procurement_request_items_request` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_procurement_request_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_procurement_request_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`),
  CONSTRAINT `fk_procurement_request_items_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procurement_quotes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `procurement_request_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `quote_number` VARCHAR(64) NULL,
  `quote_date` DATE NULL,
  `valid_until` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `shipping_term_id` CHAR(36) NULL,
  `lead_time_days` INT NULL,
  `status` ENUM('received','shortlisted','selected','rejected') NOT NULL DEFAULT 'received',
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_procurement_quotes_request` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_procurement_quotes_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_procurement_quotes_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_procurement_quotes_shipping` FOREIGN KEY (`shipping_term_id`) REFERENCES `shipping_terms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procurement_quote_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `procurement_quote_id` CHAR(36) NOT NULL,
  `procurement_request_item_id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `lead_time_days` INT NULL,
  `notes` TEXT NULL,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_procurement_quote_items_quote` FOREIGN KEY (`procurement_quote_id`) REFERENCES `procurement_quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_procurement_quote_items_request_item` FOREIGN KEY (`procurement_request_item_id`) REFERENCES `procurement_request_items` (`id`),
  CONSTRAINT `fk_procurement_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procurement_comparisons` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `procurement_request_id` CHAR(36) NOT NULL,
  `compared_by` CHAR(36) NULL,
  `compared_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `criteria` JSON NULL,
  `scores` JSON NULL,
  `selected_quote_id` CHAR(36) NULL,
  `recommendation` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_procurement_comparisons_request` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_procurement_comparisons_user` FOREIGN KEY (`compared_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_procurement_comparisons_quote` FOREIGN KEY (`selected_quote_id`) REFERENCES `procurement_quotes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procurement_approvals` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `procurement_request_id` CHAR(36) NOT NULL,
  `procurement_quote_id` CHAR(36) NULL,
  `approver_id` CHAR(36) NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `decision_at` DATETIME(3) NULL,
  `comments` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_procurement_approvals_request` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_procurement_approvals_quote` FOREIGN KEY (`procurement_quote_id`) REFERENCES `procurement_quotes` (`id`),
  CONSTRAINT `fk_procurement_approvals_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 8 — Purchase orders
-- -----------------------------------------------------------------------------

CREATE TABLE `purchase_orders` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `po_number` VARCHAR(64) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `procurement_request_id` CHAR(36) NULL,
  `procurement_quote_id` CHAR(36) NULL,
  `status` ENUM('draft','sent','confirmed','partial','received','closed','cancelled') NOT NULL DEFAULT 'draft',
  `order_date` DATE NOT NULL,
  `expected_date` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `shipping_term_id` CHAR(36) NULL,
  `payment_term_id` CHAR(36) NULL,
  `subtotal` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `buyer_user_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchase_orders_org_number` (`organization_id`, `po_number`),
  KEY `idx_purchase_orders_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_purchase_orders_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_purchase_orders_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_purchase_orders_pr` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`),
  CONSTRAINT `fk_purchase_orders_pq` FOREIGN KEY (`procurement_quote_id`) REFERENCES `procurement_quotes` (`id`),
  CONSTRAINT `fk_purchase_orders_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_purchase_orders_shipping` FOREIGN KEY (`shipping_term_id`) REFERENCES `shipping_terms` (`id`),
  CONSTRAINT `fk_purchase_orders_payment` FOREIGN KEY (`payment_term_id`) REFERENCES `payment_terms` (`id`),
  CONSTRAINT `fk_purchase_orders_buyer` FOREIGN KEY (`buyer_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_order_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `purchase_order_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `quantity_received` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_purchase_order_items_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_order_payments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `purchase_order_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL,
  `currency_id` CHAR(36) NULL,
  `payment_method_id` CHAR(36) NULL,
  `paid_at` DATETIME(3) NULL,
  `reference` VARCHAR(128) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_purchase_order_payments_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_order_payments_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_order_status_history` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `purchase_order_id` CHAR(36) NOT NULL,
  `from_status` VARCHAR(64) NULL,
  `to_status` VARCHAR(64) NOT NULL,
  `changed_by` CHAR(36) NULL,
  `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_purchase_order_status_history_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_order_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 10 — Logistics (before receipts / landed costs)
-- -----------------------------------------------------------------------------

CREATE TABLE `shipping_methods` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shipping_methods_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `carriers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(64) NULL,
  `contact_email` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(64) NULL,
  `tracking_url_template` VARCHAR(512) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_carriers_org` (`organization_id`),
  CONSTRAINT `fk_carriers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `warehouses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `branch_id` CHAR(36) NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `city_id` CHAR(36) NULL,
  `manager_user_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warehouses_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_warehouses_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_warehouses_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_warehouses_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_warehouses_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_addresses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `label` VARCHAR(128) NULL,
  `line1` VARCHAR(255) NOT NULL,
  `line2` VARCHAR(255) NULL,
  `city_id` CHAR(36) NULL,
  `country_id` CHAR(36) NULL,
  `contact_name` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(64) NULL,
  `customer_id` CHAR(36) NULL,
  `warehouse_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_delivery_addresses_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_delivery_addresses_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `fk_delivery_addresses_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`),
  CONSTRAINT `fk_delivery_addresses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_delivery_addresses_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `shipment_number` VARCHAR(64) NOT NULL,
  `purchase_order_id` CHAR(36) NULL,
  `carrier_id` CHAR(36) NULL,
  `shipping_method_id` CHAR(36) NULL,
  `container_number` VARCHAR(128) NULL,
  `bl_number` VARCHAR(128) NULL,
  `origin_country_id` CHAR(36) NULL,
  `destination_country_id` CHAR(36) NULL,
  `etd` DATE NULL,
  `eta` DATE NULL,
  `atd` DATE NULL,
  `ata` DATE NULL,
  `status` ENUM('booked','in_transit','arrived','cleared','delivered','cancelled') NOT NULL DEFAULT 'booked',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shipments_org_number` (`organization_id`, `shipment_number`),
  KEY `idx_shipments_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_shipments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_shipments_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_shipments_carrier` FOREIGN KEY (`carrier_id`) REFERENCES `carriers` (`id`),
  CONSTRAINT `fk_shipments_method` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`),
  CONSTRAINT `fk_shipments_origin` FOREIGN KEY (`origin_country_id`) REFERENCES `countries` (`id`),
  CONSTRAINT `fk_shipments_destination` FOREIGN KEY (`destination_country_id`) REFERENCES `countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipment_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `shipment_id` CHAR(36) NOT NULL,
  `purchase_order_item_id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `weight_kg` DECIMAL(18,4) NULL,
  `volume_cbm` DECIMAL(18,4) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_shipment_items_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shipment_items_poi` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`),
  CONSTRAINT `fk_shipment_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipment_tracking` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `shipment_id` CHAR(36) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `location` VARCHAR(255) NULL,
  `event_at` DATETIME(3) NOT NULL,
  `description` TEXT NULL,
  `source` ENUM('manual','api','carrier') NOT NULL DEFAULT 'manual',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_shipment_tracking_shipment` (`shipment_id`, `event_at`),
  CONSTRAINT `fk_shipment_tracking_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customs_declarations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `shipment_id` CHAR(36) NULL,
  `declaration_number` VARCHAR(128) NULL,
  `regime` VARCHAR(64) NULL,
  `declared_value` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `status` ENUM('draft','submitted','cleared','rejected') NOT NULL DEFAULT 'draft',
  `cleared_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customs_declarations_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_customs_declarations_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`),
  CONSTRAINT `fk_customs_declarations_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customs_documents` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `customs_declaration_id` CHAR(36) NOT NULL,
  `document_id` CHAR(36) NOT NULL,
  `doc_kind` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customs_documents_declaration` FOREIGN KEY (`customs_declaration_id`) REFERENCES `customs_declarations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customs_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `import_documents` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `shipment_id` CHAR(36) NOT NULL,
  `document_id` CHAR(36) NOT NULL,
  `doc_kind` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_import_documents_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_import_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_receipts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `purchase_order_id` CHAR(36) NOT NULL,
  `receipt_number` VARCHAR(64) NOT NULL,
  `warehouse_id` CHAR(36) NULL,
  `received_at` DATETIME(3) NULL,
  `received_by` CHAR(36) NULL,
  `shipment_id` CHAR(36) NULL,
  `notes` TEXT NULL,
  `status` ENUM('draft','confirmed') NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchase_receipts_org_number` (`organization_id`, `receipt_number`),
  CONSTRAINT `fk_purchase_receipts_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_purchase_receipts_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_purchase_receipts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_purchase_receipts_user` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_purchase_receipts_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- MODULE 9 — Landed costs
-- -----------------------------------------------------------------------------

CREATE TABLE `landed_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `reference` VARCHAR(64) NOT NULL,
  `purchase_order_id` CHAR(36) NULL,
  `shipment_id` CHAR(36) NULL,
  `currency_id` CHAR(36) NULL,
  `goods_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_additional_costs` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_landed_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` ENUM('draft','calculated','posted') NOT NULL DEFAULT 'draft',
  `calculated_at` DATETIME(3) NULL,
  `calculated_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_landed_costs_org_reference` (`organization_id`, `reference`),
  CONSTRAINT `fk_landed_costs_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_landed_costs_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_landed_costs_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`),
  CONSTRAINT `fk_landed_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_landed_costs_user` FOREIGN KEY (`calculated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `landed_cost_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `purchase_order_item_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `goods_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `allocated_costs` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_landed_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_landed_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_landed_cost_items_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_landed_cost_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_landed_cost_items_poi` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipping_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `shipment_id` CHAR(36) NULL,
  `shipping_method_id` CHAR(36) NULL,
  `carrier_id` CHAR(36) NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_shipping_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shipping_costs_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`),
  CONSTRAINT `fk_shipping_costs_method` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`),
  CONSTRAINT `fk_shipping_costs_carrier` FOREIGN KEY (`carrier_id`) REFERENCES `carriers` (`id`),
  CONSTRAINT `fk_shipping_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customs_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `customs_declaration_id` CHAR(36) NULL,
  `duties_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `vat_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `other_fees` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customs_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customs_costs_declaration` FOREIGN KEY (`customs_declaration_id`) REFERENCES `customs_declarations` (`id`),
  CONSTRAINT `fk_customs_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `local_transport_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `from_location` VARCHAR(255) NULL,
  `to_location` VARCHAR(255) NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `provider` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_local_transport_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_local_transport_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inspection_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `inspection_place` ENUM('origin','destination','transit') NOT NULL DEFAULT 'origin',
  `inspector` VARCHAR(255) NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `inspected_at` DATE NULL,
  `report_document_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_inspection_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inspection_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_inspection_costs_document` FOREIGN KEY (`report_document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `handling_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `location` VARCHAR(255) NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_handling_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_handling_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `other_procurement_costs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `landed_cost_id` CHAR(36) NOT NULL,
  `cost_type` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `currency_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_other_procurement_costs_lc` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_other_procurement_costs_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 11 — Inventory
-- -----------------------------------------------------------------------------

CREATE TABLE `warehouse_locations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `warehouse_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `aisle` VARCHAR(64) NULL,
  `rack` VARCHAR(64) NULL,
  `shelf` VARCHAR(64) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warehouse_locations` (`warehouse_id`, `code`),
  CONSTRAINT `fk_warehouse_locations_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_batches` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `batch_number` VARCHAR(128) NOT NULL,
  `manufactured_at` DATE NULL,
  `expires_at` DATE NULL,
  `supplier_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_batches` (`organization_id`, `product_id`, `batch_number`),
  CONSTRAINT `fk_inventory_batches_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_inventory_batches_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_inventory_batches_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NOT NULL,
  `location_id` CHAR(36) NULL,
  `product_id` CHAR(36) NOT NULL,
  `batch_id` CHAR(36) NULL,
  `quantity_on_hand` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `quantity_reserved` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `quantity_available` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_stock` (`warehouse_id`, `location_id`, `product_id`, `batch_id`),
  KEY `idx_inventory_org_product` (`organization_id`, `product_id`),
  CONSTRAINT `fk_inventory_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_inventory_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_inventory_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_inventory_batch` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_movements` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NOT NULL,
  `location_id` CHAR(36) NULL,
  `movement_type` ENUM('in','out','transfer','adjustment','reserve','unreserve') NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `reference_type` VARCHAR(64) NULL,
  `reference_id` CHAR(36) NULL,
  `moved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `moved_by` CHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_movements_org` (`organization_id`, `moved_at`),
  KEY `idx_inventory_movements_ref` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_inventory_movements_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_inventory_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_inventory_movements_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_inventory_movements_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  CONSTRAINT `fk_inventory_movements_user` FOREIGN KEY (`moved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_transfers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `transfer_number` VARCHAR(64) NOT NULL,
  `from_warehouse_id` CHAR(36) NOT NULL,
  `to_warehouse_id` CHAR(36) NOT NULL,
  `status` ENUM('draft','in_transit','completed','cancelled') NOT NULL DEFAULT 'draft',
  `transferred_at` DATETIME(3) NULL,
  `requested_by` CHAR(36) NULL,
  `approved_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stock_transfers_org_number` (`organization_id`, `transfer_number`),
  CONSTRAINT `fk_stock_transfers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_stock_transfers_from` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_stock_transfers_to` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_stock_transfers_requested` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_stock_transfers_approved` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_adjustments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity_before` DECIMAL(18,4) NOT NULL,
  `quantity_after` DECIMAL(18,4) NOT NULL,
  `reason` ENUM('loss','damage','count','other') NOT NULL DEFAULT 'other',
  `adjusted_by` CHAR(36) NULL,
  `adjusted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_stock_adjustments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_stock_adjustments_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_stock_adjustments_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_stock_adjustments_user` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_reservations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `inventory_id` CHAR(36) NOT NULL,
  `sales_order_id` CHAR(36) NULL,
  `sales_order_item_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `status` ENUM('active','released','fulfilled') NOT NULL DEFAULT 'active',
  `reserved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_stock_reservations_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `fk_stock_reservations_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`),
  CONSTRAINT `fk_stock_reservations_soi` FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `serial_numbers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `serial_number` VARCHAR(128) NOT NULL,
  `batch_id` CHAR(36) NULL,
  `warehouse_id` CHAR(36) NULL,
  `status` ENUM('in_stock','reserved','shipped','installed','returned','scrapped') NOT NULL DEFAULT 'in_stock',
  `purchase_order_item_id` CHAR(36) NULL,
  `sales_order_item_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_serial_numbers_org_serial` (`organization_id`, `serial_number`),
  CONSTRAINT `fk_serial_numbers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_serial_numbers_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_serial_numbers_batch` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`),
  CONSTRAINT `fk_serial_numbers_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_serial_numbers_poi` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`),
  CONSTRAINT `fk_serial_numbers_soi` FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 12 — Delivery
-- -----------------------------------------------------------------------------

CREATE TABLE `deliveries` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `delivery_number` VARCHAR(64) NOT NULL,
  `sales_order_id` CHAR(36) NULL,
  `customer_id` CHAR(36) NOT NULL,
  `warehouse_id` CHAR(36) NULL,
  `delivery_address_id` CHAR(36) NULL,
  `scheduled_at` DATETIME(3) NULL,
  `delivered_at` DATETIME(3) NULL,
  `driver_user_id` CHAR(36) NULL,
  `status` ENUM('planned','in_transit','delivered','failed','cancelled') NOT NULL DEFAULT 'planned',
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_deliveries_org_number` (`organization_id`, `delivery_number`),
  KEY `idx_deliveries_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_deliveries_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_deliveries_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`),
  CONSTRAINT `fk_deliveries_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_deliveries_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_deliveries_address` FOREIGN KEY (`delivery_address_id`) REFERENCES `delivery_addresses` (`id`),
  CONSTRAINT `fk_deliveries_driver` FOREIGN KEY (`driver_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `delivery_id` CHAR(36) NOT NULL,
  `sales_order_item_id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `serial_number_ids` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_delivery_items_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_items_soi` FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items` (`id`),
  CONSTRAINT `fk_delivery_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_tracking` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `delivery_id` CHAR(36) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `location_label` VARCHAR(255) NULL,
  `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_delivery_tracking_delivery` (`delivery_id`, `recorded_at`),
  CONSTRAINT `fk_delivery_tracking_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_confirmations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `delivery_id` CHAR(36) NOT NULL,
  `confirmed_by_name` VARCHAR(255) NULL,
  `confirmed_at` DATETIME(3) NULL,
  `status` ENUM('accepted','accepted_with_remarks','rejected') NOT NULL DEFAULT 'accepted',
  `remarks` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_delivery_confirmations_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `proof_of_delivery` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `delivery_id` CHAR(36) NOT NULL,
  `confirmation_id` CHAR(36) NULL,
  `document_id` CHAR(36) NULL,
  `proof_type` ENUM('signature','photo','document') NOT NULL DEFAULT 'document',
  `captured_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_proof_of_delivery_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proof_of_delivery_confirmation` FOREIGN KEY (`confirmation_id`) REFERENCES `delivery_confirmations` (`id`),
  CONSTRAINT `fk_proof_of_delivery_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- MODULE 13 — Projects & installation
-- -----------------------------------------------------------------------------

CREATE TABLE `technicians` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `first_name` VARCHAR(128) NOT NULL,
  `last_name` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(64) NULL,
  `email` VARCHAR(255) NULL,
  `skills` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_technicians_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_technicians_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projects` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `project_number` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `sales_order_id` CHAR(36) NULL,
  `manager_user_id` CHAR(36) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` ENUM('planned','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'planned',
  `site_address` TEXT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_projects_org_number` (`organization_id`, `project_number`),
  CONSTRAINT `fk_projects_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_projects_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_projects_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`),
  CONSTRAINT `fk_projects_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `project_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_project_items_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_project_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `installations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `project_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `site_location` TEXT NULL,
  `scheduled_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `status` ENUM('planned','ongoing','completed','failed') NOT NULL DEFAULT 'planned',
  `lead_technician_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_installations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installations_technician` FOREIGN KEY (`lead_technician_id`) REFERENCES `technicians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `installation_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `installation_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `serial_number_id` CHAR(36) NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `installed_at` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_installation_items_installation` FOREIGN KEY (`installation_id`) REFERENCES `installations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installation_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_installation_items_serial` FOREIGN KEY (`serial_number_id`) REFERENCES `serial_numbers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `installation_tasks` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `installation_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `technician_id` CHAR(36) NULL,
  `status` ENUM('todo','in_progress','done','blocked') NOT NULL DEFAULT 'todo',
  `due_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_installation_tasks_installation` FOREIGN KEY (`installation_id`) REFERENCES `installations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installation_tasks_technician` FOREIGN KEY (`technician_id`) REFERENCES `technicians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `installation_reports` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `installation_id` CHAR(36) NOT NULL,
  `author_user_id` CHAR(36) NULL,
  `summary` TEXT NULL,
  `findings` TEXT NULL,
  `document_ids` JSON NULL,
  `reported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_installation_reports_installation` FOREIGN KEY (`installation_id`) REFERENCES `installations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installation_reports_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commissioning_tests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `installation_id` CHAR(36) NOT NULL,
  `test_name` VARCHAR(255) NOT NULL,
  `checklist` JSON NULL,
  `result` ENUM('pass','fail','partial') NULL,
  `performed_by` CHAR(36) NULL,
  `performed_at` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_commissioning_tests_installation` FOREIGN KEY (`installation_id`) REFERENCES `installations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_commissioning_tests_technician` FOREIGN KEY (`performed_by`) REFERENCES `technicians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 14 — Maintenance & support
-- -----------------------------------------------------------------------------

CREATE TABLE `support_tickets` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `ticket_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `contact_id` CHAR(36) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `priority` ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('open','in_progress','waiting','resolved','closed') NOT NULL DEFAULT 'open',
  `assigned_to` CHAR(36) NULL,
  `related_serial_number_id` CHAR(36) NULL,
  `opened_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `closed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_support_tickets_org_number` (`organization_id`, `ticket_number`),
  KEY `idx_support_tickets_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_support_tickets_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_support_tickets_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_support_tickets_contact` FOREIGN KEY (`contact_id`) REFERENCES `customer_contacts` (`id`),
  CONSTRAINT `fk_support_tickets_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_support_tickets_serial` FOREIGN KEY (`related_serial_number_id`) REFERENCES `serial_numbers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_contracts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `contract_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `sla_hours` INT NULL,
  `status` ENUM('draft','active','expired','cancelled') NOT NULL DEFAULT 'draft',
  `amount` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_maintenance_contracts_org_number` (`organization_id`, `contract_number`),
  CONSTRAINT `fk_maintenance_contracts_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_maintenance_contracts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_maintenance_contracts_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_contract_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `maintenance_contract_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `serial_number_id` CHAR(36) NULL,
  `coverage_level` VARCHAR(64) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_maintenance_contract_items_contract` FOREIGN KEY (`maintenance_contract_id`) REFERENCES `maintenance_contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_contract_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_maintenance_contract_items_serial` FOREIGN KEY (`serial_number_id`) REFERENCES `serial_numbers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_schedules` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `maintenance_contract_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `frequency` ENUM('monthly','quarterly','yearly','custom') NOT NULL DEFAULT 'quarterly',
  `next_due_at` DATE NULL,
  `technician_id` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_maintenance_schedules_contract` FOREIGN KEY (`maintenance_contract_id`) REFERENCES `maintenance_contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_schedules_technician` FOREIGN KEY (`technician_id`) REFERENCES `technicians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_interventions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `ticket_id` CHAR(36) NULL,
  `schedule_id` CHAR(36) NULL,
  `contract_id` CHAR(36) NULL,
  `customer_id` CHAR(36) NOT NULL,
  `technician_id` CHAR(36) NULL,
  `started_at` DATETIME(3) NULL,
  `ended_at` DATETIME(3) NULL,
  `intervention_type` ENUM('preventive','corrective','inspection') NOT NULL DEFAULT 'corrective',
  `status` ENUM('planned','done','cancelled') NOT NULL DEFAULT 'planned',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_maintenance_interventions_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_maintenance_interventions_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`),
  CONSTRAINT `fk_maintenance_interventions_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `maintenance_schedules` (`id`),
  CONSTRAINT `fk_maintenance_interventions_contract` FOREIGN KEY (`contract_id`) REFERENCES `maintenance_contracts` (`id`),
  CONSTRAINT `fk_maintenance_interventions_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_maintenance_interventions_technician` FOREIGN KEY (`technician_id`) REFERENCES `technicians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_reports` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `intervention_id` CHAR(36) NOT NULL,
  `summary` TEXT NULL,
  `actions_taken` TEXT NULL,
  `parts_used` JSON NULL,
  `document_ids` JSON NULL,
  `reported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_maintenance_reports_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `maintenance_interventions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `service_requests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `request_type` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `status` ENUM('new','assigned','completed','cancelled') NOT NULL DEFAULT 'new',
  `converted_ticket_id` CHAR(36) NULL,
  `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_service_requests_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_service_requests_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_service_requests_ticket` FOREIGN KEY (`converted_ticket_id`) REFERENCES `support_tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `warranties` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `serial_number_id` CHAR(36) NULL,
  `customer_id` CHAR(36) NULL,
  `sales_order_id` CHAR(36) NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `warranty_type` ENUM('manufacturer','seller','extended') NOT NULL DEFAULT 'seller',
  `terms` TEXT NULL,
  `status` ENUM('active','expired','void') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_warranties_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_warranties_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_warranties_serial` FOREIGN KEY (`serial_number_id`) REFERENCES `serial_numbers` (`id`),
  CONSTRAINT `fk_warranties_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_warranties_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `warranty_claims` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `warranty_id` CHAR(36) NOT NULL,
  `ticket_id` CHAR(36) NULL,
  `claim_number` VARCHAR(64) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('submitted','approved','rejected','fulfilled') NOT NULL DEFAULT 'submitted',
  `resolution` TEXT NULL,
  `claimed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_warranty_claims_warranty` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranty_claims_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 15 — Finance
-- -----------------------------------------------------------------------------

CREATE TABLE `payment_methods` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_methods_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_payment_methods_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `purchase_order_payments`
  ADD CONSTRAINT `fk_purchase_order_payments_method`
  FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`);

CREATE TABLE `invoices` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `invoice_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `sales_order_id` CHAR(36) NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NULL,
  `currency_id` CHAR(36) NULL,
  `subtotal` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `amount_paid` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` ENUM('draft','issued','partially_paid','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoices_org_number` (`organization_id`, `invoice_number`),
  KEY `idx_invoices_org_status` (`organization_id`, `status`),
  CONSTRAINT `fk_invoices_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_invoices_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`),
  CONSTRAINT `fk_invoices_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `invoice_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `tax_id` CHAR(36) NULL,
  `line_total` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invoice_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_invoice_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_invoice_items_tax` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `invoice_id` CHAR(36) NULL,
  `payment_method_id` CHAR(36) NULL,
  `amount` DECIMAL(18,4) NOT NULL,
  `currency_id` CHAR(36) NULL,
  `paid_at` DATETIME(3) NOT NULL,
  `reference` VARCHAR(128) NULL,
  `status` ENUM('pending','confirmed','failed','reversed') NOT NULL DEFAULT 'confirmed',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_payments_org` (`organization_id`, `paid_at`),
  CONSTRAINT `fk_payments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `fk_payments_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`),
  CONSTRAINT `fk_payments_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sales_order_payments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `sales_order_id` CHAR(36) NOT NULL,
  `payment_id` CHAR(36) NULL,
  `payment_type` ENUM('deposit','partial','balance') NOT NULL DEFAULT 'partial',
  `amount` DECIMAL(18,4) NOT NULL,
  `currency_id` CHAR(36) NULL,
  `paid_at` DATETIME(3) NULL,
  `reference` VARCHAR(128) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sales_order_payments_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_order_payments_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`),
  CONSTRAINT `fk_sales_order_payments_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `parent_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expense_categories_org_code` (`organization_id`, `code`),
  CONSTRAINT `fk_expense_categories_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_expense_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expenses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `category_id` CHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL,
  `currency_id` CHAR(36) NULL,
  `expense_date` DATE NOT NULL,
  `supplier_id` CHAR(36) NULL,
  `landed_cost_id` CHAR(36) NULL,
  `paid_by` CHAR(36) NULL,
  `status` ENUM('draft','approved','paid','rejected') NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_expenses_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_expenses_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `fk_expenses_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  CONSTRAINT `fk_expenses_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_expenses_landed_cost` FOREIGN KEY (`landed_cost_id`) REFERENCES `landed_costs` (`id`),
  CONSTRAINT `fk_expenses_user` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refunds` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `invoice_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL,
  `currency_id` CHAR(36) NULL,
  `reason` TEXT NULL,
  `status` ENUM('draft','issued','applied') NOT NULL DEFAULT 'draft',
  `refunded_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_refunds_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_refunds_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `fk_refunds_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_refunds_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `accounts_receivable` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `invoice_id` CHAR(36) NOT NULL,
  `original_amount` DECIMAL(18,4) NOT NULL,
  `balance_due` DECIMAL(18,4) NOT NULL,
  `due_date` DATE NULL,
  `aging_bucket` VARCHAR(32) NULL,
  `status` ENUM('open','partial','closed','written_off') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_accounts_receivable_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_accounts_receivable_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_accounts_receivable_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `accounts_payable` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `purchase_order_id` CHAR(36) NULL,
  `original_amount` DECIMAL(18,4) NOT NULL,
  `balance_due` DECIMAL(18,4) NOT NULL,
  `due_date` DATE NULL,
  `status` ENUM('open','partial','paid','cancelled') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_accounts_payable_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_accounts_payable_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_accounts_payable_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 16 — Documents (remaining) & contracts
-- -----------------------------------------------------------------------------

CREATE TABLE `document_versions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `document_id` CHAR(36) NOT NULL,
  `version_number` INT NOT NULL,
  `file_url` VARCHAR(512) NOT NULL,
  `change_notes` TEXT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_versions` (`document_id`, `version_number`),
  CONSTRAINT `fk_document_versions_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_versions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document_links` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `document_id` CHAR(36) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `entity_id` CHAR(36) NOT NULL,
  `role` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_links` (`document_id`, `entity_type`, `entity_id`),
  KEY `idx_document_links_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_document_links_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contracts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `contract_number` VARCHAR(64) NOT NULL,
  `customer_id` CHAR(36) NULL,
  `supplier_id` CHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` ENUM('draft','active','expired','terminated') NOT NULL DEFAULT 'draft',
  `document_id` CHAR(36) NULL,
  `total_value` DECIMAL(18,4) NULL,
  `currency_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contracts_org_number` (`organization_id`, `contract_number`),
  CONSTRAINT `fk_contracts_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_contracts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_contracts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_contracts_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_contracts_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contract_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `contract_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `service_id` CHAR(36) NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(18,4) NULL,
  `unit_price` DECIMAL(18,4) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_contract_items_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contract_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_contract_items_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MODULE 17 — Communication & tasks
-- -----------------------------------------------------------------------------

CREATE TABLE `activities` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `activity_type_id` CHAR(36) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `entity_type` VARCHAR(64) NULL,
  `entity_id` CHAR(36) NULL,
  `owner_user_id` CHAR(36) NULL,
  `due_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `status` ENUM('planned','done','cancelled') NOT NULL DEFAULT 'planned',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activities_org` (`organization_id`, `due_at`),
  KEY `idx_activities_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_activities_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_activities_type` FOREIGN KEY (`activity_type_id`) REFERENCES `activity_types` (`id`),
  CONSTRAINT `fk_activities_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `appointments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `start_at` DATETIME(3) NOT NULL,
  `end_at` DATETIME(3) NOT NULL,
  `location` VARCHAR(255) NULL,
  `meeting_type` ENUM('in_person','online','phone') NOT NULL DEFAULT 'in_person',
  `organizer_id` CHAR(36) NULL,
  `customer_id` CHAR(36) NULL,
  `status` ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appointments_org_start` (`organization_id`, `start_at`),
  CONSTRAINT `fk_appointments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_appointments_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_appointments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tasks` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `assignee_id` CHAR(36) NULL,
  `created_by` CHAR(36) NULL,
  `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` ENUM('todo','in_progress','done','cancelled') NOT NULL DEFAULT 'todo',
  `due_at` DATETIME(3) NULL,
  `entity_type` VARCHAR(64) NULL,
  `entity_id` CHAR(36) NULL,
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_org_status` (`organization_id`, `status`),
  KEY `idx_tasks_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_tasks_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_tasks_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `channel` ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NULL,
  `entity_type` VARCHAR(64) NULL,
  `entity_id` CHAR(36) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `read_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`),
  CONSTRAINT `fk_notifications_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `comments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `organization_id` CHAR(36) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `entity_id` CHAR(36) NOT NULL,
  `author_id` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `parent_comment_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_entity` (`entity_type`, `entity_id`, `created_at`),
  CONSTRAINT `fk_comments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_comments_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- End of Sinfinity MySQL schema
