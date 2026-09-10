-- Settings reference seed (currencies, geo, units, Incoterms, payment terms, TVA RDC)
-- Prefer the idempotent Nest seeder:
--   pnpm --filter @sinfinity/api seed:settings
--
-- This SQL is a lightweight bootstrap for greenfield DBs. It upserts on unique
-- codes where available. Cities / payment_terms / taxes use NOT EXISTS guards.

-- Currencies
INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `decimal_places`, `is_active`)
SELECT UUID(), 'USD', 'US Dollar', '$', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM `currencies` WHERE `code` = 'USD');
UPDATE `currencies` SET `name` = 'US Dollar', `symbol` = '$', `decimal_places` = 2, `is_active` = 1 WHERE `code` = 'USD';

INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `decimal_places`, `is_active`)
SELECT UUID(), 'CDF', 'Congolese Franc', 'FC', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM `currencies` WHERE `code` = 'CDF');
UPDATE `currencies` SET `name` = 'Congolese Franc', `symbol` = 'FC', `decimal_places` = 2, `is_active` = 1 WHERE `code` = 'CDF';

INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `decimal_places`, `is_active`)
SELECT UUID(), 'CNY', 'Chinese Yuan', '¥', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM `currencies` WHERE `code` = 'CNY');
UPDATE `currencies` SET `name` = 'Chinese Yuan', `symbol` = '¥', `decimal_places` = 2, `is_active` = 1 WHERE `code` = 'CNY';

INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `decimal_places`, `is_active`)
SELECT UUID(), 'EUR', 'Euro', '€', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM `currencies` WHERE `code` = 'EUR');
UPDATE `currencies` SET `name` = 'Euro', `symbol` = '€', `decimal_places` = 2, `is_active` = 1 WHERE `code` = 'EUR';

-- Countries
INSERT INTO `countries` (`id`, `code`, `code3`, `name`, `phone_code`)
SELECT UUID(), 'CD', 'COD', 'Congo, Democratic Republic of the', '+243'
WHERE NOT EXISTS (SELECT 1 FROM `countries` WHERE `code` = 'CD');
UPDATE `countries` SET `code3` = 'COD', `name` = 'Congo, Democratic Republic of the', `phone_code` = '+243' WHERE `code` = 'CD';

INSERT INTO `countries` (`id`, `code`, `code3`, `name`, `phone_code`)
SELECT UUID(), 'CN', 'CHN', 'China', '+86'
WHERE NOT EXISTS (SELECT 1 FROM `countries` WHERE `code` = 'CN');
UPDATE `countries` SET `code3` = 'CHN', `name` = 'China', `phone_code` = '+86' WHERE `code` = 'CN';

INSERT INTO `countries` (`id`, `code`, `code3`, `name`, `phone_code`)
SELECT UUID(), 'AE', 'ARE', 'United Arab Emirates', '+971'
WHERE NOT EXISTS (SELECT 1 FROM `countries` WHERE `code` = 'AE');
UPDATE `countries` SET `code3` = 'ARE', `name` = 'United Arab Emirates', `phone_code` = '+971' WHERE `code` = 'AE';

INSERT INTO `countries` (`id`, `code`, `code3`, `name`, `phone_code`)
SELECT UUID(), 'FR', 'FRA', 'France', '+33'
WHERE NOT EXISTS (SELECT 1 FROM `countries` WHERE `code` = 'FR');
UPDATE `countries` SET `code3` = 'FRA', `name` = 'France', `phone_code` = '+33' WHERE `code` = 'FR';

INSERT INTO `countries` (`id`, `code`, `code3`, `name`, `phone_code`)
SELECT UUID(), 'BE', 'BEL', 'Belgium', '+32'
WHERE NOT EXISTS (SELECT 1 FROM `countries` WHERE `code` = 'BE');
UPDATE `countries` SET `code3` = 'BEL', `name` = 'Belgium', `phone_code` = '+32' WHERE `code` = 'BE';

