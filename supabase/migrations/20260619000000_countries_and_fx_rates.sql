-- AGTRENZ: countries + USD-based FX rates
-- Source: ExchangeRate-API (base USD), snapshot Fri 19 Jun 2026 00:00:02 UTC

CREATE TABLE IF NOT EXISTS fx_rate_metadata (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  result TEXT NOT NULL,
  base_code CHAR(3) NOT NULL DEFAULT 'USD',
  time_last_update_unix BIGINT NOT NULL,
  time_last_update_utc TIMESTAMPTZ NOT NULL,
  time_next_update_unix BIGINT NOT NULL,
  time_next_update_utc TIMESTAMPTZ NOT NULL,
  documentation_url TEXT,
  terms_of_use_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS countries (
  id BIGSERIAL PRIMARY KEY,
  country_name TEXT NOT NULL,
  iso_alpha2 CHAR(2) NOT NULL,
  iso_alpha3 CHAR(3) NOT NULL,
  isd_code VARCHAR(8) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  fx_rate_usd NUMERIC(24, 8) NOT NULL,
  fx_base_code CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT countries_currency_code_unique UNIQUE (currency_code),
  CONSTRAINT countries_fx_rate_positive CHECK (fx_rate_usd > 0)
);

CREATE INDEX IF NOT EXISTS countries_iso_alpha2_idx ON countries (iso_alpha2);
CREATE INDEX IF NOT EXISTS countries_iso_alpha3_idx ON countries (iso_alpha3);
CREATE INDEX IF NOT EXISTS countries_isd_code_idx ON countries (isd_code);

COMMENT ON TABLE countries IS 'Country and currency reference with USD-based FX conversion rates.';
COMMENT ON COLUMN countries.country_name IS 'Primary country or region name for the currency.';
COMMENT ON COLUMN countries.iso_alpha2 IS 'ISO 3166-1 alpha-2 country code (2 letters).';
COMMENT ON COLUMN countries.iso_alpha3 IS 'ISO 3166-1 alpha-3 country code (3 letters).';
COMMENT ON COLUMN countries.isd_code IS 'International dialing / mobile ISD code (E.164 prefix without +).';
COMMENT ON COLUMN countries.currency_code IS 'ISO 4217 currency code (3 letters).';
COMMENT ON COLUMN countries.fx_rate_usd IS 'Units of local currency per 1 USD (same as ExchangeRate-API conversion_rates).';

CREATE OR REPLACE FUNCTION set_countries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS countries_set_updated_at ON countries;
CREATE TRIGGER countries_set_updated_at
BEFORE UPDATE ON countries
FOR EACH ROW
EXECUTE FUNCTION set_countries_updated_at();

INSERT INTO fx_rate_metadata (
  result,
  base_code,
  time_last_update_unix,
  time_last_update_utc,
  time_next_update_unix,
  time_next_update_utc,
  documentation_url,
  terms_of_use_url
) VALUES (
  'success',
  'USD',
  1781827202,
  TIMESTAMPTZ '2026-06-19 00:00:02+00',
  1781913602,
  TIMESTAMPTZ '2026-06-20 00:00:02+00',
  'https://www.exchangerate-api.com/docs',
  'https://www.exchangerate-api.com/terms'
)
ON CONFLICT (id) DO UPDATE SET
  result = EXCLUDED.result,
  base_code = EXCLUDED.base_code,
  time_last_update_unix = EXCLUDED.time_last_update_unix,
  time_last_update_utc = EXCLUDED.time_last_update_utc,
  time_next_update_unix = EXCLUDED.time_next_update_unix,
  time_next_update_utc = EXCLUDED.time_next_update_utc,
  documentation_url = EXCLUDED.documentation_url,
  terms_of_use_url = EXCLUDED.terms_of_use_url,
  updated_at = NOW();

INSERT INTO countries (
  country_name,
  iso_alpha2,
  iso_alpha3,
  isd_code,
  currency_code,
  fx_rate_usd
) VALUES
  ('United States', 'US', 'USA', '1', 'USD', 1.00000000),
  ('United Arab Emirates', 'AE', 'ARE', '971', 'AED', 3.67250000),
  ('Afghanistan', 'AF', 'AFG', '93', 'AFN', 63.98850000),
  ('Albania', 'AL', 'ALB', '355', 'ALL', 82.37730000),
  ('Armenia', 'AM', 'ARM', '374', 'AMD', 368.32870000),
  ('Curaçao', 'CW', 'CUW', '599', 'ANG', 1.79000000),
  ('Angola', 'AO', 'AGO', '244', 'AOA', 924.94670000),
  ('Argentina', 'AR', 'ARG', '54', 'ARS', 1449.57990000),
  ('Australia', 'AU', 'AUS', '61', 'AUD', 1.42580000),
  ('Aruba', 'AW', 'ABW', '297', 'AWG', 1.79000000),
  ('Azerbaijan', 'AZ', 'AZE', '994', 'AZN', 1.70160000),
  ('Bosnia and Herzegovina', 'BA', 'BIH', '387', 'BAM', 1.70500000),
  ('Barbados', 'BB', 'BRB', '1246', 'BBD', 2.00000000),
  ('Bangladesh', 'BD', 'BGD', '880', 'BDT', 122.81650000),
  ('Bulgaria', 'BG', 'BGR', '359', 'BGN', 1.70500000),
  ('Bahrain', 'BH', 'BHR', '973', 'BHD', 0.37600000),
  ('Burundi', 'BI', 'BDI', '257', 'BIF', 2989.77900000),
  ('Bermuda', 'BM', 'BMU', '1441', 'BMD', 1.00000000),
  ('Brunei', 'BN', 'BRN', '673', 'BND', 1.29020000),
  ('Bolivia', 'BO', 'BOL', '591', 'BOB', 6.93310000),
  ('Brazil', 'BR', 'BRA', '55', 'BRL', 5.15230000),
  ('Bahamas', 'BS', 'BHS', '1242', 'BSD', 1.00000000),
  ('Bhutan', 'BT', 'BTN', '975', 'BTN', 94.41030000),
  ('Botswana', 'BW', 'BWA', '267', 'BWP', 13.78520000),
  ('Belarus', 'BY', 'BLR', '375', 'BYN', 2.76540000),
  ('Belize', 'BZ', 'BLZ', '501', 'BZD', 2.00000000),
  ('Canada', 'CA', 'CAN', '1', 'CAD', 1.41240000),
  ('Democratic Republic of the Congo', 'CD', 'COD', '243', 'CDF', 2298.99310000),
  ('Switzerland', 'CH', 'CHE', '41', 'CHF', 0.80420000),
  ('Chile', 'CL', 'CHL', '56', 'CLF', 0.02253000),
  ('Chile', 'CL', 'CHL', '56', 'CLP', 890.63150000),
  ('China (Offshore)', 'CN', 'CHN', '86', 'CNH', 6.77200000),
  ('China', 'CN', 'CHN', '86', 'CNY', 6.78360000),
  ('Colombia', 'CO', 'COL', '57', 'COP', 3453.32490000),
  ('Costa Rica', 'CR', 'CRI', '506', 'CRC', 454.67980000),
  ('Cuba', 'CU', 'CUB', '53', 'CUP', 24.00000000),
  ('Cape Verde', 'CV', 'CPV', '238', 'CVE', 96.12500000),
  ('Czech Republic', 'CZ', 'CZE', '420', 'CZK', 21.10110000),
  ('Djibouti', 'DJ', 'DJI', '253', 'DJF', 177.72100000),
  ('Denmark', 'DK', 'DNK', '45', 'DKK', 6.50780000),
  ('Dominican Republic', 'DO', 'DOM', '1809', 'DOP', 58.63190000),
  ('Algeria', 'DZ', 'DZA', '213', 'DZD', 133.57840000),
  ('Egypt', 'EG', 'EGY', '20', 'EGP', 49.91910000),
  ('Eritrea', 'ER', 'ERI', '291', 'ERN', 15.00000000),
  ('Ethiopia', 'ET', 'ETH', '251', 'ETB', 158.52160000),
  ('Eurozone', 'EU', 'EMU', '49', 'EUR', 0.87180000),
  ('Fiji', 'FJ', 'FJI', '679', 'FJD', 2.24540000),
  ('Falkland Islands', 'FK', 'FLK', '500', 'FKP', 0.75620000),
  ('Faroe Islands', 'FO', 'FRO', '298', 'FOK', 6.50780000),
  ('United Kingdom', 'GB', 'GBR', '44', 'GBP', 0.75620000),
  ('Georgia', 'GE', 'GEO', '995', 'GEL', 2.65080000),
  ('Guernsey', 'GG', 'GGY', '44', 'GGP', 0.75620000),
  ('Ghana', 'GH', 'GHA', '233', 'GHS', 11.15980000),
  ('Gibraltar', 'GI', 'GIB', '350', 'GIP', 0.75620000),
  ('Gambia', 'GM', 'GMB', '220', 'GMD', 74.20300000),
  ('Guinea', 'GN', 'GIN', '224', 'GNF', 8768.29840000),
  ('Guatemala', 'GT', 'GTM', '502', 'GTQ', 7.63140000),
  ('Guyana', 'GY', 'GUY', '592', 'GYD', 209.24310000),
  ('Hong Kong', 'HK', 'HKG', '852', 'HKD', 7.83730000),
  ('Honduras', 'HN', 'HND', '504', 'HNL', 26.76430000),
  ('Croatia', 'HR', 'HRV', '385', 'HRK', 6.56830000),
  ('Haiti', 'HT', 'HTI', '509', 'HTG', 130.59430000),
  ('Hungary', 'HU', 'HUN', '36', 'HUF', 307.26660000),
  ('Indonesia', 'ID', 'IDN', '62', 'IDR', 17766.20240000),
  ('Israel', 'IL', 'ISR', '972', 'ILS', 2.94180000),
  ('Isle of Man', 'IM', 'IMN', '44', 'IMP', 0.75620000),
  ('India', 'IN', 'IND', '91', 'INR', 94.41490000),
  ('Iraq', 'IQ', 'IRQ', '964', 'IQD', 1308.90770000),
  ('Iran', 'IR', 'IRN', '98', 'IRR', 1273369.99180000),
  ('Iceland', 'IS', 'ISL', '354', 'ISK', 125.82210000),
  ('Jersey', 'JE', 'JEY', '44', 'JEP', 0.75620000),
  ('Jamaica', 'JM', 'JAM', '1876', 'JMD', 158.17030000),
  ('Jordan', 'JO', 'JOR', '962', 'JOD', 0.70900000),
  ('Japan', 'JP', 'JPN', '81', 'JPY', 161.10380000),
  ('Kenya', 'KE', 'KEN', '254', 'KES', 129.46600000),
  ('Kyrgyzstan', 'KG', 'KGZ', '996', 'KGS', 87.45020000),
  ('Cambodia', 'KH', 'KHM', '855', 'KHR', 4031.66040000),
  ('Kiribati', 'KI', 'KIR', '686', 'KID', 1.42570000),
  ('Comoros', 'KM', 'COM', '269', 'KMF', 428.87950000),
  ('South Korea', 'KR', 'KOR', '82', 'KRW', 1536.23630000),
  ('Kuwait', 'KW', 'KWT', '965', 'KWD', 0.30810000),
  ('Cayman Islands', 'KY', 'CYM', '1345', 'KYD', 0.83330000),
  ('Kazakhstan', 'KZ', 'KAZ', '7', 'KZT', 487.94580000),
  ('Laos', 'LA', 'LAO', '856', 'LAK', 22026.62640000),
  ('Lebanon', 'LB', 'LBN', '961', 'LBP', 89500.00000000),
  ('Sri Lanka', 'LK', 'LKA', '94', 'LKR', 333.65820000),
  ('Liberia', 'LR', 'LBR', '231', 'LRD', 182.57560000),
  ('Lesotho', 'LS', 'LSO', '266', 'LSL', 16.43050000),
  ('Libya', 'LY', 'LBY', '218', 'LYD', 6.36070000),
  ('Morocco', 'MA', 'MAR', '212', 'MAD', 9.30770000),
  ('Moldova', 'MD', 'MDA', '373', 'MDL', 17.43870000),
  ('Madagascar', 'MG', 'MDG', '261', 'MGA', 4205.45780000),
  ('North Macedonia', 'MK', 'MKD', '389', 'MKD', 53.15740000),
  ('Myanmar', 'MM', 'MMR', '95', 'MMK', 2104.07410000),
  ('Mongolia', 'MN', 'MNG', '976', 'MNT', 3576.82800000),
  ('Macao', 'MO', 'MAC', '853', 'MOP', 8.07270000),
  ('Mauritania', 'MR', 'MRT', '222', 'MRU', 39.92590000),
  ('Mauritius', 'MU', 'MUS', '230', 'MUR', 47.48970000),
  ('Maldives', 'MV', 'MDV', '960', 'MVR', 15.45800000),
  ('Malawi', 'MW', 'MWI', '265', 'MWK', 1742.30630000),
  ('Mexico', 'MX', 'MEX', '52', 'MXN', 17.35500000),
  ('Malaysia', 'MY', 'MYS', '60', 'MYR', 4.11440000),
  ('Mozambique', 'MZ', 'MOZ', '258', 'MZN', 63.62150000),
  ('Namibia', 'NA', 'NAM', '264', 'NAD', 16.43050000),
  ('Nigeria', 'NG', 'NGA', '234', 'NGN', 1360.81670000),
  ('Nicaragua', 'NI', 'NIC', '505', 'NIO', 36.85790000),
  ('Norway', 'NO', 'NOR', '47', 'NOK', 9.72320000),
  ('Nepal', 'NP', 'NPL', '977', 'NPR', 151.05650000),
  ('New Zealand', 'NZ', 'NZL', '64', 'NZD', 1.73630000),
  ('Oman', 'OM', 'OMN', '968', 'OMR', 0.38450000),
  ('Panama', 'PA', 'PAN', '507', 'PAB', 1.00000000),
  ('Peru', 'PE', 'PER', '51', 'PEN', 3.39280000),
  ('Papua New Guinea', 'PG', 'PNG', '675', 'PGK', 4.38690000),
  ('Philippines', 'PH', 'PHL', '63', 'PHP', 60.65380000),
  ('Pakistan', 'PK', 'PAK', '92', 'PKR', 278.37520000),
  ('Poland', 'PL', 'POL', '48', 'PLN', 3.70710000),
  ('Paraguay', 'PY', 'PRY', '595', 'PYG', 6097.10020000),
  ('Qatar', 'QA', 'QAT', '974', 'QAR', 3.64000000),
  ('Romania', 'RO', 'ROU', '40', 'RON', 4.56520000),
  ('Serbia', 'RS', 'SRB', '381', 'RSD', 102.32420000),
  ('Russia', 'RU', 'RUS', '7', 'RUB', 73.33850000),
  ('Rwanda', 'RW', 'RWA', '250', 'RWF', 1467.79710000),
  ('Saudi Arabia', 'SA', 'SAU', '966', 'SAR', 3.75000000),
  ('Solomon Islands', 'SB', 'SLB', '677', 'SBD', 7.95630000),
  ('Seychelles', 'SC', 'SYC', '248', 'SCR', 14.53050000),
  ('Sudan', 'SD', 'SDN', '249', 'SDG', 511.66400000),
  ('Sweden', 'SE', 'SWE', '46', 'SEK', 9.57930000),
  ('Singapore', 'SG', 'SGP', '65', 'SGD', 1.29020000),
  ('Saint Helena', 'SH', 'SHN', '290', 'SHP', 0.75620000),
  ('Sierra Leone', 'SL', 'SLE', '232', 'SLE', 24.75640000),
  ('Sierra Leone (legacy)', 'SL', 'SLE', '232', 'SLL', 24756.35560000),
  ('Somalia', 'SO', 'SOM', '252', 'SOS', 571.46150000),
  ('Suriname', 'SR', 'SUR', '597', 'SRD', 37.53990000),
  ('South Sudan', 'SS', 'SSD', '211', 'SSP', 4708.21720000),
  ('São Tomé and Príncipe', 'ST', 'STP', '239', 'STN', 21.35820000),
  ('Syria', 'SY', 'SYR', '963', 'SYP', 113.11100000),
  ('Eswatini', 'SZ', 'SWZ', '268', 'SZL', 16.43050000),
  ('Thailand', 'TH', 'THA', '66', 'THB', 32.76820000),
  ('Tajikistan', 'TJ', 'TJK', '992', 'TJS', 9.27290000),
  ('Turkmenistan', 'TM', 'TKM', '993', 'TMT', 3.50090000),
  ('Tunisia', 'TN', 'TUN', '216', 'TND', 2.93980000),
  ('Tonga', 'TO', 'TON', '676', 'TOP', 2.38230000),
  ('Turkey', 'TR', 'TUR', '90', 'TRY', 46.44240000),
  ('Trinidad and Tobago', 'TT', 'TTO', '1868', 'TTD', 6.78090000),
  ('Tuvalu', 'TV', 'TUV', '688', 'TVD', 1.42570000),
  ('Taiwan', 'TW', 'TWN', '886', 'TWD', 31.63950000),
  ('Tanzania', 'TZ', 'TZA', '255', 'TZS', 2622.82230000),
  ('Ukraine', 'UA', 'UKR', '380', 'UAH', 44.94380000),
  ('Uganda', 'UG', 'UGA', '256', 'UGX', 3629.25510000),
  ('Uruguay', 'UY', 'URY', '598', 'UYU', 40.36130000),
  ('Uzbekistan', 'UZ', 'UZB', '998', 'UZS', 12124.62430000),
  ('Venezuela', 'VE', 'VEN', '58', 'VES', 607.39190000),
  ('Vietnam', 'VN', 'VNM', '84', 'VND', 26266.56340000),
  ('Vanuatu', 'VU', 'VUT', '678', 'VUV', 118.49270000),
  ('Samoa', 'WS', 'WSM', '685', 'WST', 2.71250000),
  ('Cameroon (XAF)', 'CM', 'CMR', '237', 'XAF', 571.83940000),
  ('Antigua and Barbuda (XCD)', 'AG', 'ATG', '1268', 'XCD', 2.70000000),
  ('Curaçao (XCG)', 'CW', 'CUW', '599', 'XCG', 1.79000000),
  ('International Monetary Fund (XDR)', 'XX', 'XXX', '0', 'XDR', 0.73590000),
  ('Senegal (XOF)', 'SN', 'SEN', '221', 'XOF', 571.83940000),
  ('French Polynesia (XPF)', 'PF', 'PYF', '689', 'XPF', 104.02930000),
  ('Yemen', 'YE', 'YEM', '967', 'YER', 238.93450000),
  ('South Africa', 'ZA', 'ZAF', '27', 'ZAR', 16.43120000),
  ('Zambia', 'ZM', 'ZMB', '260', 'ZMW', 17.82430000),
  ('Zimbabwe (ZWG)', 'ZW', 'ZWE', '263', 'ZWG', 26.75050000),
  ('Zimbabwe (ZWL)', 'ZW', 'ZWE', '263', 'ZWL', 26.75050000)
ON CONFLICT (currency_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  iso_alpha2 = EXCLUDED.iso_alpha2,
  iso_alpha3 = EXCLUDED.iso_alpha3,
  isd_code = EXCLUDED.isd_code,
  fx_rate_usd = EXCLUDED.fx_rate_usd,
  fx_base_code = EXCLUDED.fx_base_code,
  updated_at = NOW();

-- Example queries:
-- SELECT country_name, iso_alpha2, iso_alpha3, isd_code, currency_code, fx_rate_usd
-- FROM countries
-- WHERE iso_alpha2 = 'IN';
--
-- SELECT c.*, m.time_last_update_utc, m.time_next_update_utc
-- FROM countries c
-- CROSS JOIN fx_rate_metadata m
-- WHERE c.currency_code = 'INR';