-- Cities
INSERT INTO `cities` (`id`, `country_id`, `name`, `region`)
SELECT UUID(), c.id, 'Kinshasa', 'Kinshasa'
FROM `countries` c
WHERE c.code = 'CD'
  AND NOT EXISTS (
    SELECT 1 FROM `cities` x
    WHERE x.country_id = c.id AND x.name = 'Kinshasa' AND x.region = 'Kinshasa'
  );

INSERT INTO `cities` (`id`, `country_id`, `name`, `region`)
SELECT UUID(), c.id, 'Lubumbashi', 'Haut-Katanga'
FROM `countries` c
WHERE c.code = 'CD'
  AND NOT EXISTS (
    SELECT 1 FROM `cities` x
    WHERE x.country_id = c.id AND x.name = 'Lubumbashi' AND x.region = 'Haut-Katanga'
  );

INSERT INTO `cities` (`id`, `country_id`, `name`, `region`)
SELECT UUID(), c.id, 'Shenzhen', 'Guangdong'
FROM `countries` c
WHERE c.code = 'CN'
  AND NOT EXISTS (
    SELECT 1 FROM `cities` x
    WHERE x.country_id = c.id AND x.name = 'Shenzhen' AND x.region = 'Guangdong'
  );

INSERT INTO `cities` (`id`, `country_id`, `name`, `region`)
SELECT UUID(), c.id, 'Dubai', 'Dubai'
FROM `countries` c
WHERE c.code = 'AE'
  AND NOT EXISTS (
    SELECT 1 FROM `cities` x
    WHERE x.country_id = c.id AND x.name = 'Dubai' AND x.region = 'Dubai'
  );

-- Units
INSERT INTO `units` (`id`, `code`, `name`, `symbol`, `unit_type`)
SELECT UUID(), 'PCS', 'Piece', 'pcs', 'count'
WHERE NOT EXISTS (SELECT 1 FROM `units` WHERE `code` = 'PCS');
UPDATE `units` SET `name` = 'Piece', `symbol` = 'pcs', `unit_type` = 'count' WHERE `code` = 'PCS';

INSERT INTO `units` (`id`, `code`, `name`, `symbol`, `unit_type`)
SELECT UUID(), 'KG', 'Kilogram', 'kg', 'weight'
WHERE NOT EXISTS (SELECT 1 FROM `units` WHERE `code` = 'KG');
UPDATE `units` SET `name` = 'Kilogram', `symbol` = 'kg', `unit_type` = 'weight' WHERE `code` = 'KG';

INSERT INTO `units` (`id`, `code`, `name`, `symbol`, `unit_type`)
SELECT UUID(), 'BOX', 'Box', 'box', 'count'
WHERE NOT EXISTS (SELECT 1 FROM `units` WHERE `code` = 'BOX');
UPDATE `units` SET `name` = 'Box', `symbol` = 'box', `unit_type` = 'count' WHERE `code` = 'BOX';

INSERT INTO `units` (`id`, `code`, `name`, `symbol`, `unit_type`)
SELECT UUID(), 'M', 'Meter', 'm', 'length'
WHERE NOT EXISTS (SELECT 1 FROM `units` WHERE `code` = 'M');
UPDATE `units` SET `name` = 'Meter', `symbol` = 'm', `unit_type` = 'length' WHERE `code` = 'M';

-- Shipping terms (Incoterms)
INSERT INTO `shipping_terms` (`id`, `code`, `name`, `description`, `incoterm_version`)
SELECT UUID(), 'EXW', 'Ex Works', 'Seller makes goods available at their premises.', '2020'
WHERE NOT EXISTS (SELECT 1 FROM `shipping_terms` WHERE `code` = 'EXW');
UPDATE `shipping_terms` SET `name` = 'Ex Works', `description` = 'Seller makes goods available at their premises.', `incoterm_version` = '2020' WHERE `code` = 'EXW';

INSERT INTO `shipping_terms` (`id`, `code`, `name`, `description`, `incoterm_version`)
SELECT UUID(), 'FOB', 'Free On Board', 'Seller delivers goods on board the vessel nominated by the buyer.', '2020'
WHERE NOT EXISTS (SELECT 1 FROM `shipping_terms` WHERE `code` = 'FOB');
UPDATE `shipping_terms` SET `name` = 'Free On Board', `description` = 'Seller delivers goods on board the vessel nominated by the buyer.', `incoterm_version` = '2020' WHERE `code` = 'FOB';

INSERT INTO `shipping_terms` (`id`, `code`, `name`, `description`, `incoterm_version`)
SELECT UUID(), 'CIF', 'Cost, Insurance and Freight', 'Seller pays cost, insurance and freight to the named port of destination.', '2020'
WHERE NOT EXISTS (SELECT 1 FROM `shipping_terms` WHERE `code` = 'CIF');
UPDATE `shipping_terms` SET `name` = 'Cost, Insurance and Freight', `description` = 'Seller pays cost, insurance and freight to the named port of destination.', `incoterm_version` = '2020' WHERE `code` = 'CIF';

INSERT INTO `shipping_terms` (`id`, `code`, `name`, `description`, `incoterm_version`)
SELECT UUID(), 'DDU', 'Delivered Duty Unpaid', 'Seller delivers without clearing import duties (pre-Incoterms 2020 usage).', '2020'
WHERE NOT EXISTS (SELECT 1 FROM `shipping_terms` WHERE `code` = 'DDU');
UPDATE `shipping_terms` SET `name` = 'Delivered Duty Unpaid', `description` = 'Seller delivers without clearing import duties (pre-Incoterms 2020 usage).', `incoterm_version` = '2020' WHERE `code` = 'DDU';

INSERT INTO `shipping_terms` (`id`, `code`, `name`, `description`, `incoterm_version`)
SELECT UUID(), 'DDP', 'Delivered Duty Paid', 'Seller delivers cleared for import, duties paid.', '2020'
WHERE NOT EXISTS (SELECT 1 FROM `shipping_terms` WHERE `code` = 'DDP');
UPDATE `shipping_terms` SET `name` = 'Delivered Duty Paid', `description` = 'Seller delivers cleared for import, duties paid.', `incoterm_version` = '2020' WHERE `code` = 'DDP';

-- Global payment terms
INSERT INTO `payment_terms` (`id`, `organization_id`, `code`, `name`, `days_due`, `description`)
SELECT UUID(), NULL, 'NET30', 'Net 30', 30, 'Payment due within 30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM `payment_terms`
  WHERE `code` = 'NET30' AND `organization_id` IS NULL AND `deleted_at` IS NULL
);

INSERT INTO `payment_terms` (`id`, `organization_id`, `code`, `name`, `days_due`, `description`)
SELECT UUID(), NULL, 'NET60', 'Net 60', 60, 'Payment due within 60 days'
WHERE NOT EXISTS (
  SELECT 1 FROM `payment_terms`
  WHERE `code` = 'NET60' AND `organization_id` IS NULL AND `deleted_at` IS NULL
);

INSERT INTO `payment_terms` (`id`, `organization_id`, `code`, `name`, `days_due`, `description`)
SELECT UUID(), NULL, 'COD', 'Cash on Delivery', 0, 'Payment upon delivery'
WHERE NOT EXISTS (
  SELECT 1 FROM `payment_terms`
  WHERE `code` = 'COD' AND `organization_id` IS NULL AND `deleted_at` IS NULL
);

-- TVA RDC 16% (global)
INSERT INTO `taxes` (`id`, `organization_id`, `code`, `name`, `rate`, `tax_type`, `country_id`, `is_active`)
SELECT UUID(), NULL, 'TVA_CD', 'TVA RDC 16%', '16.0000', 'vat', c.id, 1
FROM `countries` c
WHERE c.code = 'CD'
  AND NOT EXISTS (
    SELECT 1 FROM `taxes`
    WHERE `code` = 'TVA_CD' AND `organization_id` IS NULL AND `deleted_at` IS NULL
  );

UPDATE `taxes` t
JOIN `countries` c ON c.code = 'CD'
SET t.name = 'TVA RDC 16%', t.rate = '16.0000', t.tax_type = 'vat', t.country_id = c.id, t.is_active = 1
WHERE t.code = 'TVA_CD' AND t.organization_id IS NULL AND t.deleted_at IS NULL;
